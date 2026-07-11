// SoSoValue OpenAPI v1 client — verified against the live API (Wave 3).
//
// Base https://openapi.sosovalue.com/openapi/v1 , header `x-soso-api-key`.
// All endpoints are GET; responses are wrapped `{ code, message, data }` with
// snake_case fields and 24h changes as FRACTIONS (0.0056 = +0.56%). This module
// normalizes everything into the app's typed shapes. A small in-memory TTL cache
// keeps us under the Demo plan's 10 req/min ceiling — the dashboards poll every
// few seconds but repeated hits are served from cache, not the API.
const SOSO_BASE_URL = "https://openapi.sosovalue.com/openapi/v1";
// Hardcoded Demo key so the app runs live with zero config (no env on Vercel).
const SOSO_API_KEY = "SOSO-ed3a4f77582943bab2b77556662acdb6";

const SOSO_SECTOR_PATH = process.env.SOSO_SECTOR_PATH ?? "/currencies/sector-spotlight";
const SOSO_NEWS_PATH = process.env.SOSO_NEWS_PATH ?? "/news";
const SOSO_ETF_PATH = process.env.SOSO_ETF_PATH ?? "/etfs/summary-history";

// Universe surfaced on the dashboard benchmark row. Kept small so a full refresh
// stays within rate limits (one snapshot call per symbol, all cached).
const MARKET_UNIVERSE = (process.env.SOSO_UNIVERSE ?? "btc,eth,sol")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const INDEX_TICKER = process.env.SOSO_INDEX_TICKER ?? "ssiMAG7";

export type MarketSnapshot = {
  symbol: string;
  price: number;
  change24h: number;
};

export type SectorSpotlightItem = {
  sector: string;
  change24h: number;
  marketCap?: number;
  topGainer?: string;
  topGainerChange?: number;
  topLoser?: string;
  topLoserChange?: number;
};

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  url?: string;
  publishedAt: number;
  sentiment?: "bullish" | "bearish" | "neutral";
  conviction?: number;
  symbols?: string[];
};

export type EtfFlowPoint = {
  date: string;
  totalNetInflow: number; // negative = outflow (SoSoValue semantics)
  cumNetInflow?: number;
};

export function hasSosoKey(): boolean {
  return Boolean(SOSO_API_KEY);
}

// --- cached GET that unwraps the { code, message, data } envelope ------------

const cache = new Map<string, { at: number; data: unknown }>();
const DEFAULT_TTL_MS = 60_000;

