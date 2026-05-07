export type SeriesPoint = {
  t: string;
  ts: number;
  portfolio: number;
  btc: number;
  eth: number;
  index: number;
  risk: number;
  drawdown: number;
};

export type AllocationPoint = {
  t: string;
  l1: number;
  ai: number;
  defi: number;
  stable: number;
};

export type Holding = {
  symbol: string;
  weight: number;
  entryPrice: number;
  price: number;
  pnlPct: number;
  source: "SoSoValue" | "internal";
};

export type RiskBreakdown = {
  volatility: number;
  drawdown: number;
  liquidity: number;
  correlation: number;
  macro: number;
};

export type StrategyName = "momentum" | "index" | "news" | "balanced";

export type StrategyState = {
  active: StrategyName;
  scores: Record<StrategyName, number>;
  exposureCap: number;
  stableFloor: number;
  rebalanceTrigger: string;
};

export type Decision = {
  id: string;
  ts: number;
  summary: string;
  signals: { label: string; score: number }[];
  confidence: number;
  before: { symbol: string; weight: number }[];
  after: { symbol: string; weight: number }[];
  reasons: string[];
};

export type Order = {
  id: string;
  ts: number;
  pair: string;
  side: "BUY" | "SELL";
  size: number;
  price: number;
  status: "PENDING" | "PARTIAL" | "FILLED" | "FAILED";
  slippageBps: number;
  ackMs: number;
};

export type FundSummary = {
  nav: number;
  alpha24h: number;
  alphaMTD: number;
  alphaYTD: number;
  riskRegime: "Calm" | "Moderate" | "Elevated" | "Stressed";
  riskScore: number;
  exposureCap: number;
  uptime: number;
  updatedAt: number;
};

export type ApiEnvelope<T> = {
  ok: true;
  data: T;
  source: string;
  generatedAt: number;
} | {
  ok: false;
  error: string;
  generatedAt: number;
};
