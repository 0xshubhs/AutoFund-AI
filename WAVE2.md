# Wave 2 — Build Phase I changelog

This document is a precise, factual record of what Wave 2 changed. Each item is
labeled **real** (actually executes / fetches), **mock-fallback** (deterministic
generator used when no key is set, or when a live fetch fails), or **dry-run**
(constructed but not submitted). The zero-config demo (`npm run dev`, no `.env`)
is preserved: every public route still degrades to deterministic mock, and the
`source` field on every envelope reports provenance honestly.

Build: `npm run build` clean. Lint: `npm run lint` clean. Next.js 16.2.4.

---

## Feature 1 — Hero "Run Trading Cycle" wired to the real pipeline

**Status: real (mock-fallback when offline).**

`app/components/DemoCycleContext.tsx` was a pure `setTimeout` animation hitting
no backend. It is now an async state machine that drives the six steps from
real responses:

- Steps Ingest → Score → Risk-gate → Reason are backed by a single
  `POST /api/autofund/rebalance` call (which runs the real signal model + risk
  gate). The decision (raw + gated allocation, confidence, reasons, gates,
  signal vector, suggested order) is stored in context.
- Step Execute issues `POST /api/autofund/sodex-order` with the decision's
  `suggestedOrder` (top allocation move) and stores the constructed EIP-712
  order (+ testnet result if creds present; dry-run otherwise).
- Step Settle finalizes. The cycle is cancellable (run-id guard) and falls back
  to pure animation if a fetch fails. A label shows "real pipeline" vs
  "animation fallback" plus the data source.

`app/components/DemoCyclePanel.tsx` now renders the live decision under the step
strip: raw-vs-gated allocation bars (moved weights highlighted amber), the risk
gate checklist (✓/✗ per gate), the reasoning trail, and the executed SoDEX
order with order id + explorer link (live) or dry-run note.

Files: `DemoCycleContext.tsx`, `DemoCyclePanel.tsx`, `app/api/autofund/rebalance/route.ts`.

## Feature 2 — Real multi-signal allocation model

**Status: real (mock-fallback).**

- New `lib/signals.ts` builds a unified `SignalVector` from four SoSoValue
  inputs via `Promise.allSettled` (momentum from market-snapshot 24h deltas +
  breadth, sector tilt from sector-spotlight, news conviction derived from
  `/news` sentiment × conviction weighting, ETF flow from summary-history) plus
  a realized-volatility proxy (dispersion of 24h deltas). It then computes the
  four strategy scores (momentum / index / news / balanced) **from** this
  vector — replacing the previous random generation.
- `lib/autofund.ts::computeAllocationFromSignals` replaced the two hardcoded
  `if` thresholds with a genuine model: a risk-on appetite blend of the four
  directional signals tilts BTC / ETH / AI / cash weights, each asset weighted
  by its own relevant signal mix. Reasons cite the live numbers.
- `lib/mock.ts::buildStrategyState(scores?)` now accepts injected signal-derived
  scores; the deterministic random path remains only as the no-data fallback.
  New deterministic generators `deterministicMarketSnapshot()` and
  `deterministicEtfFlows()` feed the signal model offline.
- `/api/autofund/strategy` now returns the signal vector + per-strategy
  plain-English explanations; `/strategy` page renders a Signal Vector panel
  and uses the explanations on each score bar.

Files: `lib/signals.ts` (new), `lib/autofund.ts`, `lib/mock.ts`,
`app/api/autofund/strategy/route.ts`, `app/strategy/page.tsx`.

## Feature 3 — Visible risk gate that actually resizes / vetoes

**Status: real (mock-fallback).**

- `lib/autofund.ts::applyRiskGate` computes a volatility-derived exposure cap
  and stable floor, then **actually clamps** the raw target before it reaches
  the SoDEX step: a vol gate scales the risky sleeve into cash, a position cap
  clamps single-asset weights, a stable floor enforces minimum cash, a slippage
  budget gate, and a **contradiction guard** that cuts the risky sleeve 40% when
  an external signal disagrees (the future MarketMind input).
- The rebalance response returns `rawAllocation` vs `allocation` (gated) plus a
  per-gate checklist with pass/fail + rationale and a `downsized` flag.
- New `app/components/RiskGatePanel.tsx` on the `/settings` page renders the
  raw-vs-gated bars and the gate checklist live, with an "inject contradiction
  signal" toggle that re-runs the gate and visibly downsizes the trade — the
  judge moment. Verified: with the flag on, BTC drops from ~39% to ~15% and cash
  rises to ~57%, with vol/slippage/contradiction gates showing ✗.

Files: `lib/autofund.ts`, `app/components/RiskGatePanel.tsx` (new),
`app/settings/page.tsx`.

