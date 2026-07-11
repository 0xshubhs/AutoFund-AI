# AutoFund AI — Adaptive On-Chain Fund + Risk Engine

> A one-person hedge fund agent. It ingests SoSoValue signals, scores multiple strategies, gates risk, and executes on SoDEX — every action explainable, every chart live, every decision auditable.

**Built for the [SoSoValue Buildathon](https://luma.com/soSoValue-buildathon).**

```
SoSoValue Terminal ──▶ Strategy Router ──▶ Risk Engine ──▶ SoDEX Execution ──▶ Reasoning Log
   (signals)            (4 strategies)    (vol·dd·corr)    (order router)      (audit trail)
```

---

## 1. The pitch

Traditional fund managers are gatekeepers: high fees, opaque decisions, slow rebalancing, no transparency on *why* a trade happened. **AutoFund AI** collapses that whole stack into an autonomous on-chain agent the user can watch operate in real time. It reads the same SoSoValue data a hedge-fund analyst reads, picks the best-fit strategy for the current regime, gates exposure with a risk engine, and pushes orders through SoDEX — all with a visible reasoning trail.

**Target users:**
- Retail crypto users who want hedge-fund-grade rotation without the fees or opacity.
- DAO/treasury managers who need explainable, on-chain rebalancing they can prove to stakeholders.
- Quants who want a sandbox to test SoSoValue-driven strategies with a live execution path.

**The user value loop:**

| Step | Input | Output | Where the user sees it |
| --- | --- | --- | --- |
| Ingest | SoSoValue market + sector + index data | Normalized signal vector | Dashboard KPIs, multi-line chart |
| Decide | Signal vector | Strategy choice + target allocation | Strategy Lab, AI Decisions |
| Risk-gate | Allocation + risk model | Exposure-capped allocation | Risk Engine, gauge panel |
| Execute | Capped allocation | SoDEX orders | Execution Monitor |
| Explain | Decision + signals | Reasoning trail with confidence | AI Decisions timeline |

---

## 2. Live demo

**Zero setup. No API keys needed.** The app ships with a deterministic dataset that mirrors SoSoValue's API shape, so `npm run dev` just works.

> **Wave 3 — AI is live by default.** The copilot, decision-reason enrichment, and the new **AI Desk Brief** (`/dashboard`) run on a *real* model out of the box — a self-hosted vLLM server running `Qwen/Qwen3-VL-8B-Instruct` via an OpenAI-compatible endpoint (`lib/ai.ts`), no key required. Override the endpoint/model with `OPENAI_BASE_URL` / `OPENAI_MODEL` / `OPENAI_API_KEY` (RunPod proxy URLs are ephemeral). If the endpoint is unreachable, every AI path degrades gracefully to a deterministic heuristic. See `WAVE3.md`.

```bash
git clone https://github.com/ayushsingh82/soso1.git
cd soso1
npm install
npm run dev
# open http://localhost:3000
```

Six pages, all live-data driven:

| Route | Purpose |
| --- | --- |
| `/` | Landing — hero + pipeline pillars |
| `/dashboard` | Fund Control Center — NAV, alpha, risk gauge, multi-line vs benchmark, drawdown, live AI actions |
| `/strategy` | Strategy Lab — active strategy, score bars across momentum / index / news / balanced, constraints, adaptive triggers |
| `/portfolio` | Holdings table, current mix donut, before/after rebalance, allocation evolution, drawdown |
| `/reasoning` | AI Decisions — latest decision with confidence, signal breakdown, rebalance impact, decision timeline |
| `/execution` | Execution Monitor — fill rate, slippage, ack latency, live SoDEX order table, price overlay with buy/sell markers |
| `/settings` | Risk Engine — composite score, regime, exposure cap, protection rules, risk score trend, breakdown radar, drawdown envelope |

**Hero moment to demo:** click **"Run trading cycle"** in any page header. A six-step pipeline (Ingest → Score → Risk-gate → Reason → Execute → Settle) animates across the top of the screen, mirroring the autonomous loop the agent runs continuously.

---

## 3. SoSoValue API integration

This is the data spine of the product. SoSoValue API access is wired through `lib/sosovalue.ts` using the `x-soso-api-key` header pattern, and consumed downstream by the strategy / risk / reasoning logic.

### What we used from SoSoValue (at a glance)

| SoSoValue product / feature | What we did with it | Where in the app |
| --- | --- | --- |
| **SoSoValue Terminal — news** | Streamed headlines with sentiment + conviction into the agent's reasoning trail | `/reasoning` → SoSoValue News Feed widget |
| **SoSoValue Sector Spotlight** | Rendered live sector rotation as a 6-tile color-graded heatmap; also feeds the strategy router's sector tilt | `/dashboard` → Sector Spotlight heatmap |
| **SoSoValue Currency Market Data** | Live spot prices + 24h delta across BTC / ETH / SOL / AI basket; drives momentum scoring + the equity-curve chart | `/dashboard` → Portfolio vs Market multi-line chart |
| **SSI Protocol — Index Market Snapshot** | On-chain index quotes used as the benchmark and as input to the index-tracking strategy | `/dashboard`, `/strategy` |

### How we called the API

- **Auth**: `x-soso-api-key` header, key from `process.env.SOSO_API_KEY`
- **Base URL**: `https://openapi.sosovalue.com/openapi/v1` (overridable via `SOSO_BASE_URL`)
- **Method**: `GET` (all four endpoints), `cache: "no-store"` so every read is fresh
- **Client**: native `fetch` in `lib/sosovalue.ts`, fan-out via `Promise.all`
- **Resilience**: every public route has a deterministic mock fallback, and the JSON envelope's `source` field always tells the user whether they're seeing live or fallback data

### Endpoints currently integrated

| SoSoValue Endpoint | HTTP | Purpose in AutoFund AI | UI panel | Code path |
| --- | --- | --- | --- | --- |
| `/openapi/v1/currency/market-snapshot` | `GET` | Live spot prices and 24h change for the universe (BTC, ETH, SOL, AI basket constituents). Drives momentum scoring and the multi-line chart. | Dashboard *Portfolio vs Market* | `lib/sosovalue.ts::getMarketSnapshot()` |
| `/openapi/v1/index/market-snapshot` | `GET` | SSI Protocol on-chain index quotes — used as the benchmark in the *Portfolio vs Market* comparison and as input to the index-tracking strategy. | Dashboard, Strategy Lab | `lib/sosovalue.ts::getIndexMarketSnapshot()` |
| `/openapi/v1/currency/sector-spotlight` | `GET` | Sector rotation signals (L1 / AI / DeFi / L2 / Memes / Stables). Renders directly as a 6-tile heatmap on the dashboard and feeds the strategy router's sector tilt. | Dashboard *SoSoValue Sector Spotlight* heatmap | `lib/sosovalue.ts::getSectorSpotlight()` |
| `/openapi/v1/news/list` (configurable via `SOSO_NEWS_PATH`) | `GET` | Headlines + sentiment + conviction scores feeding the agent's reasoning. Highlights the news that justified the latest decision. | Reasoning *SoSoValue News Feed* | `lib/sosovalue.ts::getNews()` |

All endpoints are fan-out fetched and exposed downstream by typed route handlers. The market / index / sector triad is consumed by `lib/autofund.ts::buildRebalanceDecision()` and surfaced via `POST /api/autofund/rebalance`. Each public-facing route also has a deterministic mock fallback so the demo never goes blank if a key is rate-limited or unset — the response `source` field always tells the user whether they're seeing live or fallback data.

### Integration pattern

```ts
// lib/sosovalue.ts
const response = await fetch(`${SOSO_BASE_URL}${path}`, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "x-soso-api-key": SOSO_API_KEY,
  },
  cache: "no-store",
});
```

- **Auth:** `x-soso-api-key` header from `process.env.SOSO_API_KEY`.
- **Base URL:** `https://openapi.sosovalue.com/openapi/v1` (overridable via `SOSO_BASE_URL`).
- **Caching:** `cache: "no-store"` — every signal read is fresh; we never serve stale market data.
- **Error contract:** non-2xx throws; routes wrap in try/catch and fall back to safe internal mock so the demo stays alive even if the upstream key is missing or rate-limited.

### Signal → decision wiring

```ts
// lib/autofund.ts
export async function buildRebalanceDecision() {
  const [marketSnapshot, indexSnapshot, sectorSnapshot] = await Promise.all([
    getMarketSnapshot(),       // SoSoValue
    getIndexMarketSnapshot(),  // SoSoValue (SSI)
    getSectorSpotlight(),      // SoSoValue
  ]);
  const decision = computeAllocationFromSignals(marketSnapshot.data ?? []);
  return { ...decision, metadata: { mode: "automatic", instrument: "spot", rebalanceFrequency: "hourly" } };
}
```

`computeAllocationFromSignals` is the strategy core — it shifts BTC / ETH / AI basket weights based on the 24-hour deltas SoSoValue returns. Below example threshold for ETH momentum, allocation tilts toward ETH; below threshold for BTC, capital rotates to the AI basket.

---

## 4. SoDEX integration

The execution layer is wired end-to-end through `lib/sodex.ts` and exposed via `POST /api/autofund/sodex-order`. The route constructs a real EIP-712 typed-data envelope for the SoDEX orderbook and:

- **Live mode** (`SODEX_API_KEY` set): POSTs the signed order to `${SODEX_BASE_URL}${SODEX_ORDER_PATH}` (defaults to `https://testnet-api.sodex.com/v1/order/new`).
- **Dry-run mode** (no key): returns the constructed payload + typed data so the user can verify the integration shape and sign offline. The Execution page renders the typed data inline as proof of correctness.

The Execution Monitor (`/execution`) ships a **Place test order** button that hits this route on click, picks a sensible default order off the current top holding, and shows the response (status, payload, EIP-712 typed data preview) in a side-by-side panel. The remainder of the page (live orders, fill rate, slippage, ack latency) renders the same way a SoDEX flow would surface them.

**Wave 2/3 plan:** add wallet-side EIP-712 signing in the browser (RainbowKit + viem) so the user can sign with their own account, then promote to SoDEX mainnet once the buildathon-whitelist key lands.

---

## 5. Project routes

### Public dashboard pages
- `/` · `/dashboard` · `/strategy` · `/portfolio` · `/reasoning` · `/execution` · `/settings`

### API surface
| Route | Method | Purpose | SoSoValue / SoDEX endpoint hit |
| --- | --- | --- | --- |
| `/api/autofund/rebalance` | POST | Pulls SoSoValue snapshots, computes target allocation, returns decision + execution payload | `currency/market-snapshot`, `index/market-snapshot`, `currency/sector-spotlight` |
| `/api/autofund/summary` | GET | NAV, alpha (24h / MTD / YTD), risk regime, exposure cap, uptime | — |
| `/api/autofund/series` | GET | Equity curve for fund vs BTC vs index | — |
| `/api/autofund/portfolio` | GET | Holdings table + allocation history (stacked area) | — |
| `/api/autofund/risk` | GET | Composite risk score, regime, exposure cap, breakdown, drawdown envelope | — |
| `/api/autofund/strategy` | GET | Active strategy + score per strategy + rebalance trigger | — |
| `/api/autofund/reasoning` | GET | Latest decisions: summary, confidence, signal scores, before/after weights, reasons | — |
| `/api/autofund/execution` | GET | Live orders, fill rate, average slippage (bps), average ack latency (ms) | — |
| `/api/autofund/news` | GET | SoSoValue headlines with sentiment + conviction (powers the Reasoning news widget) | `news/list` |
| `/api/autofund/sectors` | GET | Sector spotlight rotation signals (powers the dashboard heatmap) | `currency/sector-spotlight` |
| `/api/autofund/sodex-order` | POST | Constructs EIP-712 typed order, submits to SoDEX testnet or returns dry-run | SoDEX `/v1/order/new` |
| `/api/autofund/health` | GET | Health probe — reports SoSoValue + SoDEX + AI-helper availability | — |

Each JSON response is envelope-wrapped with `{ ok, data, source, generatedAt }` so the UI can show provenance and last-updated state on every panel.

---

## 6. Architecture

```
soso1/
├── app/
│   ├── (dashboard pages)
│   ├── api/autofund/         9 typed JSON routes
│   └── components/
│       ├── AutoFundLayout    sidebar + header + demo cycle banner
│       ├── AutoFundChartCard data-driven chart primitive (recharts)
│       ├── ChartPanel        consistent panel: title, status dot, source label
│       ├── KPICard           corner-bracketed KPI block, tone-aware
│       ├── StatusDot         live · stale · error indicator + last-updated
│       ├── DemoCycleContext  6-step trading-cycle state machine
│       ├── DemoCyclePanel    pipeline visualization across all pages
│       └── RunCycleButton    header CTA — kicks off the demo cycle
├── lib/
│   ├── sosovalue.ts          SoSoValue API client (the spine)
│   ├── autofund.ts           Strategy core + SoDEX scaffold
│   ├── mock.ts               Deterministic time-bucketed generators
│   ├── types.ts              Shared domain models
│   └── useLiveData.ts        Polling hook (status, last-updated)
└── (Next.js 16, TypeScript, Tailwind v4, recharts, RainbowKit-ready)
```

**Key design choices:**
- **Polling-driven UI.** Every panel polls its endpoint on a domain-tuned cadence (4.5s execution, 5s summary/risk, 7-9s reasoning/strategy). Status dots show `live | stale | error` so the user always knows the data is fresh.
- **Deterministic time-bucketed mock fallback.** When no SoSoValue key is set, internal generators (`lib/mock.ts`) re-seed every minute / hour so charts still feel alive in the demo. Real SoSoValue data takes over the moment the key is configured.
- **Demo cycle as the hero.** A single click animates through the entire agentic loop, making the abstract "agent" tangible to a judge in 6 seconds.
- **Source labels on every panel.** Every chart card shows where its data came from — `SoSoValue / internal NAV calc`, `SoDEX/order-router`, `internal/risk-engine` — so the integration story is explicit, not buried.

---

## 7. Setup

### Prerequisites
- Node.js ≥ 20

### Install & run
```bash
npm install
npm run dev
# → http://localhost:3000
```

That's it. **No `.env`, no API keys, no signup.** Every chart and panel is populated from a deterministic generator that mirrors SoSoValue's API shape so the demo is reproducible across machines.

### Optional: plug in real keys later

If you want to swap the deterministic dataset for live SoSoValue / SoDEX calls, set any of these env vars in `.env.local` — every one is optional and falls back to the mock if absent.

```bash
# SoSoValue (optional — UI is identical with or without)
SOSO_API_KEY=...
SOSO_BASE_URL=https://openapi.sosovalue.com/openapi/v1

# SoDEX (optional — POST /api/autofund/sodex-order returns dry-run when unset)
SODEX_API_KEY=...
SODEX_BASE_URL=https://testnet-api.sodex.com
```

### Production build
```bash
npm run build
npm run start
```

---

## 8. Buildathon roadmap

| Wave | Window | Status | Focus |
| --- | --- | --- | --- |
| **Wave 1 — Concept / Prototype** | May 1–12 | **✅ Shipped** | Four SoSoValue endpoints integrated (market / index / sector / news), live dashboard across 6 pages, demo cycle, risk engine UI, reasoning trail, polling architecture, deterministic fallback, **SoSoValue Sector Spotlight live heatmap on dashboard**, **SoSoValue News Feed on Reasoning**, **SoDEX testnet `newOrder` route with EIP-712 typed-data + Place test order button on Execution**. |
| **Wave 2 — Build Phase I** | May 18–29 | 🚧 Planned | Browser-side EIP-712 wallet signing (RainbowKit + viem), Strategy Lab backtest with SoSoValue historical OHLCV, ETF flow ingestion as a fifth signal, mobile responsive pass. |
| **Wave 3 — Build Phase II** | Jun 4–15 | 🚧 Planned | SoDEX mainnet execution (post-whitelist), publishable SSI-style index from user-defined basket, Sharpe / Sortino / attribution analytics, decision JSON export for audit, multi-account fund management. |

---

## 9. Judging-criteria mapping

| Category | Weight | Where it shows up |
| --- | --- | --- |
| **User Value & Practical Impact (30%)** | Replaces gatekept fund management with a transparent, autonomous on-chain agent. Every decision is visible, every signal cited, every order auditable. The user can run the entire cycle with one click and inspect six dimensions of the fund's posture. |
| **Functionality & Working Demo (25%)** | Live dashboard at `npm run dev`, 9 working API routes, end-to-end demo cycle button, six pages all reading polled live data with status indicators. |
| **Logic, Workflow & Product Design (20%)** | Clear five-step pipeline (Ingest → Decide → Risk-gate → Execute → Explain) reflected one-to-one in the UI. Strategy router scores four strategies; risk engine breaks down five components; reasoning page surfaces signals + confidence + before/after impact. |
| **Data / API Integration (15%)** | Four SoSoValue endpoints integrated as the data spine — `/currency/market-snapshot`, `/index/market-snapshot`, `/currency/sector-spotlight`, `/news/list`. Each maps to a specific UI panel (multi-line chart, benchmark, sector heatmap, news feed). SoDEX `/v1/order/new` is wired end-to-end with EIP-712 typed-data construction and a click-to-submit button. |
| **UX & Clarity (10%)** | Code-numbered sidebar, corner-bracketed KPI cards, source labels + last-updated timestamps on every panel, consistent typography hierarchy, status dots showing data freshness, single hero CTA (`Run trading cycle`) that demonstrates the full agent loop in seconds. |

---

## 10. Submission checklist

- [x] Public GitHub repo: <https://github.com/ayushsingh82/soso1>
- [x] README with setup instructions (this file)
- [x] Working live demo (`npm run dev` → 6 pages + 12 API routes)
- [x] Genuine SoSoValue API integration (`lib/sosovalue.ts` + 4 endpoints feeding 4 dedicated UI panels)
- [x] SoDEX integration (`lib/sodex.ts` + `/api/autofund/sodex-order` with EIP-712 typed-data)
- [x] Clear use case (autonomous on-chain fund agent for retail / DAO / quant users)
- [x] Complete flow from data input to actionable output (signal → decision → risk gate → execution → reasoning)
- [ ] Demo video (recorded for Wave 1 submission)
- [x] Wave 1 changelog (see `plan.md` and `BUILD_LOG`-style notes in commits)

---

## 11. References

- [SoSoValue API Documentation](https://sosovalue-1.gitbook.io/sosovalue-api-doc)
- [SoDEX API Documentation](https://sodex.com/documentation/api/api)
- [SoSoValue Buildathon Kickoff](https://luma.com/soSoValue-buildathon)
- [Buildathon Access Request Form](https://forms.gle/2nuJT2qNbUQsyyZy8)

---

**Made for the SoSoValue Buildathon · Wave 1 submission**
