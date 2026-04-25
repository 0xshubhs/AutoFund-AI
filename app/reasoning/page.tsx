import AutoFundLayout from "../components/AutoFundLayout";
import AutoFundChartCard from "../components/AutoFundChartCard";

export default function ReasoningPage() {
  return (
    <AutoFundLayout title="AI Reasoning" subtitle="Show why decisions are made">
      <section className="border border-emerald-500/60 bg-zinc-950 p-5 md:col-span-2">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Latest Decision Explanation</h2>
        <div className="border border-zinc-700 bg-black p-4 text-sm text-zinc-200">
          Portfolio shifted +4% toward AI sector tokens because index momentum outperformed for
          three consecutive windows while volatility stayed below the selected medium risk threshold.
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Signals Used</h2>
        <div className="space-y-2 text-sm">
          <div className="border border-zinc-700 bg-black p-3">Market trend score: 78/100</div>
          <div className="border border-zinc-700 bg-black p-3">Sector growth score: 82/100</div>
          <div className="border border-zinc-700 bg-black p-3">News sentiment score: 71/100</div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Confidence Score</h2>
        <div className="space-y-2 text-sm">
          <div className="border border-zinc-700 bg-black p-3">Current rebalance confidence: 84%</div>
          <div className="border border-zinc-700 bg-black p-3">Risk regime certainty: 76%</div>
          <div className="border border-zinc-700 bg-black p-3">Execution confidence: 91%</div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5 md:col-span-2">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Rebalance Impact Chart</h2>
        <AutoFundChartCard
          title="Before vs After Allocation"
          type="bar-compare"
          note="Compares previous allocation against newly proposed allocation."
        />
      </section>
    </AutoFundLayout>
  );
}
