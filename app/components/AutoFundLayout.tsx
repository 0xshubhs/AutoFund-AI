import Link from "next/link";
import { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/strategy", label: "Strategy Setup" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/reasoning", label: "AI Decisions" },
  { href: "/execution", label: "Execution" },
  { href: "/settings", label: "Settings" },
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
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5">
          <div>
            <p className="text-xs tracking-[0.35em] text-emerald-400">AUTOFUND AI</p>
            <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
            <p className="text-sm text-zinc-400">{subtitle}</p>
          </div>
          <nav className="flex flex-wrap gap-1.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border border-emerald-500/40 bg-black px-2.5 py-1.5 text-xs text-zinc-200 transition hover:border-emerald-400 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto grid max-w-7xl gap-3 px-5 py-5 md:grid-cols-2">{children}</main>
    </div>
  );
}
