import { NextResponse } from "next/server";
import {
  RPC,
  SSI_TOKEN_ADDRESS,
  readChainStatus,
  readErc20,
  type ChainStatus,
  type Erc20Read,
} from "@/lib/chain";

export const runtime = "nodejs";
export const revalidate = 0;

/**
 * Real, FREE, keyless on-chain proof. No API key, no web3 dependency — plain
 * JSON-RPC reads against public ValueChain + Base nodes. This works in the
 * zero-config demo and is the live-chain credibility anchor for the audit log.
 *
 * Cached briefly (server-side, a few seconds) to avoid hammering public RPCs
 * on repeated polls.
 */

type Payload = {
  valuechain: {
    chainId: number | null;
    blockNumber: number | null;
    blockTimestamp: number | null;
    gasPriceGwei: number | null;
    live: boolean;
  };
  base: { chainId: number | null; blockNumber: number | null; live: boolean };
  ssiToken: {
    address: string;
    chainId: number | null;
    symbol: string | null;
    decimals: number | null;
    totalSupply: string | null;
    live: boolean;
    note: string;
  };
};

let cache: { at: number; body: { ok: boolean; data: Payload; source: string; generatedAt: number } } | null = null;
const CACHE_TTL = 4000; // ms

async function build(): Promise<{ ok: boolean; data: Payload; source: string; generatedAt: number }> {
  const [vc, base, ssi]: [ChainStatus, ChainStatus, Erc20Read] = await Promise.all([
    readChainStatus(RPC.valuechain, { gas: true }),
    readChainStatus(RPC.base),
    readErc20(RPC.base, SSI_TOKEN_ADDRESS),
  ]);

  const anyLive = vc.live || base.live;
  return {
    ok: true,
    data: {
      valuechain: {
        chainId: vc.chainId,
        blockNumber: vc.blockNumber,
        blockTimestamp: vc.blockTimestamp,
        gasPriceGwei: vc.gasPriceGwei,
        live: vc.live,
      },
      base: { chainId: base.chainId, blockNumber: base.blockNumber, live: base.live },
      ssiToken: {
        address: ssi.address,
        chainId: ssi.chainId,
        symbol: ssi.symbol,
        decimals: ssi.decimals,
        totalSupply: ssi.totalSupply,
        live: ssi.live,
        note: ssi.live
          ? "Verified SoSoValue MAG7.ssi index token on Base (keyless eth_call)."
          : "Optional ERC-20 read unavailable; block-level reads are the live proof.",
      },
    },
    source: anyLive
      ? "on-chain · keyless JSON-RPC · ValueChain L1 + Base"
      : "on-chain · RPC unreachable (fallback)",
    generatedAt: Date.now(),
  };
}

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_TTL) {
    return NextResponse.json(cache.body);
  }
  const body = await build();
  cache = { at: Date.now(), body };
  return NextResponse.json(body);
}
