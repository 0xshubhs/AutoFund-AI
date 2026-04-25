import Link from "next/link";
import { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/strategy", label: "Strategy Setup" },
  { href: "/portfolio", label: "Portfolio Deep Dive" },
  { href: "/reasoning", label: "AI Reasoning" },
  { href: "/execution", label: "Execution Monitor" },
];

type AutoFundLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export default function AutoFundLayout({ title, subtitle, children }: AutoFundLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-emerald-500/40 bg-zinc-950/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6">
          <div>
            <p className="text-xs tracking-[0.35em] text-emerald-400">AUTOFUND AI</p>
            <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
            <p className="text-sm text-zinc-400">{subtitle}</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border border-emerald-500/40 bg-black px-3 py-2 text-sm text-zinc-200 transition hover:border-emerald-400 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto grid max-w-7xl gap-4 px-6 py-6 md:grid-cols-2">{children}</main>
    </div>
  );
}
