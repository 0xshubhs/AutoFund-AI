import AutoFundChartCard from "../components/AutoFundChartCard";
import AutoFundLayout from "../components/AutoFundLayout";

export default function DashboardPage() {
  const recentActions = [
    "Momentum strategy activated after AI sector beta crossed threshold.",
    "Exposure reduced 6% due to volatility spike from macro event risk.",
    "Stable reserve increased as drawdown monitor moved to alert state.",
  ];

  return (
    <AutoFundLayout title="Fund Control Center" subtitle="Execution + intelligence + risk in one view">
      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-4 text-lg font-semibold text-emerald-300">Portfolio Snapshot</h2>
        <div className="grid gap-3 text-sm">
          <div className="border border-zinc-700 bg-black p-3">
            <p className="text-zinc-400">Fund Value</p>
            <p className="text-2xl font-semibold">$1,284,390</p>
          </div>
          <div className="border border-zinc-700 bg-black p-3">
            <p className="text-zinc-400">Performance</p>
            <p className="text-emerald-400">24h: +2.3% | MTD: +14.2% | YTD: +31.8%</p>
          </div>
          <div className="border border-zinc-700 bg-black p-3">
            <p className="text-zinc-400">Active Strategy</p>
            <p>Momentum allocation with volatility guard</p>
          </div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-4 text-lg font-semibold text-emerald-300">Risk Engine Status</h2>
        <div className="space-y-3">
          <AutoFundChartCard
            title="Risk Meter"
            type="gauge"
            note="Composite risk score from volatility, drawdown, and correlation stress."
          />
          <div className="border border-zinc-700 bg-black p-3 text-sm">
            Risk level: Moderate-high (68/100) · Exposure cap auto-lowered to 39%.
          </div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5 md:col-span-2">
        <h2 className="mb-4 text-lg font-semibold text-emerald-300">Portfolio vs Market</h2>
        <AutoFundChartCard
          title="Fund vs BTC vs Index"
          type="multiline"
          note="Proves alpha by comparing fund equity curve with benchmark assets."
        />
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-4 text-lg font-semibold text-emerald-300">Allocation Over Time</h2>
        <AutoFundChartCard
          title="Dynamic Allocation"
          type="stacked-area"
          note="Strategy engine rotates capital between sectors as signals change."
        />
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-4 text-lg font-semibold text-emerald-300">Drawdown Monitor</h2>
        <AutoFundChartCard
          title="Peak-to-Trough Profile"
          type="drawdown"
          note="Critical for proving capital preservation in high-volatility windows."
        />
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5 md:col-span-2">
        <h2 className="mb-4 text-lg font-semibold text-emerald-300">Live AI Actions</h2>
        <div className="grid gap-3 text-sm md:grid-cols-3">
          {recentActions.map((action) => (
            <div key={action} className="border border-zinc-700 bg-black p-3">
              {action}
            </div>
          ))}
        </div>
      </section>
    </AutoFundLayout>
  );
}
