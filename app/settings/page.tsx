import AutoFundChartCard from "../components/AutoFundChartCard";
import AutoFundLayout from "../components/AutoFundLayout";

export default function SettingsPage() {
  return (
    <AutoFundLayout title="Risk Engine" subtitle="Configure volatility, drawdown, and exposure controls">
      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Protection Rules</h2>
        <div className="space-y-2 text-sm">
          <div className="border border-zinc-700 bg-black p-3">Volatility trigger: +30% over baseline</div>
          <div className="border border-zinc-700 bg-black p-3">Drawdown guard: reduce risk at -8%</div>
          <div className="border border-zinc-700 bg-black p-3">Exposure limit: 45% per single asset</div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Execution Controls</h2>
        <div className="space-y-2 text-sm">
          <div className="border border-zinc-700 bg-black p-3">Mode: automatic with manual override</div>
          <div className="border border-zinc-700 bg-black p-3">Rebalance cadence: event-driven</div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5 md:col-span-2">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Risk Score Trend</h2>
        <AutoFundChartCard
          title="Volatility and Risk Score"
          type="line"
          note="Continuous risk monitoring powers exposure changes and drawdown protection."
        />
      </section>
    </AutoFundLayout>
  );
}
