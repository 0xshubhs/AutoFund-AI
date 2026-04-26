import AutoFundLayout from "../components/AutoFundLayout";

export default function StrategyPage() {
  return (
    <AutoFundLayout title="Strategy Lab" subtitle="Simulate and configure adaptive AI strategies">
      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Risk Regime</h2>
        <div className="grid gap-2 text-sm md:grid-cols-3">
          <div className="border border-zinc-700 bg-black p-3">Conservative</div>
          <div className="border border-emerald-500 bg-black p-3">Medium (selected)</div>
          <div className="border border-zinc-700 bg-black p-3">Aggressive</div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Multi-Strategy Engine</h2>
        <div className="grid gap-2 text-sm">
          <div className="border border-zinc-700 bg-black p-3">Momentum strategy</div>
          <div className="border border-zinc-700 bg-black p-3">Index tracking strategy</div>
          <div className="border border-zinc-700 bg-black p-3">News-based allocation strategy</div>
          <div className="border border-emerald-500 bg-black p-3">AI strategy selector (active)</div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Constraints and Limits</h2>
        <div className="grid gap-2 text-sm">
          <div className="border border-zinc-700 bg-black p-3">Max allocation per asset: 45%</div>
          <div className="border border-zinc-700 bg-black p-3">Stable reserve floor: 12%</div>
          <div className="border border-zinc-700 bg-black p-3">Max sector exposure: 55%</div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Adaptive Rebalancing</h2>
        <div className="grid gap-2 text-sm">
          <div className="border border-zinc-700 bg-black p-3">Trigger: market move {'>'} 2.5%</div>
          <div className="border border-zinc-700 bg-black p-3">Trigger: macro event proximity {'<'} 4h</div>
          <div className="border border-zinc-700 bg-black p-3">Execution mode: AI auto approval</div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5 md:col-span-2">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Agent Control</h2>
        <div className="flex gap-3 text-sm">
          <button className="border border-emerald-500 bg-emerald-500/10 px-4 py-2 text-emerald-300">
            Start Agent
          </button>
          <button className="border border-zinc-600 bg-black px-4 py-2 text-zinc-300">Stop Agent</button>
        </div>
      </section>
    </AutoFundLayout>
  );
}
