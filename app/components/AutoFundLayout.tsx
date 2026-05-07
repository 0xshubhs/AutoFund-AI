"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DemoCycleProvider } from "./DemoCycleContext";
import RunCycleButton from "./RunCycleButton";
import DemoCyclePanel from "./DemoCyclePanel";

const navItems = [
  { href: "/dashboard", label: "Dashboard", code: "01" },
  { href: "/strategy", label: "Strategy Lab", code: "02" },
  { href: "/portfolio", label: "Portfolio", code: "03" },
  { href: "/reasoning", label: "AI Decisions", code: "04" },
  { href: "/execution", label: "Execution", code: "05" },
  { href: "/settings", label: "Risk Engine", code: "06" },
];

type AutoFundLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export default function AutoFundLayout({ title, subtitle, children }: AutoFundLayoutProps) {
  const pathname = usePathname();
  return (
    <DemoCycleProvider>
      <div className="autofund-shell relative flex h-screen bg-black text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(34,197,94,0.10),transparent_60%),radial-gradient(circle_at_85%_85%,rgba(34,197,94,0.06),transparent_55%)]" />
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 flex h-screen w-full">
          <aside className="hidden w-64 shrink-0 border-r border-zinc-800 bg-black/85 md:block">
            <div className="border-b border-zinc-800 p-5">
              <Link href="/" className="block">
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-emerald-400">
                  Adaptive Fund
                </p>
                <p className="mt-1 text-xl font-black text-white transition hover:text-[#22c55e]">
                  AutoFund AI
                </p>
              </Link>
              <p className="mt-3 text-[11px] text-zinc-500">
                One-person hedge fund agent · SoSoValue + SoDEX
              </p>
            </div>
            <nav className="space-y-1 p-3">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center justify-between border px-3 py-2 text-xs font-medium transition ${
                      active
                        ? "border-emerald-500 bg-emerald-500/15 text-white"
                        : "border-zinc-800 bg-[#0a0a0a] text-zinc-300 hover:border-emerald-500/60 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`font-mono text-[9px] tracking-[0.18em] ${active ? "text-emerald-300" : "text-zinc-600 group-hover:text-emerald-400"}`}
                      >
                        {item.code}
                      </span>
                      {item.label}
                    </span>
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                  </Link>
                );
              })}
            </nav>
            <div className="mx-3 mt-2 border border-zinc-800 bg-[#0a0a0a] p-3 text-[11px] text-zinc-400">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-400">
                Risk Mode
              </p>
              <p className="mt-1 text-zinc-200">Adaptive · gated</p>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-400">
                Exposure Cap
              </p>
              <p className="mt-1 text-zinc-200">45% per asset</p>
            </div>
          </aside>
          <div className="flex-1 overflow-auto bg-black/60 p-4 md:p-6">
            <header className="relative border border-zinc-800 bg-[#0a0a0a]/90 px-5 py-4">
              <span className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-[#22c55e]" />
              <span className="absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-[#22c55e]" />
              <span className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-[#22c55e]" />
              <span className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-[#22c55e]" />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-emerald-400">
                    AutoFund AI · {pathname.replace("/", "") || "home"}
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold md:text-3xl">{title}</h1>
                  <p className="text-sm text-zinc-400">{subtitle}</p>
                </div>
                <RunCycleButton />
              </div>
            </header>
            <main className="mt-4 grid gap-4 md:grid-cols-2">
              <DemoCyclePanel />
              {children}
            </main>
          </div>
        </div>
      </div>
    </DemoCycleProvider>
  );
}
