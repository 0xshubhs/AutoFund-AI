# Wave 3 — SHIPPED (changelog)

This wave took AutoFund from a mock-data, heuristic-AI prototype to a **live,
self-contained on-chain fund agent**: real SoSoValue market data + a real AI
model reasoning over it, running with zero configuration.

## 1. Live SoSoValue API integration (was mock-by-default)
`lib/sosovalue.ts` was rewritten against the **verified** SoSoValue OpenAPI v1.
The Wave 2 paths were never validated and were wrong; they now hit the real
endpoints and normalize the live `{ code, message, data }` snake_case responses
(24h change is a fraction → converted to %):
- `/currencies/{id}/market-snapshot` (with a cached symbol→`currency_id` map) —
  live BTC / ETH / SOL prices + 24h change on the dashboard benchmark row.
- `/currencies/sector-spotlight` — live sector heatmap.
- `/news` (`page_size`, `data.list`) — live news feed with real sources.
- `/etfs/summary-history` (`symbol` + `country_code`) — live BTC spot-ETF net
  inflow / outflow, feeding the signal model.
- `/indices/{ticker}/market-snapshot` — live SSI MAG7 index level.

**Rate discipline:** a server-side TTL cache (60–300s) sits in front of every
call so the dashboards' polling stays within the Demo plan's 10 req/min & 10k/mo
limits. Verified end-to-end: `source` labels read `SoSoValue/...`, health shows
`sosovalue.live: true`, real 2026 ETF-flow figures render.

## 2. Live AI reasoning — Qwen only (was heuristic-by-default)
The copilot, decision-reason enrichment, and the new Desk Brief run on a real
model out of the box: a self-hosted **vLLM server running
`Qwen/Qwen3-VL-8B-Instruct`** (`lib/ai.ts`). A `/models` liveness probe (cached)
makes the `/health` `live` flag and `X-Copilot-Mode` header honest; if the
endpoint is down, every AI path degrades to a deterministic heuristic so the app
never hard-fails.

## 3. NEW — AI Desk Brief
`/api/autofund/brief` generates a live 2–3 sentence opening note on the fund's
posture, top risk/opportunity, and next move from the current state. Cached
server-side (~90s) and surfaced as a card on `/dashboard`.

## 4. Zero-config, push-to-deploy
The SoSoValue key and the Qwen endpoint are **hardcoded**, so the app runs live
on Vercel with no environment variables. AI is the Qwen endpoint only (no
OpenAI/other provider). Health reports the active provider + real liveness.

_(Demo-key note: the hardcoded SoSoValue key is a Demo-plan key — 10k calls/mo,
no funds — intended for the judged demo.)_

---

# Wave 3 — Build Phase II plan (remaining, NOT yet built)

Theme: from a single-user, testnet-and-dry-run agent to a custodial-grade,
publishable financial primitive. Everything below is planned, not implemented.
Each item notes what it builds on from Wave 2 and any external gating.

---

## 1. SoDEX MAINNET execution (risk-gated, confirmation rail, circuit breaker)

Promote the Wave 2 testnet order path (`lib/sodex.ts`, base
`https://testnet-gw.sodex.dev/...`, chainId 138565) to mainnet
(`https://mainnet-gw.sodex.dev/...`, chainId 286623) once a whitelist key lands.

- **Real signing.** Replace the sha256 stand-in with real keccak256 and produce
  the `X-API-Sign` EIP-712 signature (0x01-prefixed byte) — either server-side
  with a managed key or, preferably, browser-side (see item 5).
- **Risk gate as a hard precondition.** Orders only fire when the Wave 2 risk
  gate passes; a failed gate blocks submission rather than just resizing.
- **Confirmation rail** above a configurable notional cap: a review-before-send
  modal showing the exact action, payloadHash, and slippage estimate.
- **Circuit breaker** on consecutive failed/rejected fills (e.g. 3 in a row →
  freeze execution, surface a banner, require manual re-arm).

## 2. Publishable user-defined SSI-style index (accurate scope)

Let users assemble a basket and pick a weighting methodology (equal,
market-cap, vol-adjusted, momentum).

