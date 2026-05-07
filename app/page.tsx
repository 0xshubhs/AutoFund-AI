import Link from "next/link";
import Dither from "./components/Dither";

const features = [
  { k: "Ingest", v: "SoSoValue trend, sector, ETF, news signals" },
  { k: "Decide", v: "Multi-strategy AI router + explainable trail" },
  { k: "Gate", v: "Risk engine: vol · drawdown · correlation · macro" },
  { k: "Execute", v: "SoDEX EIP-712 orders, slippage-aware slicing" },
];

export default function Home() {
  return (
    <main className="relative min-h-screen bg-black text-white">
      <div className="absolute inset-0">
        <Dither
          waveColor={[0.2, 0.85, 0.45]}
          disableAnimation={false}
          enableMouseInteraction
          mouseRadius={0.5}
          colorNum={4}
          waveAmplitude={0.52}
          waveFrequency={4.2}
          waveSpeed={0.16}
        />
      </div>
      <div className="absolute inset-0 bg-black/55" />
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mx-auto mb-6 inline-block border border-emerald-500/60 bg-black/40 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.32em] text-emerald-300">
            Adaptive On-Chain Fund · Risk Engine · SoDEX Execution
          </p>
          <h1 className="text-6xl font-black tracking-[0.12em] text-white sm:text-8xl">AutoFund AI</h1>
          <p className="mx-auto mt-6 max-w-3xl text-base font-medium leading-8 text-gray-300 sm:text-lg">
            A one-person hedge fund agent. It reads SoSoValue signals, picks the best strategy
            for the regime, gates risk, and executes on SoDEX — every action explainable.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="relative inline-block bg-[#22c55e] px-8 py-4 text-base font-bold text-black transition duration-150 hover:bg-[#4ade80]"
            >
              Open Fund Control Center
            </Link>
            <Link
              href="/reasoning"
              className="relative inline-block border border-emerald-500/70 bg-black/40 px-8 py-4 text-base font-bold text-emerald-300 transition hover:bg-emerald-500/10"
            >
              See an AI decision
            </Link>
          </div>
          <ul className="mx-auto mt-12 grid max-w-4xl gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <li
                key={f.k}
                className="border border-zinc-800 bg-black/60 p-3 backdrop-blur-sm transition hover:border-emerald-500/60"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-emerald-400">
                  {f.k}
                </p>
                <p className="mt-1 text-sm text-zinc-200">{f.v}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
