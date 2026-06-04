/**
 * Unified signal model — the analytical brain shared by the strategy router,
 * the risk gate, and the decision engine.
 *
 * It assembles a normalized SignalVector from four SoSoValue inputs:
 *   - momentum:    24h deltas across the asset universe (market-snapshot)
 *   - sectorTilt:  sector-spotlight 24h change %
 *   - newsConviction: sentiment derived from /news matched_currencies + engagement
 *   - etfFlow:     /etfs/summary-history net inflow trend (institutional positioning)
 *   - volatility:  dispersion of 24h deltas → feeds the risk gate
 *
 * Every field falls back to a deterministic, time-bucketed value when no
 * SoSoValue key is configured (or a fetch fails), so the zero-config demo keeps
 * producing a coherent, animated signal vector. The `source` field records
 * provenance per the project's no-overclaim rule.
 */

import {
  getEtfFlows,
  getMarketSnapshot,
  getNews,
  getSectorSpotlight,
  hasSosoKey,
  type MarketSnapshot,
  type NewsItem,
  type SectorSpotlightItem,
} from "./sosovalue";
import {
  buildNews,
  buildSectorSpotlight,
  deterministicMarketSnapshot,
  deterministicEtfFlows,
} from "./mock";
import type { EtfFlowPoint } from "./sosovalue";

export type StrategyScores = {
  momentum: number;
  index: number;
  news: number;
  balanced: number;
};

