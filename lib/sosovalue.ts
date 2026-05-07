const SOSO_BASE_URL = process.env.SOSO_BASE_URL ?? "https://openapi.sosovalue.com/openapi/v1";
const SOSO_API_KEY = process.env.SOSO_API_KEY;

const SOSO_NEWS_PATH = process.env.SOSO_NEWS_PATH ?? "/news/list";
const SOSO_SECTOR_PATH = process.env.SOSO_SECTOR_PATH ?? "/currency/sector-spotlight";

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
