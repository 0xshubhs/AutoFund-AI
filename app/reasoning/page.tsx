import AutoFundLayout from "../components/AutoFundLayout";
import AutoFundChartCard from "../components/AutoFundChartCard";

export default function ReasoningPage() {
  return (
    <AutoFundLayout title="AI Decisions" subtitle="Explainable actions with signals and confidence">
      <section className="border border-emerald-500/60 bg-zinc-950 p-5 md:col-span-2">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Latest Decision</h2>
        <div className="border border-zinc-700 bg-black p-4 text-sm text-zinc-200">
          Allocation shifted +6% from BTC into ETH and AI basket because momentum score rose above
          80, ETF inflow trend stayed positive, and current drawdown remained below the protection
          trigger.
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Signals Used</h2>
        <div className="space-y-2 text-sm">
          <div className="border border-zinc-700 bg-black p-3">Momentum score: 82/100</div>
          <div className="border border-zinc-700 bg-black p-3">Macro risk score: 61/100</div>
          <div className="border border-zinc-700 bg-black p-3">News conviction score: 74/100</div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Confidence and Safety</h2>
        <div className="space-y-2 text-sm">
          <div className="border border-zinc-700 bg-black p-3">Rebalance confidence: 84%</div>
          <div className="border border-zinc-700 bg-black p-3">Risk regime certainty: 76%</div>
          <div className="border border-zinc-700 bg-black p-3">Execution confidence: 91%</div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5 md:col-span-2">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Rebalance Impact</h2>
        <AutoFundChartCard
          title="Before vs After Allocation"
          type="bar-compare"
          note="Compares previous allocation against newly proposed allocation."
        />
      </section>
    </AutoFundLayout>
  );
}