## Feature 4 — ETF flows as the fifth signal

**Status: real (mock-fallback).**

- `lib/sosovalue.ts::getEtfFlows()` hits `/etfs/summary-history` with the
  reference params (symbol, country_code, start_date, end_date) and normalizes
  `total_net_inflow` / `cum_net_inflow` / `date` into `EtfFlowPoint[]` (negative
  = outflow). Tolerant to a couple of response-shape variants (the exact live
  wrapping was not verified against a key).
- Fed into the allocation model via the signal vector (`etfFlow` normalized to
  [-1,1], 5-day trend), and surfaced on the dashboard via the new
  `app/components/InstitutionalPanel.tsx` (ETF net flow, flow signal, BTC/ETH
  live 24h prices).

Files: `lib/sosovalue.ts`, `lib/signals.ts`, `lib/mock.ts`,
`app/components/InstitutionalPanel.tsx` (new), `app/dashboard/page.tsx`.

## Feature 5 — Surface the real market/index data that was hidden

**Status: real (mock-fallback).**

- New `GET /api/autofund/markets` exposes the currency market-snapshot (and SSI
  index snapshot when available) that was coded in `lib/sosovalue.ts` but never
  reached the UI. The `InstitutionalPanel` binds real BTC/ETH prices + 24h
  change to the dashboard with an honest source label. NAV/equity curve remain
  simulated (clearly the case), but the benchmark prices are now real when a key
  is set.

Files: `app/api/autofund/markets/route.ts` (new), `app/components/InstitutionalPanel.tsx`.

## Feature 6 — Per-decision reasoning + confidence + audit-log export

**Status: real.**

- Every decision already carries confidence + reasons; confidence is now derived
  (signal agreement minus volatility drag) rather than a constant. The AI
  copilot enrichment (`lib/ai.ts`) is preserved with heuristic fallback.
- New `GET /api/autofund/audit` returns a self-contained `autofund.audit.v1`
  artifact: latest decision's signal vector, raw vs risk-gated weights, every
  gate pass/fail + rationale, confidence, reasons, and the decision history.
- New `app/components/AuditExportButton.tsx` on the `/reasoning` page downloads
  it as a timestamped JSON file (the DAO-treasurer "prove it" artifact).

Files: `app/api/autofund/audit/route.ts` (new),
`app/components/AuditExportButton.tsx` (new), `app/reasoning/page.tsx`,
`lib/autofund.ts`.

## Feature 7 — SoDEX testnet order alignment

**Status: dry-run by default; real testnet attempt when `SODEX_API_KEY` set.**

`lib/sodex.ts` rewritten to align with the verified testnet reference:

- Base URL `https://testnet-gw.sodex.dev/api/v1/spot`, path
  `/trade/orders/batch`, ValueChain testnet chainId `138565`, domain name
  `"spot"`, headers `X-API-Key` / `X-API-Nonce` (monotonic).
- Order action uses the reference enums (side BUY=1/SELL=2, type LIMIT=1, TIF
  GTC=1) with a documented, order-stable field layout for hashing.
- EIP-712 typed data now models the reference message `{ payloadHash, nonce }`
  (primaryType `Action`), carrying the un-hashed action alongside for display.
- When `SODEX_API_KEY` is present, live mode POSTs the structured order to the
  testnet gateway and surfaces order id + an explorer link (env
  `SODEX_EXPLORER`); otherwise dry-run returns the constructed action + typed
  data (existing behavior, now with the corrected shape).

**Honesty note (in code comments too):** keccak256 is referenced by SoDEX but is
not in `node:crypto`; without adding a dep we use sha256 as a clearly-labeled
stand-in to demonstrate the hash-then-sign shape. The `X-API-Sign` EIP-712
signature (0x01-prefixed) is **not** produced server-side — we do not hold the
key's private key — so a live POST is best-effort and will be rejected by a
gateway that requires the signature. Full browser/server EIP-712 signing (viem)
is deferred to Wave 3. The typed-data SHAPE follows the reference; the exact
canonical field order the server hashes and the response wrapping were not
verified against a live key.

Files: `lib/sodex.ts`, `app/components/PlaceOrderButton.tsx`,
`app/api/autofund/sodex-order/route.ts`.

## Feature 8 — Caveat fixes a sharp judge would catch

**Status: real.**

- `lib/ai.ts`: `hasAI()` is now a real config check (returns false when
  `AI_BASE_URL` is unset) instead of always `true`. Added `probeAI()` — a
  cached (30s) reachability ping to `/v1/models`. The hardcoded RunPod URL was
  removed; `AI_BASE_URL` / `AI_MODEL` come from env with a safe empty fallback
  (→ heuristic mode).
