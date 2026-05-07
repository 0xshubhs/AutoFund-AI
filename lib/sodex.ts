/**
 * SoDEX testnet order builder + submitter.
 *
 * Two modes, decided at request time:
 *   - LIVE: SODEX_BASE_URL + SODEX_API_KEY are set → POST to /v1/order/new
 *           (or whatever path SODEX_ORDER_PATH overrides to)
 *   - DRY-RUN: keys absent → return the constructed EIP-712 typed data + payload
 *              so the UI can show the would-be order without submitting it
 *
 * The order shape mirrors SoDEX's documented orderbook flow: {symbol, side,
 * type, size, price, nonce, timestamp} + EIP-712 signature. We don't sign in
 * dry-run because that would require a private key the user hasn't yet
 * provided — we surface the typed-data structure instead so the integration
 * is verifiable.
 */

const SODEX_BASE_URL = process.env.SODEX_BASE_URL ?? "https://testnet-api.sodex.com";
const SODEX_API_KEY = process.env.SODEX_API_KEY;
const SODEX_ORDER_PATH = process.env.SODEX_ORDER_PATH ?? "/v1/order/new";
const SODEX_CHAIN_ID = Number(process.env.SODEX_CHAIN_ID ?? 421614); // SoDEX testnet
const SODEX_VERIFYING_CONTRACT =
  process.env.SODEX_VERIFYING_CONTRACT ?? "0x0000000000000000000000000000000000000000";

export type SodexSide = "BUY" | "SELL";

export type SodexOrderInput = {
  symbol: string;
  side: SodexSide;
  size: number;
  price: number;
};

export type SodexOrderPayload = {
  symbol: string;
  side: SodexSide;
  type: "LIMIT";
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
  primaryType: "Order";
  types: {
    Order: { name: string; type: string }[];
  };
  message: SodexOrderPayload;
};

export type SodexSubmitResult =
  | {
      mode: "live";
      ok: boolean;
      response: unknown;
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

export function buildOrderPayload(input: SodexOrderInput): SodexOrderPayload {
  const now = Date.now();
  return {
    symbol: input.symbol,
    side: input.side,
    type: "LIMIT",
    size: input.size.toString(),
    price: input.price.toString(),
    nonce: `${now}-${Math.floor(Math.random() * 1e6)}`,
    timestamp: now,
  };
}

export function buildTypedData(payload: SodexOrderPayload): SodexTypedData {
  return {
    domain: {
      name: "SoDEX",
      version: "1",
      chainId: SODEX_CHAIN_ID,
      verifyingContract: SODEX_VERIFYING_CONTRACT,
    },
    primaryType: "Order",
    types: {
      Order: [
        { name: "symbol", type: "string" },
        { name: "side", type: "string" },
        { name: "type", type: "string" },
        { name: "size", type: "string" },
        { name: "price", type: "string" },
        { name: "nonce", type: "string" },
        { name: "timestamp", type: "uint256" },
      ],
    },
    message: payload,
  };
}

export async function submitSodexOrder(input: SodexOrderInput): Promise<SodexSubmitResult> {
  const payload = buildOrderPayload(input);
  const typedData = buildTypedData(payload);

  if (!hasSodexKey()) {
    return {
      mode: "dry-run",
      ok: true,
      reason: "SODEX_API_KEY not set — order constructed but not submitted.",
      payload,
      typedData,
    };
  }

  try {
    const res = await fetch(`${SODEX_BASE_URL}${SODEX_ORDER_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sodex-api-key": SODEX_API_KEY!,
      },
      body: JSON.stringify({ order: payload, typedData }),
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    return {
      mode: "live",
      ok: res.ok,
      response: json,
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
