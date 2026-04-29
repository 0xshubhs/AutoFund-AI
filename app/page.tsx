import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-5 text-white">
      <div className="pointer-events-none absolute right-8 top-16 hidden border border-zinc-800 bg-[#141414] p-4 text-xs text-zinc-400 md:block">
        LIVE STRATEGY
      </div>
      <div className="pointer-events-none absolute bottom-16 left-8 hidden border border-zinc-800 bg-[#141414] p-4 text-xs text-zinc-400 md:block">
        RISK ENGINE ACTIVE
      </div>
      <div className="w-full max-w-5xl space-y-6 text-center">
        <section className="relative border border-zinc-800 bg-[#141414] px-8 py-12 md:px-14 md:py-16">
          <span className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-emerald-400" />
          <span className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-emerald-400" />
          <span className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-emerald-400" />
          <span className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-emerald-400" />
          <p className="text-xs tracking-[0.35em] text-emerald-400">AUTOFUND AI</p>
          <h1 className="mt-3 text-3xl font-semibold md:text-5xl">
            Adaptive On-Chain Fund + Risk Engine
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-zinc-300">
            Live execution plus explainable AI. The system rotates between momentum, index, and
            news-aware strategies, adjusts risk in real time, and routes trades to execution.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
            <Link
              href="/dashboard"
              className="relative border border-emerald-500 bg-emerald-500/10 px-6 py-3 font-semibold text-emerald-300"
            >
              <span className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-white" />
              <span className="absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-white" />
              <span className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-white" />
              <span className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-white" />
              Open Fund Control Center
            </Link>
            <Link href="/strategy" className="border border-zinc-700 bg-black px-4 py-2 text-zinc-300">
              Enter Strategy Lab
            </Link>
          </div>
        </section>

        <section className="grid w-full gap-3 text-left md:grid-cols-3">
          <div className="border border-zinc-800 bg-[#141414] p-4">
            <p className="text-xs text-zinc-400">Multi-Strategy Engine</p>
            <p className="mt-2 text-sm">AI activates the best regime from momentum, index, and news.</p>
          </div>
          <div className="border border-zinc-800 bg-[#141414] p-4">
            <p className="text-xs text-zinc-400">Risk Engine</p>
            <p className="mt-2 text-sm">Volatility, drawdown, and exposure caps auto-protect capital.</p>
          </div>
          <div className="border border-zinc-800 bg-[#141414] p-4">
            <p className="text-xs text-zinc-400">Explainable Actions</p>
            <p className="mt-2 text-sm">Every trade ships with reasons, signals, and confidence.</p>
          </div>
        </section>

        <section className="grid w-full gap-3 md:grid-cols-4">
          <div className="border border-zinc-800 bg-[#141414] p-4 text-left">
            <p className="text-xs text-zinc-500">Strategies Active</p>
            <p className="mt-1 text-xl font-semibold text-emerald-300">3</p>
          </div>
          <div className="border border-zinc-800 bg-[#141414] p-4 text-left">
            <p className="text-xs text-zinc-500">Risk Models</p>
            <p className="mt-1 text-xl font-semibold text-emerald-300">5</p>
          </div>
          <div className="border border-zinc-800 bg-[#141414] p-4 text-left">
            <p className="text-xs text-zinc-500">Decisions Logged</p>
            <p className="mt-1 text-xl font-semibold text-emerald-300">1,248</p>
          </div>
          <div className="border border-zinc-800 bg-[#141414] p-4 text-left">
            <p className="text-xs text-zinc-500">Execution Latency</p>
            <p className="mt-1 text-xl font-semibold text-emerald-300">142ms</p>
          </div>
        </section>
      </div>
    </div>
  );
}
