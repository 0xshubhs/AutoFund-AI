type Tone = "neutral" | "positive" | "negative" | "warn";

const toneClass: Record<Tone, string> = {
  neutral: "text-white",
  positive: "text-emerald-400",
  negative: "text-rose-400",
  warn: "text-amber-300",
};

export default function KPICard({
  label,
  value,
  delta,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: Tone;
  hint?: string;
}) {
  return (
    <div className="relative border border-zinc-800 bg-black/80 p-3 transition hover:border-emerald-500/60">
      <span className="absolute left-0 top-0 h-2 w-2 border-l border-t border-emerald-500/70" />
      <span className="absolute right-0 top-0 h-2 w-2 border-r border-t border-emerald-500/70" />
      <span className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-emerald-500/70" />
      <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-emerald-500/70" />
      <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className={`mt-1 font-mono text-xl font-semibold ${toneClass[tone]}`}>{value}</p>
      {delta && (
        <p className={`mt-0.5 text-xs ${toneClass[tone]}`}>{delta}</p>
      )}
      {hint && <p className="mt-1 text-[10px] text-zinc-500">{hint}</p>}
    </div>
  );
}