- **Accuracy note:** creating a *new* on-chain SSI index via the SSI Protocol is
  **invite + committee gated** — we will NOT claim to mint new SSI indices.
  Instead, Wave 3 plans to (a) read existing SSI indices and their constituents
  via `/indices`, `/indices/{ticker}/constituents`,
  `/indices/{ticker}/market-snapshot`, and (b) support mint/redeem flows against
  **existing** indices on Base where permissionless. User-defined baskets remain
  off-chain "model portfolios" with backtest + tracking-error vs the real SSI
  benchmark, clearly labeled as not an on-chain index until/unless whitelisted.

## 3. Institutional analytics

A `/analytics` page — the report a DAO treasurer hands the board.

- Sharpe, Sortino, Calmar, max-drawdown distribution.
- Per-asset and per-strategy PnL attribution (which signal contributed alpha).
- Tracking error vs SSI and BTC; rolling correlation.
- An attribution heatmap. Built on the Wave 2 audit artifact + a new historical
  series source (SoSoValue klines / etfs summary-history over 30/90/365d).

## 4. Backtest engine

Deferred from Wave 2. New `/api/autofund/backtest` route pulls SoSoValue OHLCV
(`/currencies/{id}/klines`) and replays any of the four strategies over
30/90/365 days, outputting cumulative return vs BTC and SSI, max drawdown,
Sharpe, and a per-rebalance trade ledger with side-by-side A/B. Reuses the Wave
2 signal model + risk gate so the backtest matches live behavior exactly.

## 5. Browser wallet EIP-712 signing (RainbowKit + viem)

User keeps custody. RainbowKit + viem on the Execution page so the user signs
SoDEX orders client-side: chain switching (ValueChain), gas/notional preview,
review-before-sign modal. This is the real-signature piece that unblocks item 1
and removes the Wave 2 honesty caveat (no server-side private key, sha256
stand-in replaced by viem's keccak256 + `signTypedData`).

## 6. MarketMind signal ingest — DONE in Wave 2.5 (live wiring remains)

**Status: basic ingest shipped.** AutoFund now consumes a
`marketmind.autofund.signal/v1` JSON (paste/upload on the Risk Engine page, or
`MARKETMIND_SIGNAL_JSON` / `MARKETMIND_SIGNAL_URL` env) and feeds its
contradiction flag + conviction into the existing risk gate; the trade visibly
downsizes and the source reads "signal source: MarketMind". See `lib/marketmind.ts`.

Still deferred to Wave 3: a *live* polling subscription to a running MarketMind
service (vs paste/env), regime-vector reconciliation (not just the boolean), and
a bi-directional handshake so MarketMind can also consume AutoFund's positions.

## 7. Multi-account funds

One operator runs multiple funds with separate strategies and risk caps. Fund
switcher, per-fund NAV, consolidated reporting. Requires a persistence layer
(currently all state is deterministic/stateless).

## 8. On-chain WRITE path + settlement event logs

The Wave 2.5 keyless on-chain layer (`lib/chain.ts`) is READ-only — block
height, chainId, gas, and verified ERC-20 metadata (MAG7.ssi on Base). Wave 3
extends it to writes and richer reads:

- **Transaction broadcast** from a funded faucet/operator wallet on ValueChain
  testnet via `eth_sendRawTransaction` (signed with viem from item 5) — turning
  the dry-run SoDEX path into a real on-chain settlement.
- **Read SoDEX settlement event logs** via `eth_getLogs` (filter by the
  settlement contract address + topic) so each fill is verified against an
  on-chain event, and the NAV/equity book is priced from real settled balances
  (closes the simulated-NAV caveat) rather than the simulation.
- **Live MAG7.ssi NAV** — read constituent balances + the index contract state
  on Base to track real index NAV alongside the fund.

---

## Carried-over Wave 2 caveats to close in Wave 3

- Real keccak256 + EIP-712 signature (sha256 stand-in today).
- Verify the exact canonical field order SoDEX hashes and the live response
  wrapping against a real testnet key.
- Confirm the live `/etfs/summary-history` response shape (Wave 2 normalizer is
  tolerant but unverified against a key).
- Replace simulated NAV/equity curve with a real position-priced book once
  on-chain execution lands.

## Definition of done

A user connects a wallet, backtests a strategy, signs a SoDEX **mainnet** order
(risk-gated, behind the confirmation rail), lands a fill, downloads a signed
audit log, and watches a MarketMind contradiction auto-downsize a trade — with a
second user subscribing to a published model portfolio.
