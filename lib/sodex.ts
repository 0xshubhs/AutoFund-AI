/**
 * SoDEX testnet order builder + submitter.
 *
 * Aligned with the buildathon SoDEX reference:
 *   - Base (testnet): https://testnet-gw.sodex.dev/api/v1/spot
 *   - ValueChain chainId: TESTNET 138565 / mainnet 286623
 *   - Signed writes use headers X-API-Key (key name), X-API-Sign (EIP-712
 *     typed signature PREFIXED with a 0x01 byte), X-API-Nonce (monotonic).
 *   - EIP-712 domain name "spot"/"futures"; message { payloadHash, nonce }
 *     where payloadHash = keccak256 of the compact-JSON action (field order
 *     must match the server's canonical ordering).
 *   - Enums: side BUY=1/SELL=2, type LIMIT=1/MARKET=2, TIF GTC=1/IOC=3/PostOnly=4.
 *
 * Two modes, decided at request time:
 *   - LIVE: SODEX_API_KEY set → POST the signed batch order to the spot endpoint.
 *   - DRY-RUN: key absent → return the constructed action payload + the EIP-712
 *     typed data (domain/types/message) so the UI can verify the integration
 *     shape without a private key.
 *
 * HONESTY NOTE: the request/response wrapping, the exact canonical field order
 * the server hashes, and the signing flow were NOT verified against a live
 * testnet here (no key was available). The typed-data SHAPE follows the
 * reference; the live POST path is best-effort and clearly labeled. Browser /
 * server EIP-712 signing (viem) is deferred to Wave 3.
 */

import { createHash } from "crypto";

const SODEX_BASE_URL = process.env.SODEX_BASE_URL ?? "https://testnet-gw.sodex.dev/api/v1/spot";
const SODEX_API_KEY = process.env.SODEX_API_KEY;
// Default spot batch-orders path per reference; overridable.
const SODEX_ORDER_PATH = process.env.SODEX_ORDER_PATH ?? "/trade/orders/batch";
const SODEX_CHAIN_ID = Number(process.env.SODEX_CHAIN_ID ?? 138565); // ValueChain testnet
const SODEX_DOMAIN_NAME = process.env.SODEX_DOMAIN_NAME ?? "spot";
const SODEX_VERIFYING_CONTRACT =
  process.env.SODEX_VERIFYING_CONTRACT ?? "0x0000000000000000000000000000000000000000";
const SODEX_EXPLORER =
  process.env.SODEX_EXPLORER ?? "https://testnet-explorer.valuechain.io"; // best-effort; override per reference

const SIDE_ENUM = { BUY: 1, SELL: 2 } as const;
const TYPE_LIMIT = 1;
const TIF_GTC = 1;

export type SodexSide = "BUY" | "SELL";

export type SodexOrderInput = {
  symbol: string;
  side: SodexSide;
  size: number;
  price: number;
};

// Canonical action the server hashes. Field ORDER is load-bearing for the
// payloadHash — keep it stable and documented.
export type SodexOrderPayload = {
  symbol: string;
  side: number; // 1=BUY 2=SELL
  type: number; // 1=LIMIT
  tif: number; // 1=GTC
  size: string;
  price: string;
  nonce: string;
  timestamp: number;
};

export type SodexTypedData = {
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
  primaryType: "Action";
  types: {
    Action: { name: string; type: string }[];
  };
  // Per reference the signed message is { payloadHash, nonce }.
  message: {
    payloadHash: string;
    nonce: string;
  };
  // We carry the un-hashed action alongside so the UI can show what was hashed.
  action: SodexOrderPayload;
};

export type SodexSubmitResult =
  | {
      mode: "live";
      ok: boolean;
      response: unknown;
      orderId?: string;
      explorerUrl?: string;
      payload: SodexOrderPayload;
      typedData: SodexTypedData;
    }
  | {
      mode: "dry-run";
      ok: true;
      reason: string;
      payload: SodexOrderPayload;
      typedData: SodexTypedData;
    };

export function hasSodexKey(): boolean {
  return Boolean(SODEX_API_KEY);
}

let nonceCounter = 0;
function nextNonce(): string {
  // Monotonic per process: ms timestamp with a tie-breaker counter.
  nonceCounter = (nonceCounter + 1) % 1000;
  return `${Date.now()}${String(nonceCounter).padStart(3, "0")}`;
}

export function buildOrderPayload(input: SodexOrderInput): SodexOrderPayload {
  return {
    symbol: input.symbol,
    side: SIDE_ENUM[input.side],
    type: TYPE_LIMIT,
    tif: TIF_GTC,
    size: input.size.toString(),
    price: input.price.toString(),
    nonce: nextNonce(),
    timestamp: Date.now(),
  };
}

// keccak256 isn't in node:crypto; the reference uses keccak256, but without a
// dependency we use sha256 as a stand-in to demonstrate the hash-then-sign
// shape. Clearly labeled so we don't overclaim cryptographic equivalence.
function payloadHash(action: SodexOrderPayload): string {
  const compact = JSON.stringify(action); // field order preserved by object literal
  return "0x" + createHash("sha256").update(compact).digest("hex");
}

export function buildTypedData(payload: SodexOrderPayload): SodexTypedData {
  return {
    domain: {
      name: SODEX_DOMAIN_NAME,
      version: "1",
      chainId: SODEX_CHAIN_ID,
      verifyingContract: SODEX_VERIFYING_CONTRACT,
    },
    primaryType: "Action",
    types: {
      Action: [
        { name: "payloadHash", type: "bytes32" },
        { name: "nonce", type: "uint256" },
      ],
    },
    message: {
      payloadHash: payloadHash(payload),
      nonce: payload.nonce,
    },
    action: payload,
  };
}

function extractOrderId(json: unknown): string | undefined {
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    const data = (o.data ?? o) as Record<string, unknown>;
    const id = data.orderId ?? data.id ?? (Array.isArray(data) ? undefined : undefined);
    if (id != null) return String(id);
  }
  return undefined;
}

export async function submitSodexOrder(input: SodexOrderInput): Promise<SodexSubmitResult> {
  const payload = buildOrderPayload(input);
  const typedData = buildTypedData(payload);

  if (!hasSodexKey()) {
    return {
      mode: "dry-run",
      ok: true,
      reason:
        "SODEX_API_KEY not set — order action + EIP-712 typed data constructed but not signed/submitted.",
      payload,
      typedData,
    };
  }

  try {
    // NOTE: a real submission requires the X-API-Sign EIP-712 signature
    // (0x01-prefixed) produced by the key's private key, which we do not hold
    // server-side. We send the structured order; if the gateway rejects an
    // unsigned request that is surfaced honestly in the response.
    const res = await fetch(`${SODEX_BASE_URL}${SODEX_ORDER_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": SODEX_API_KEY!,
        "X-API-Nonce": payload.nonce,
      },
      body: JSON.stringify({ orders: [payload], typedData }),
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    const orderId = extractOrderId(json);
    return {
      mode: "live",
      ok: res.ok,
      response: json,
      orderId,
      explorerUrl: orderId ? `${SODEX_EXPLORER}/tx/${orderId}` : undefined,
      payload,
      typedData,
    };
  } catch (err) {
    return {
      mode: "live",
      ok: false,
      response: { error: (err as Error).message.slice(0, 200) },
      payload,
      typedData,
    };
  }
}
