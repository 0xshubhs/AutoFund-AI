export default function Home() {
  const riskProfiles = [
    { label: "LOW", allocation: "60% BTC / 30% ETH / 10% Stable", rebalance: "24h" },
    { label: "MID", allocation: "45% BTC / 35% ETH / 20% Alts", rebalance: "12h" },
    { label: "DEGEN", allocation: "25% BTC / 30% ETH / 45% Momentum", rebalance: "4h" },
  ];

  const pipeline = [
    "SoSoValue Index + Sector + Snapshot",
    "AI Strategy Engine scores trend + volatility",
    "Portfolio decision and target weights",
    "SoDEX order execution and live rebalance",
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <main className="mx-auto grid max-w-6xl gap-5 px-6 py-10 md:grid-cols-2">
        <section className="border border-emerald-500/70 bg-zinc-950 p-6 shadow-[0_0_24px_rgba(16,185,129,0.2)] md:col-span-2">
          <p className="mb-2 text-xs tracking-[0.35em] text-emerald-400">AUTOFUND AI</p>
          <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl">
            One-Person Hedge Fund Agent
          </h1>
          <p className="max-w-3xl text-zinc-300">
            Autonomous portfolio manager that reads SoSoValue market data, makes strategy
            decisions, and executes rebalancing trades on SoDEX.
          </p>
        </section>

        <section className="border border-emerald-600/70 bg-zinc-950 p-5">
          <h2 className="mb-4 text-lg font-semibold text-emerald-300">Signal → Execution Flow</h2>
          <div className="grid gap-3">
            {pipeline.map((item, index) => (
              <div key={item} className="border border-zinc-700 bg-black p-3">
                <p className="text-xs text-emerald-400">STEP {index + 1}</p>
                <p className="text-sm text-zinc-200">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-emerald-600/70 bg-zinc-950 p-5">
          <h2 className="mb-4 text-lg font-semibold text-emerald-300">Risk Profiles</h2>
          <div className="grid gap-3">
            {riskProfiles.map((profile) => (
              <div key={profile.label} className="border border-zinc-700 bg-black p-3">
                <div className="mb-1 text-sm font-semibold text-white">{profile.label}</div>
                <div className="text-sm text-zinc-300">{profile.allocation}</div>
                <div className="text-xs text-emerald-400">Rebalance: {profile.rebalance}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-emerald-600/70 bg-zinc-950 p-5">
          <h2 className="mb-3 text-lg font-semibold text-emerald-300">Live Demo Story</h2>
          <ul className="space-y-2 text-sm text-zinc-200">
            <li>Start with $1000 virtual capital in MID mode.</li>
            <li>Detect sudden sector momentum shift from SoSoValue snapshot.</li>
            <li>Generate new target weights with rationale.</li>
            <li>Execute rebalancing orders via SoDEX and show updated PnL.</li>
          </ul>
        </section>

        <section className="border border-emerald-600/70 bg-zinc-950 p-5">
          <h2 className="mb-3 text-lg font-semibold text-emerald-300">Explainability Panel</h2>
          <div className="border border-emerald-500/60 bg-black p-4 text-sm">
            <p className="mb-2 text-emerald-400">Why this trade?</p>
            <p className="text-zinc-200">
              ETH weight increased because ETF inflow trend stayed positive for 3 cycles while BTC
              dominance weakened and volatility remained within selected MID risk tolerance.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