- `/api/autofund/reasoning`, `/api/autofund/copilot`, and `/api/autofund/health`
  now use `probeAI()` so `source` labels and the `X-Copilot-Mode` header never
  claim "AI live" when the endpoint is unreachable or unconfigured.
- `lib/sosovalue.ts::probeSoso()` added; `/api/autofund/health` now reports
  `configured` vs `live` for AI, SoSoValue, and SoDEX honestly. With no keys,
  all `live` flags report `false`.

Files: `lib/ai.ts`, `lib/sosovalue.ts`,
`app/api/autofund/{reasoning,copilot,health}/route.ts`.

---

## New env vars (all optional, all degrade to mock/dry-run)

```
SOSO_ETF_PATH       # default /etfs/summary-history
AI_BASE_URL         # default unset → AI disabled, heuristic copilot
AI_MODEL            # default Qwen/Qwen3-VL-8B-Instruct
SODEX_BASE_URL      # default https://testnet-gw.sodex.dev/api/v1/spot
SODEX_ORDER_PATH    # default /trade/orders/batch
SODEX_CHAIN_ID      # default 138565 (ValueChain testnet)
SODEX_DOMAIN_NAME   # default "spot"
SODEX_EXPLORER      # default best-effort testnet explorer base
```

## New / changed API routes

- New: `POST` body `{contradictionFlag?}` on `/api/autofund/rebalance` (now
  envelope-wrapped with raw/gated/gates/signals/suggestedOrder).
- New: `GET /api/autofund/markets`, `GET /api/autofund/audit`.
- Changed: `/api/autofund/strategy` (signal-derived scores + explanations),
  `/api/autofund/health` (configured vs live probes), reasoning/copilot (probe).

## Verified in smoke test (no keys)

- All 7 pages return 200; no runtime errors in the dev log.
- `/rebalance` returns a structured decision; vol gate fires and downsizes.
- Contradiction flag visibly de-risks (BTC 39%→15%, cash →57%).
- `/sodex-order` dry-run constructs the Action typed data with payloadHash.
- `/audit` exports the full artifact; `/strategy` scores come from the signal
  vector; `/health` reports all `live:false` honestly.

## Deferred to Wave 3 (see WAVE3.md)

Browser/server EIP-712 signing with a real private key (viem/RainbowKit), real
keccak256, mainnet execution, backtest engine, and consuming a live MarketMind
contradiction signal (the gate input exists; the producer does not yet).

---

# Wave 2.5 — OpenAI copilot, keyless on-chain layer, MarketMind coupling

Three additions layered on top of the Wave 2 build. The zero-config mock demo is
preserved: every new path degrades gracefully and `source` labels stay honest.
Build clean, lint clean (Next 16.2.4). Smoke-tested with no keys.

## Feature 9 — AI copilot swapped to OpenAI (env-driven)

**Status: real with `OPENAI_API_KEY` / heuristic without.**

`lib/ai.ts` was rewritten to call OpenAI Chat Completions via the official
`openai` SDK (now a dependency) instead of the old hardcoded RunPod/Qwen host.

- Model from `OPENAI_MODEL` (default `gpt-4o-mini`); key from `OPENAI_API_KEY`;
  optional `OPENAI_BASE_URL` gateway override. No key is ever hardcoded.
- `streamCopilotAnswer` streams plain-text deltas; `enrichDecisionReasons`
  requests structured JSON (`response_format: json_object`) and parses
  `{reasons[], confidence}`.
- The Wave 2 heuristic fallback is preserved: with no key (or on any API error)
  the copilot yields a clearly-labeled heuristic answer and reasons fall back to
  the decision's deterministic reasons.
- `hasAI()` reflects real config (true only when `OPENAI_API_KEY` is set).
  `probeAI()` is a config check (returns `hasAI()`) — it does NOT spend tokens
  on every health hit. `source` / `X-Copilot-Mode` only say "ai" with a key.
  `/health` reports provider `openai (configured)` vs `none`.
- Verified (no key): `X-Copilot-Mode: heuristic`, model `gpt-4o-mini`, body is
  the heuristic narration. `.env.example` documents `OPENAI_API_KEY` /
  `OPENAI_MODEL`; `.env*` is gitignored.

Files: `lib/ai.ts`, `app/api/autofund/health/route.ts`, `.env.example` (new),
`package.json` (openai dep).

## Feature 10 — Keyless on-chain layer (REAL chain reads)

**Status: REAL. Keyless, free, no web3 dependency.**

New `lib/chain.ts`: a plain `fetch` JSON-RPC client (timeouts + try/catch,
degrades to `{ live:false }`). No new deps — hex decoded by hand.