async function cachedGet<T>(path: string, ttlMs = DEFAULT_TTL_MS): Promise<T> {
  if (!SOSO_API_KEY) throw new Error("Missing SOSO_API_KEY");

  const now = Date.now();
  const hit = cache.get(path);
  if (hit && now - hit.at < ttlMs) return hit.data as T;

  const response = await fetch(`${SOSO_BASE_URL}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", "x-soso-api-key": SOSO_API_KEY },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`SoSoValue ${response.status} on ${path}`);

  const body = (await response.json()) as { code?: number; message?: string; data?: unknown };
  if (body.code !== undefined && body.code !== 0) {
    throw new Error(`SoSoValue code ${body.code} on ${path}: ${body.message ?? ""}`);
  }
  const data = (body.data ?? body) as T;
  cache.set(path, { at: now, data });
  return data;
}

const pct = (frac: unknown): number => Math.round(Number(frac ?? 0) * 100 * 100) / 100;

// --- currency id resolution (symbol -> currency_id), cached 1h ---------------

let idMap: { at: number; map: Map<string, string> } | null = null;

async function getCurrencyIdMap(): Promise<Map<string, string>> {
  const now = Date.now();
  if (idMap && now - idMap.at < 3_600_000) return idMap.map;
  const rows = await cachedGet<Array<{ currency_id: string; symbol: string }>>("/currencies", 3_600_000);
  const map = new Map<string, string>();
  for (const r of rows) if (r?.symbol) map.set(String(r.symbol).toLowerCase(), String(r.currency_id));
  idMap = { at: now, map };
  return map;
}

// --- public API (each returns the { data } contract the routes expect) -------

export async function getMarketSnapshot(): Promise<{ data: MarketSnapshot[] }> {
  const map = await getCurrencyIdMap();
  const out: MarketSnapshot[] = [];
  for (const sym of MARKET_UNIVERSE) {
    const id = map.get(sym);
    if (!id) continue;
    try {
      const snap = await cachedGet<{ price?: number; change_pct_24h?: number }>(
        `/currencies/${id}/market-snapshot`,
        90_000,
      );
      out.push({ symbol: sym.toUpperCase(), price: Number(snap.price ?? 0), change24h: pct(snap.change_pct_24h) });
    } catch {
      // skip a single failed symbol rather than failing the whole snapshot
    }
  }
  if (out.length === 0) throw new Error("SoSoValue market-snapshot returned no symbols");
  return { data: out };
}

export async function getIndexMarketSnapshot(): Promise<{ data: MarketSnapshot[] }> {
  const snap = await cachedGet<{ price?: number; change_pct_24h?: number }>(
    `/indices/${INDEX_TICKER}/market-snapshot`,
    90_000,
  );
  return { data: [{ symbol: INDEX_TICKER, price: Number(snap.price ?? 0), change24h: pct(snap.change_pct_24h) }] };
}

export async function getSectorSpotlight(): Promise<{ data: SectorSpotlightItem[] }> {
  const d = await cachedGet<{ sector?: Array<{ name: string; change_pct_24h: number; marketcap_dom?: number }> }>(
    SOSO_SECTOR_PATH,
    90_000,
  );
  const rows = Array.isArray(d.sector) ? d.sector : [];
  const data: SectorSpotlightItem[] = rows.map((s) => ({
    sector: String(s.name),
    change24h: pct(s.change_pct_24h),
    marketCap: s.marketcap_dom != null ? pct(s.marketcap_dom) : undefined,
  }));
  return { data };
}

type RawNews = {
  id?: string | number;
  title?: string;
  author?: string;
  release_time?: string | number;
  source_link?: string;
  original_link?: string;
  matched_currencies?: Array<{ symbol?: string } | string>;
};

function hostOf(u?: string): string | undefined {
  if (!u) return undefined;
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export async function getNews(limit = 8): Promise<{ data: NewsItem[] }> {
  const d = await cachedGet<{ list?: RawNews[] }>(`${SOSO_NEWS_PATH}?page_size=${limit}&language=en`, 60_000);
  const rows = Array.isArray(d.list) ? d.list : [];
  const data: NewsItem[] = rows.slice(0, limit).map((n, i) => ({
    id: String(n.id ?? i),
    title: String(n.title ?? "").trim(),
    source: n.author || hostOf(n.original_link) || hostOf(n.source_link) || "SoSoValue",
    url: n.original_link || n.source_link,
    publishedAt: Number(n.release_time ?? Date.now()),
    symbols: Array.isArray(n.matched_currencies)
      ? n.matched_currencies
          .map((c) => (typeof c === "string" ? c : c?.symbol))
          .filter(Boolean)
          .map((s) => String(s).toUpperCase())
      : undefined,
  }));
  return { data };
}

/**
 * ETF flow history from `/etfs/summary-history` (GET). Verified params:
 * symbol (req), country_code (req, `US`/`HK`), start_date/end_date/limit (opt).
 * Range is limited to the most recent ~1 month by the API. `total_net_inflow`
 * is raw USD (negative = outflow); `cum_net_inflow` is cumulative.
 */
export async function getEtfFlows(
  symbol = "BTC",
  countryCode = "US",
  days = 14,
): Promise<{ data: EtfFlowPoint[] }> {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const qs = new URLSearchParams({
    symbol: symbol.toUpperCase(),
    country_code: countryCode.toUpperCase(),
    start_date: fmt(start),
    end_date: fmt(end),
    limit: String(Math.min(300, days + 5)),
  });
  const rows = await cachedGet<Array<Record<string, unknown>>>(`${SOSO_ETF_PATH}?${qs.toString()}`, 300_000);
  const data: EtfFlowPoint[] = (Array.isArray(rows) ? rows : [])
    .map((r) => ({
      date: String(r.date ?? ""),
      totalNetInflow: Number(r.total_net_inflow ?? 0),
      cumNetInflow: r.cum_net_inflow != null ? Number(r.cum_net_inflow) : undefined,
    }))
    .reverse(); // API returns newest-first; charts want oldest-first
  return { data };
}

/**
 * Reachability probe. Cheap single GET (sector spotlight) so /health + the
 * `source` labels never claim "live" when the upstream is unreachable.
 */
export async function probeSoso(timeoutMs = 2500): Promise<boolean> {
  if (!SOSO_API_KEY) return false;
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    const res = await fetch(`${SOSO_BASE_URL}${SOSO_SECTOR_PATH}`, {
      method: "GET",
      headers: { "x-soso-api-key": SOSO_API_KEY },
      cache: "no-store",
      signal: ac.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}
