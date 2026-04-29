# soso1 (AutoFund AI) - Build Plan and Current Status

## 1) What has been done till now

### Product direction completed
- Upgraded concept from basic bot to **Adaptive On-Chain Fund + Risk Engine**.
- Defined core story: strategy selection + risk protection + explainable execution.

### UI and routing completed
- Landing page is now full-view hero style at `/`.
- Main product dashboard moved to `/dashboard`.
- Dashboard experience uses sidebar layout (DePinsight-inspired structure).
- Sidebar now excludes `Landing`; clicking `AUTOFUND AI` in sidebar returns to `/`.

### Page structure completed
- `/dashboard` (Fund Control Center)
- `/strategy` (Strategy Lab)
- `/portfolio`
- `/reasoning` (AI Decisions)
- `/execution`
- `/settings` (Risk Engine config)

### Chart work completed (phase 1)
- Integrated `recharts` and upgraded `AutoFundChartCard` to render real chart components.
- Current chart types implemented:
  - `line`
  - `multiline`
  - `donut`
  - `bar-compare`
  - `candlestick`
  - `stacked-area`
  - `gauge`
  - `drawdown`
- Charts now load and render from local mock datasets, but are **not yet connected to live APIs**.

## 2) Why charts are still not loading live data

- Chart library is now integrated (`recharts`), but data source is still local mock state.
- No API client/service layer exists for market/time-series data fetching.
- No server route or backend adapter for strategy/risk/execution data.
- No polling/websocket for live updates.
- No loading/error/empty-state orchestration for chart cards.

## 3) APIs required (to make product real)

## A. Market Data APIs
- Historical candles (OHLCV) for BTC/ETH/SOL and sector proxies.
- Benchmark index data for comparison line.
- Volatility inputs (realized/historical) for risk score.

Expected usage:
- Portfolio vs market chart
- Trade overlay chart
- Risk meter and drawdown chart

## B. Portfolio and Holdings APIs
- Current holdings with weights and valuation.
- Position history / allocation history.
- Portfolio NAV timeline.

Expected usage:
- Holdings table
- Allocation over time chart
- Portfolio snapshot cards

## C. Strategy Engine APIs
- Active strategy endpoint (`momentum`, `index`, `news`).
- Strategy signal scores and strategy switch events.
- Backtest/simulation endpoint for Strategy Lab.

Expected usage:
- Strategy lab simulation panel
- Active strategy card
- Strategy-switch explanation feed

## D. Risk Engine APIs
- Real-time risk score endpoint.
- Drawdown monitor endpoint.
- Exposure limit and risk rule config endpoint.

Expected usage:
- Risk gauge
- Drawdown trend
- Settings/Risk engine page

## E. AI Reasoning APIs
- Decision explanation endpoint (`reason`, `signals`, `confidence`).
- Decision history timeline.

Expected usage:
- AI Decisions page
- Decision cards and confidence panels

## F. Execution APIs (SoDEX/trading layer)
- Place order endpoint.
- Order status endpoint.
- Fill/slippage and execution logs endpoint.

Expected usage:
- Execution monitor page
- Candlestick with buy/sell markers
- Live logs and status cards

## 4) What has to be done next (priority order)

1. **Create typed API layer**
   - Add `lib/api/` with typed fetchers and response models.
   - Centralize base URL and auth handling.

2. **Connect charts to APIs**
   - Replace local mock arrays in chart components with API responses.
   - Normalize API responses into chart-friendly shapes.

3. **Connect dashboard cards to live data**
   - Replace static numbers with fetched portfolio + benchmark data.
   - Add `loading`, `error`, and `last-updated` states.

4. **Build risk and strategy data pipelines**
   - Implement strategy status and risk score fetch.
   - Map API data to gauge/drawdown visual components.

5. **Wire AI decision and execution pages**
   - Pull reasoning objects from endpoint.
   - Pull order/fill/slippage logs from execution endpoint.

6. **Introduce refresh model**
   - Poll every 15-60s for non-critical metrics.
   - Optional websocket for execution events.

7. **Demo hardening**
   - Add deterministic fallback mock mode if APIs fail.
   - Add "demo moment" flow: AI reallocation -> trade -> impact shown.

## 5) Current blockers

- API base endpoints not yet integrated in code.
- No auth key/config mechanism wired in project.
- No API-backed async chart data wiring yet.

## 6) Definition of done for soso1

- All major charts render from API data (not static SVG).
- All dashboard KPIs are dynamic.
- Risk, strategy, AI reasoning, and execution are connected end-to-end.
- Demo can show one full intelligent action cycle without manual patching.

## 7) Improvement plan (L2Beat-quality direction)

1. **Professional visual system**
   - Add consistent card spacing scale, typography hierarchy, and status color semantics.
   - Add shared UI primitives for KPI cards and chart headers.

2. **Data quality and transparency**
   - Add source labels on each chart ("Binance", "SoDEX", "internal risk model").
   - Add timestamp + refresh indicator per panel.

3. **Analytics depth**
   - Add rolling Sharpe, Sortino, and downside deviation on portfolio analytics page.
   - Add strategy attribution panel (which strategy contributed PnL).

4. **Execution intelligence**
   - Add fill-quality distribution and slippage histogram.
   - Add failed/retried order diagnostics panel.

5. **Reliability**
   - Implement skeleton loaders, retry states, and stale data warning banners.
   - Add circuit-breaker behavior if risk API is unavailable.
