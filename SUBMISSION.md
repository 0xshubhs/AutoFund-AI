PRODUCT CATEGORY (pick up to 3)
AI Agent, Asset Management, Market Infrastructure

============================================================
UPDATES IN THIS WAVE (Wave 1) — plain text, under 3000 chars
============================================================

AutoFund AI Wave 1 shipped a zero-config, end-to-end autonomous on-chain hedge fund agent built on SoSoValue's data spine and SoDEX's execution rails — from blank repo to working demo in twelve days.

Data spine. Integrated four SoSoValue endpoints in lib/sosovalue.ts, all authenticated with x-soso-api-key and read with cache:no-store so every signal is fresh. (1) /currency/market-snapshot drives momentum scoring and the equity-curve chart. (2) /index/market-snapshot powers the SSI benchmark and the index-tracking strategy. (3) /currency/sector-spotlight renders as a six-tile heatmap on the dashboard and feeds the strategy router's sector tilt. (4) /news/list surfaces headlines with sentiment and conviction on the Reasoning page.

Execution layer. Built lib/sodex.ts and POST /api/autofund/sodex-order to construct a real EIP-712 typed-data envelope for the SoDEX orderbook. Live mode POSTs to testnet-api.sodex.com/v1/order/new; dry-run mode returns the constructed payload so judges can verify the integration shape. The Execution page ships a Place Test Order button that hits this route and renders the typed-data response inline.

Six live dashboard pages, all wrapped in AutoFundLayout: landing, dashboard (NAV, alpha, risk gauge, equity curve, sector heatmap, AI action feed), strategy lab (active strategy, four score bars, constraints, adaptive triggers), portfolio (holdings table, mix donut, before-after rebalance, allocation evolution), reasoning (decision card, signal breakdown, news feed, decision timeline), execution (fill rate, slippage, ack latency, live orders), settings (composite risk gauge, regime, five-component breakdown radar, drawdown envelope).

Twelve typed JSON API routes, every response envelope-wrapped with {ok, data, source, generatedAt}: rebalance, summary, series, portfolio, risk, strategy, reasoning, execution, news, sectors, sodex-order, health.

Hero UX. A Run Trading Cycle button in the header animates a six-step state machine (Ingest, Score, Risk-gate, Reason, Execute, Settle) across every page, turning the abstract agent into something a judge groks in six seconds.

AI copilot. A Qwen-powered helper narrates each decision in plain English, citing the signals that drove the allocation shift.

Zero-config posture. Every public route has a deterministic time-bucketed mock fallback in lib/mock.ts. The demo runs with one npm run dev — no .env, no API keys. The moment SOSO_API_KEY is set, real data takes over transparently via the source field on every envelope.

Architecture. Polling-driven UI via a useLiveData hook with domain-tuned cadences (4.5s execution, 5s summary/risk, 7-9s reasoning), source labels on every panel showing data provenance, a single typed SoSoValue surface in lib/sosovalue.ts, fan-out via Promise.all in buildRebalanceDecision.

Repo: github.com/0xshubhs/AutoFund-AI
Live: autofund-ai.vercel.app

============================================================
2ND WAVE — plain text, under 1000 chars
============================================================

Theme: from dashboard to wallet — make the agent transactable, not just observable.

1. Browser EIP-712 wallet signing. RainbowKit + viem on the Execution page so the user signs SoDEX orders client-side. Chain switching, gas preview, review-before-sign modal. User keeps custody.

2. Backtest engine. New /api/autofund/backtest route pulls SoSoValue OHLCV and runs any of the four strategies over 30/90/365 days. Outputs cumulative return vs BTC and SSI, max drawdown, Sharpe, and a per-rebalance trade ledger with side-by-side A/B.

3. ETF flow as fifth signal. Wire the SoSoValue ETF flow endpoint into computeAllocationFromSignals so the agent anticipates institutional positioning, not just reacts.

4. Mobile responsive pass. Stacked layouts, collapsible sidebar, thumb-reachable Place Test Order.

Done = user connects wallet, backtests a strategy, signs a SoDEX testnet order, lands a fill — on mobile.

============================================================
3RD WAVE — plain text, under 1000 chars
============================================================

Theme: from single-user agent to publishable financial primitive.

1. SoDEX mainnet execution. Promote testnet to mainnet once the whitelist key lands. Risk-gated (orders only fire below threshold), confirmation rail above a notional cap, circuit breaker on consecutive failed fills.

2. Publishable user-defined SSI-style index. Users assemble a basket, pick a weighting methodology (equal, market-cap, vol-adjusted, momentum), and publish on-chain via SSI Protocol. Subscribers pay a creator fee to the publisher.

3. Institutional analytics. Sharpe, Sortino, Calmar, max-drawdown distribution, per-asset attribution, tracking error vs SSI and BTC. New /analytics page with attribution heatmap — the report a DAO treasurer hands the board.

4. Multi-account funds. One user runs multiple funds with separate strategies and risk caps. Fund-switcher, per-fund NAV, consolidated reporting.

Done = user publishes an index, runs a mainnet fund, downloads a signed audit log; a second user subscribes.