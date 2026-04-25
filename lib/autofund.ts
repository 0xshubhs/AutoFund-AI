import { getIndexMarketSnapshot, getMarketSnapshot, getSectorSpotlight, MarketSnapshot } from "./sosovalue";

export type Allocation = {
  BTC: number;
  ETH: number;
  AI: number;
};

export type RebalanceDecision = {
  allocation: Allocation;
  reasons: string[];
  confidence: number;
};

export function computeAllocationFromSignals(market: MarketSnapshot[]): RebalanceDecision {
  const btc = market.find((item) => item.symbol.toUpperCase() === "BTC");
  const eth = market.find((item) => item.symbol.toUpperCase() === "ETH");

  let allocation: Allocation = { BTC: 0.4, ETH: 0.3, AI: 0.3 };
  const reasons: string[] = ["Starting from default balanced template (40/30/30)."];

  if (eth && eth.change24h > 2.5) {
    allocation = { BTC: 0.35, ETH: 0.4, AI: 0.25 };
    reasons.push("ETH 24h momentum is strong, increasing ETH weight.");
  }

  if (btc && btc.change24h < -1.5) {
    allocation = { BTC: 0.3, ETH: 0.35, AI: 0.35 };
    reasons.push("BTC weakness indicates sector rotation; increasing AI bucket.");
  }

  return {
    allocation,
    reasons,
    confidence: 0.8,
  };
}

export async function buildRebalanceDecision() {
  const [marketSnapshot, indexSnapshot, sectorSnapshot] = await Promise.all([
    getMarketSnapshot(),
    getIndexMarketSnapshot(),
    getSectorSpotlight(),
  ]);

  const decision = computeAllocationFromSignals(marketSnapshot.data ?? []);

  return {
    ...decision,
    metadata: {
      marketPoints: marketSnapshot.data?.length ?? 0,
      indexPoints: indexSnapshot.data?.length ?? 0,
      sectorPoints: sectorSnapshot.data?.length ?? 0,
      mode: "automatic",
      instrument: "spot",
      rebalanceFrequency: "hourly",
    },
  };
}

export async function executeSodexOrdersFromAllocation(allocation: Allocation) {
  // Placeholder for SoDEX EIP712 signed order flow.
  // This is intentionally separated so you can plug wallet signing next.
  return {
    status: "dry-run",
    message: "SoDEX execution scaffolding ready. Add EIP712 signer to send newOrder.",
    targetAllocation: allocation,
  };
}
