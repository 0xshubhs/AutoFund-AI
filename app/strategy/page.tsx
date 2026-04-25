import AutoFundLayout from "../components/AutoFundLayout";

export default function StrategyPage() {
  return (
    <AutoFundLayout title="Strategy Setup" subtitle="Define how the agent behaves">
      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Risk Selector</h2>
        <div className="grid gap-2 text-sm md:grid-cols-3">
          <div className="border border-zinc-700 bg-black p-3">Low</div>
          <div className="border border-emerald-500 bg-black p-3">Medium (selected)</div>
          <div className="border border-zinc-700 bg-black p-3">High</div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Strategy Type</h2>
        <div className="grid gap-2 text-sm">
          <div className="border border-zinc-700 bg-black p-3">Index tracking</div>
          <div className="border border-zinc-700 bg-black p-3">Momentum</div>
          <div className="border border-emerald-500 bg-black p-3">AI dynamic (selected)</div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Constraints</h2>
        <div className="grid gap-2 text-sm">
          <div className="border border-zinc-700 bg-black p-3">Max allocation per asset: 45%</div>
          <div className="border border-zinc-700 bg-black p-3">Stablecoin reserve: 10%</div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Execution Settings</h2>
        <div className="grid gap-2 text-sm">
          <div className="border border-zinc-700 bg-black p-3">Rebalance frequency: 12 hours</div>
          <div className="border border-zinc-700 bg-black p-3">Execution mode: Auto approval</div>
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