export type SignalVector = {
  // each in roughly [-1, 1] except volatility/newsConviction which are [0,1]/[-1,1]
  momentum: number; // breadth-weighted 24h momentum across the universe
  sectorTilt: number; // best-vs-worst sector spread → rotation strength
  newsConviction: number; // sentiment-weighted, engagement-scaled [-1,1]
  etfFlow: number; // normalized institutional net inflow trend [-1,1]
  volatility: number; // realized dispersion proxy [0,1]
  // raw context the UI / explanations can cite
  context: {
    btcChange24h: number;
    ethChange24h: number;
    topSector: string;
    topSectorChange: number;
    worstSector: string;
    worstSectorChange: number;
    bullishNews: number;
    bearishNews: number;
    etfNetInflow: number; // most recent day, USD
    etfTrend: "inflow" | "outflow" | "flat";
  };
  // strategy scores (0..100) derived FROM the vector above
  scores: StrategyScores;
  source: string;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
function round(n: number, p = 2) {
  const m = 10 ** p;
  return Math.round(n * m) / m;
}

// ---- component derivations ------------------------------------------------

function deriveMomentum(market: MarketSnapshot[]): { value: number; vol: number; btc: number; eth: number } {
  if (market.length === 0) return { value: 0, vol: 0.4, btc: 0, eth: 0 };
  const deltas = market.map((m) => m.change24h);
  const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  // breadth: fraction of universe up minus down
  const up = deltas.filter((d) => d > 0).length;
  const breadth = (2 * up) / deltas.length - 1; // [-1,1]
  // combine average momentum (scaled by ~8% saturating) with breadth
  const momentum = clamp(0.6 * (mean / 8) + 0.4 * breadth, -1, 1);
  // realized dispersion → volatility proxy, saturating around 6% stdev
  const variance = deltas.reduce((a, d) => a + (d - mean) ** 2, 0) / deltas.length;
  const stdev = Math.sqrt(variance);
  const vol = clamp(stdev / 6, 0, 1);
  const btc = market.find((m) => m.symbol.toUpperCase() === "BTC")?.change24h ?? mean;
  const eth = market.find((m) => m.symbol.toUpperCase() === "ETH")?.change24h ?? mean;
  return { value: momentum, vol, btc, eth };
}

function deriveSector(sectors: SectorSpotlightItem[]): {
  value: number;
  top: SectorSpotlightItem;
  worst: SectorSpotlightItem;
} {
  const fallback: SectorSpotlightItem = { sector: "—", change24h: 0 };
  if (sectors.length === 0) return { value: 0, top: fallback, worst: fallback };
  const sorted = [...sectors].sort((a, b) => b.change24h - a.change24h);
  const top = sorted[0];
  const worst = sorted[sorted.length - 1];
  // rotation strength: dispersion between best and worst sector, saturating ~12%
  const spread = (top.change24h - worst.change24h) / 12;
  // signed by whether risk-on (L1/AI leading) or risk-off (stables leading)
  const riskOn = /stable/i.test(top.sector) ? -1 : 1;
  const value = clamp(spread * riskOn, -1, 1);
  return { value, top, worst };
}

function deriveNews(news: NewsItem[]): { value: number; bullish: number; bearish: number } {
  if (news.length === 0) return { value: 0, bullish: 0, bearish: 0 };
  let num = 0;
  let den = 0;
  let bullish = 0;
  let bearish = 0;
  for (const n of news) {
    // engagement / conviction weight (default mid-weight when absent)
    const w = (n.conviction ?? 50) / 100;
    const dir = n.sentiment === "bullish" ? 1 : n.sentiment === "bearish" ? -1 : 0;
    if (dir > 0) bullish++;
    if (dir < 0) bearish++;
    num += dir * w;
    den += w;
  }
  const value = den === 0 ? 0 : clamp(num / den, -1, 1);
  return { value, bullish, bearish };
}

function deriveEtf(flows: EtfFlowPoint[]): {
  value: number;
  latest: number;
  trend: "inflow" | "outflow" | "flat";
} {
  if (flows.length === 0) return { value: 0, latest: 0, trend: "flat" };
  const recent = flows.slice(-5);
  const sum = recent.reduce((a, f) => a + f.totalNetInflow, 0);
  const latest = flows[flows.length - 1].totalNetInflow;
  // normalize by a ~$2B/5d saturating reference for spot BTC ETF complex
  const value = clamp(sum / 2_000_000_000, -1, 1);
  const trend = sum > 50_000_000 ? "inflow" : sum < -50_000_000 ? "outflow" : "flat";
  return { value, latest, trend };
}

// ---- strategy scoring -----------------------------------------------------

function scoreStrategies(v: {
  momentum: number;
  sectorTilt: number;
  newsConviction: number;
  etfFlow: number;
  volatility: number;
}): StrategyScores {
  const to100 = (n: number) => clamp(Math.round(50 + n * 50), 5, 98);
  // Momentum strategy: thrives on strong directional momentum + breadth, hurt by chop (high vol w/ no trend).
  const momentum = to100(
    0.7 * v.momentum + 0.2 * v.sectorTilt - 0.25 * (v.volatility - Math.abs(v.momentum)),
  );
  // Index strategy: best when momentum is muted and dispersion low (track the basket, don't fight it).
  const index = to100(0.55 * (1 - Math.abs(v.momentum)) * (1 - v.volatility) - 0.2 + 0.2 * v.etfFlow);
  // News strategy: driven by conviction + ETF positioning (institutional flow confirms the narrative).
  const news = to100(0.6 * v.newsConviction + 0.35 * v.etfFlow + 0.1 * v.sectorTilt);
  // Balanced: penalized by volatility, mild lift from positive flow — the default safe harbor.
  const balanced = to100(0.35 - 0.5 * v.volatility + 0.15 * v.etfFlow + 0.1 * v.momentum);
  return { momentum, index, news, balanced };
}

// ---- assembly -------------------------------------------------------------

export async function buildSignalVector(): Promise<SignalVector> {
  let market: MarketSnapshot[];
  let sectors: SectorSpotlightItem[];
  let news: NewsItem[];
  let etf: EtfFlowPoint[];
  let live = false;

  if (hasSosoKey()) {
    const [mRes, sRes, nRes, eRes] = await Promise.allSettled([
      getMarketSnapshot(),
      getSectorSpotlight(),
      getNews(8),
      getEtfFlows("BTC", "us", 14),
    ]);
    market = mRes.status === "fulfilled" ? (mRes.value.data ?? []) : deterministicMarketSnapshot();
    sectors = sRes.status === "fulfilled" ? (sRes.value.data ?? []) : buildSectorSpotlight();
    news = nRes.status === "fulfilled" ? (nRes.value.data ?? []) : buildNews(8);
    etf = eRes.status === "fulfilled" ? (eRes.value.data ?? []) : deterministicEtfFlows();
    live =
      mRes.status === "fulfilled" ||
      sRes.status === "fulfilled" ||
      nRes.status === "fulfilled" ||
      eRes.status === "fulfilled";
  } else {
    market = deterministicMarketSnapshot();
    sectors = buildSectorSpotlight();
    news = buildNews(8);
    etf = deterministicEtfFlows();
  }

  const mom = deriveMomentum(market);
  const sec = deriveSector(sectors);
  const nws = deriveNews(news);
  const etfd = deriveEtf(etf);

  const base = {
    momentum: round(mom.value, 3),
    sectorTilt: round(sec.value, 3),
    newsConviction: round(nws.value, 3),
    etfFlow: round(etfd.value, 3),
    volatility: round(mom.vol, 3),
  };

  return {
    ...base,
    context: {
      btcChange24h: round(mom.btc),
      ethChange24h: round(mom.eth),
      topSector: sec.top.sector,
      topSectorChange: round(sec.top.change24h),
      worstSector: sec.worst.sector,
      worstSectorChange: round(sec.worst.change24h),
      bullishNews: nws.bullish,
      bearishNews: nws.bearish,
      etfNetInflow: Math.round(etfd.latest),
      etfTrend: etfd.trend,
    },
    scores: scoreStrategies(base),
    source: live ? "SoSoValue/market+sector+news+etf" : "deterministic/signal-model (offline preview)",
  };
}