- `eth_chainId`, `eth_blockNumber`, `eth_gasPrice`, `eth_getBlockByNumber`
  (latest, real timestamp) against **ValueChain mainnet** (`rpc.valuechain.xyz`,
  chainId **286623**, Geth) and **Base mainnet** (`mainnet.base.org`, 8453).
  All verified live.
- Generic `ethCall(to,data)` + a minimal ERC-20 reader (`symbol`, `decimals`,
  `totalSupply`, `balanceOf`). The **SoSoValue MAG7.ssi** index token on Base
  (`0x9E6A46f294bB67c20F1D1E7AfB0bBEf614403B55`) is VERIFIED on-chain:
  `symbol()` returns `"MAG7.ssi"`, `decimals()` 8, with a real `totalSupply`
  (confirmed via BaseScan + SoSoValue docs + a live keyless `eth_call`).
  Address overridable via `SSI_TOKEN_ADDRESS`; no unverified address is
  hardcoded — block-level reads are the live proof regardless.
- New `GET /api/autofund/onchain` (cached ~4s) returns
  `{ valuechain:{chainId,blockNumber,blockTimestamp,gasPriceGwei,live},
  base:{chainId,blockNumber,live}, ssiToken:{...}, source, generatedAt }`.
  **Proven live (no key):** chainId 286623, block #10,069,525, Base 8453,
  MAG7.ssi symbol/decimals/supply all real.
- UI: new `OnChainProofStrip` in the header on every page — ticking ValueChain
  block height + chainId + last-block age + gas, labeled
  "ValueChain L1 · live · no API key".
- Tied into the demo cycle's **Settle** step (shows "Decision anchored to
  ValueChain L1 block #N") and the **audit** artifact, which now embeds an
  `onchainAnchor` (chainId/blockNumber/blockTimestamp, keyless) referencing a
  real chain height.

Files: `lib/chain.ts` (new), `app/api/autofund/onchain/route.ts` (new),
`app/components/OnChainProofStrip.tsx` (new), `app/components/AutoFundLayout.tsx`,
`app/components/DemoCycleContext.tsx`, `app/components/DemoCyclePanel.tsx`,
`app/api/autofund/audit/route.ts`.

## Feature 11 — Consume the MarketMind signal (coupling)

**Status: real, self-contained (no runtime dependency on the MarketMind repo).**

New `lib/marketmind.ts` parses/validates a `marketmind.autofund.signal/v1`
object (target weights + conviction + contradiction flag + recommendedAction),
normalizing conviction to 0..1 and deriving the contradiction flag from either
the explicit boolean OR a high-conviction "reduce/cut/de-risk" action.

- `/api/autofund/rebalance` accepts an optional `marketmindSignal` in the POST
  body (and can read one from `MARKETMIND_SIGNAL_JSON` / `MARKETMIND_SIGNAL_URL`
  env). When present, its contradiction flag feeds the EXISTING risk-gate
  contradiction input; the response carries a `marketmind` block and `source`
  appends "signal source: MarketMind".
- UI: the `RiskGatePanel` (Risk Engine page) gains a MarketMind ingest box —
  paste/clear the signal JSON + a "Load sample" button — showing "signal
  source: MarketMind · conviction X% · contradicts/agrees". With no signal it
  behaves exactly as today.
- Verified: a contradicting signal (conviction 0.82, contradiction true) drove
  cash from 11% raw → 55% gated and failed the contradiction guard.

Files: `lib/marketmind.ts` (new), `app/api/autofund/rebalance/route.ts`,
`app/components/RiskGatePanel.tsx`.

## New env vars (all optional, all degrade)

```
OPENAI_API_KEY          # unset → heuristic copilot
OPENAI_MODEL            # default gpt-4o-mini
OPENAI_BASE_URL         # optional OpenAI-compatible gateway
VALUECHAIN_RPC_URL      # default https://rpc.valuechain.xyz (286623)
VALUECHAIN_TESTNET_RPC_URL # default https://testnet-rpc.valuechain.xyz (138565)
BASE_RPC_URL            # default https://mainnet.base.org (8453)
SSI_TOKEN_ADDRESS       # default verified MAG7.ssi on Base
MARKETMIND_SIGNAL_JSON  # optional inline MarketMind signal
MARKETMIND_SIGNAL_URL   # optional URL to fetch a MarketMind signal
```

## Verified in smoke test (no keys)

- `/api/autofund/onchain` returns REAL ValueChain data: chainId **286623**,
  block height non-zero and ticking, Base 8453, MAG7.ssi verified on Base.
- Copilot falls back to heuristic (`X-Copilot-Mode: heuristic`, gpt-4o-mini).
- `/health` reports AI `configured:false`, all `live:false`.
- Rebalance + demo cycle still work; MarketMind ingest de-risks the trade.
- `/audit` embeds a live `onchainAnchor`. All pages 200, no runtime errors.
