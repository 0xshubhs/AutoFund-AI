import AutoFundLayout from "./components/AutoFundLayout";

export default function Home() {
  const recentActions = [
    "Bought ETH (+4%) because AI sector momentum accelerated",
    "Reduced BTC (-3%) after macro risk score rose",
    "Added stable reserve (+2%) as volatility guard",
  ];

  return (
    <AutoFundLayout
      title="Dashboard"
      subtitle="What the autonomous fund manager is doing right now"
    >
      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-4 text-lg font-semibold text-emerald-300">Portfolio Summary</h2>
        <div className="grid gap-3 text-sm">
          <div className="border border-zinc-700 bg-black p-3">
            <p className="text-zinc-400">Total Value</p>
            <p className="text-2xl font-semibold">$1,184.22</p>
          </div>
          <div className="border border-zinc-700 bg-black p-3">
            <p className="text-zinc-400">PnL</p>
            <p className="text-emerald-400">24h: +3.8% | Total: +18.4%</p>
          </div>
          <div className="border border-zinc-700 bg-black p-3">
            <p className="text-zinc-400">Active Strategy</p>
            <p>MID risk · AI Dynamic</p>
          </div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-4 text-lg font-semibold text-emerald-300">Asset Allocation</h2>
        <div className="space-y-3 text-sm">
          <div className="border border-zinc-700 bg-black p-3">BTC 42% · ETH 33% · SOL 15% · USDC 10%</div>
          <div className="border border-zinc-700 bg-black p-3">
            Sector split: L1 55% · AI 22% · DeFi 13% · Stable 10%
          </div>
          <div className="border border-zinc-700 bg-black p-3 text-zinc-400">
            Pie visualization placeholder
          </div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-4 text-lg font-semibold text-emerald-300">Recent AI Actions</h2>
        <div className="grid gap-3 text-sm">
          {recentActions.map((action) => (
            <div key={action} className="border border-zinc-700 bg-black p-3">
              {action}
            </div>
          ))}
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-4 text-lg font-semibold text-emerald-300">Performance Chart</h2>
        <div className="border border-zinc-700 bg-black p-5 text-sm text-zinc-400">
          Portfolio value over time chart placeholder
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5 md:col-span-2">
        <h2 className="mb-4 text-lg font-semibold text-emerald-300">AI Status Panel</h2>
        <div className="grid gap-3 text-sm md:grid-cols-3">
          <div className="border border-zinc-700 bg-black p-3">Agent State: Running</div>
          <div className="border border-zinc-700 bg-black p-3">Last Rebalance: 14m ago</div>
          <div className="border border-zinc-700 bg-black p-3">Next Action ETA: 1h 46m</div>
        </div>
      </section>
    </AutoFundLayout>
  );
}
