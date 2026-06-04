const SOSO_BASE_URL = process.env.SOSO_BASE_URL ?? "https://openapi.sosovalue.com/openapi/v1";
const SOSO_API_KEY = process.env.SOSO_API_KEY;

const SOSO_NEWS_PATH = process.env.SOSO_NEWS_PATH ?? "/news/list";
const SOSO_SECTOR_PATH = process.env.SOSO_SECTOR_PATH ?? "/currency/sector-spotlight";
const SOSO_ETF_PATH = process.env.SOSO_ETF_PATH ?? "/etfs/summary-history";

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

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
};

export function hasSosoKey(): boolean {
  return Boolean(SOSO_API_KEY);
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!SOSO_API_KEY) {
    throw new Error("Missing SOSO_API_KEY");
  }

  const response = await fetch(`${SOSO_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "x-soso-api-key": SOSO_API_KEY,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`SoSoValue ${response.status} on ${path}`);
  }

  return (await response.json()) as T;
}

export async function getMarketSnapshot() {
  return request<{ data: MarketSnapshot[] }>("/currency/market-snapshot");
}

export async function getIndexMarketSnapshot() {
  return request<{ data: unknown[] }>("/index/market-snapshot");
}

export async function getSectorSpotlight() {
  return request<{ data: SectorSpotlightItem[] }>(SOSO_SECTOR_PATH);
}

export async function getNews(limit = 8) {
  return request<{ data: NewsItem[] }>(`${SOSO_NEWS_PATH}?limit=${limit}`);
}

/**
 * ETF flow history from SoSoValue's /etfs/summary-history endpoint.
 * Params verified from the buildathon API reference: symbol, country_code,
 * start_date, end_date. Response field names (total_net_inflow, cum_net_inflow,
 * date) are normalized into EtfFlowPoint here. We are tolerant to a couple of
 * shape variants because the live response wrapping was not directly verified.
 */
export async function getEtfFlows(
  symbol = "BTC",
  countryCode = "us",
  days = 14,
): Promise<{ data: EtfFlowPoint[] }> {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const qs = new URLSearchParams({
    symbol,
    country_code: countryCode,
    start_date: fmt(start),
    end_date: fmt(end),
  });
  const raw = await request<{ data?: unknown[] } | unknown[]>(`${SOSO_ETF_PATH}?${qs.toString()}`);
  const rows = (Array.isArray(raw) ? raw : (raw.data ?? [])) as Array<Record<string, unknown>>;
  const data: EtfFlowPoint[] = rows.map((r) => ({
    date: String(r.date ?? r.day ?? ""),
    totalNetInflow: Number(r.total_net_inflow ?? r.totalNetInflow ?? 0),
    cumNetInflow:
      r.cum_net_inflow != null || r.cumNetInflow != null
        ? Number(r.cum_net_inflow ?? r.cumNetInflow)
        : undefined,
  }));
  return { data };
}

/**
 * Lightweight reachability probe for the SoSoValue API. Used by /health and the
 * `source` provenance labels so the UI never claims "live" when the upstream is
 * actually unreachable or the key is missing.
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
