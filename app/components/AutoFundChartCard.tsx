type AutoFundChartCardProps = {
  title: string;
  type:
    | "line"
    | "multiline"
    | "donut"
    | "bar-compare"
    | "candlestick"
    | "stacked-area"
    | "gauge"
    | "drawdown";
  note: string;
};

export default function AutoFundChartCard({ title, type, note }: AutoFundChartCardProps) {
  const chart = {
    line: (
      <svg viewBox="0 0 240 120" className="h-full w-full">
        <polyline
          points="0,92 35,83 70,77 105,60 140,52 175,45 210,30 240,24"
          fill="none"
          stroke="#34d399"
          strokeWidth="3"
        />
      </svg>
    ),
    multiline: (
      <svg viewBox="0 0 240 120" className="h-full w-full">
        <polyline
          points="0,93 35,88 70,76 105,66 140,61 175,50 210,42 240,35"
          fill="none"
          stroke="#34d399"
          strokeWidth="3"
        />
        <polyline
          points="0,95 35,91 70,84 105,80 140,78 175,73 210,66 240,62"
          fill="none"
          stroke="#a1a1aa"
          strokeWidth="2"
        />
        <polyline
          points="0,96 35,92 70,88 105,86 140,82 175,80 210,75 240,70"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
        />
      </svg>
    ),
    donut: (
      <svg viewBox="0 0 240 120" className="h-full w-full">
        <circle cx="120" cy="60" r="34" fill="none" stroke="#27272a" strokeWidth="16" />
        <circle
          cx="120"
          cy="60"
          r="34"
          fill="none"
          stroke="#10b981"
          strokeWidth="16"
          strokeDasharray="110 214"
          transform="rotate(-90 120 60)"
        />
        <circle
          cx="120"
          cy="60"
          r="34"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="16"
          strokeDasharray="54 214"
          strokeDashoffset="-115"
          transform="rotate(-90 120 60)"
        />
      </svg>
    ),
    "bar-compare": (
      <svg viewBox="0 0 240 120" className="h-full w-full">
        <rect x="30" y="44" width="18" height="60" fill="#3f3f46" />
        <rect x="55" y="30" width="18" height="74" fill="#10b981" />
        <rect x="95" y="52" width="18" height="52" fill="#3f3f46" />
        <rect x="120" y="33" width="18" height="71" fill="#10b981" />
        <rect x="160" y="60" width="18" height="44" fill="#3f3f46" />
        <rect x="185" y="45" width="18" height="59" fill="#10b981" />
      </svg>
    ),
    candlestick: (
      <svg viewBox="0 0 240 120" className="h-full w-full">
        <line x1="45" y1="28" x2="45" y2="90" stroke="#22d3ee" />
        <rect x="38" y="45" width="14" height="24" fill="#22d3ee" />
        <line x1="95" y1="22" x2="95" y2="80" stroke="#f87171" />
        <rect x="88" y="32" width="14" height="30" fill="#f87171" />
        <line x1="145" y1="40" x2="145" y2="100" stroke="#22d3ee" />
        <rect x="138" y="58" width="14" height="26" fill="#22d3ee" />
        <line x1="195" y1="25" x2="195" y2="95" stroke="#22d3ee" />
        <rect x="188" y="42" width="14" height="32" fill="#22d3ee" />
        <circle cx="95" cy="22" r="4" fill="#10b981" />
        <circle cx="145" cy="100" r="4" fill="#f97316" />
      </svg>
    ),
    "stacked-area": (
      <svg viewBox="0 0 240 120" className="h-full w-full">
        <path d="M0 100 L40 96 L80 88 L120 82 L160 76 L200 69 L240 63 L240 120 L0 120 Z" fill="#064e3b" />
        <path d="M0 84 L40 80 L80 72 L120 67 L160 62 L200 58 L240 52 L240 63 L200 69 L160 76 L120 82 L80 88 L40 96 L0 100 Z" fill="#0f766e" />
        <path d="M0 68 L40 66 L80 60 L120 56 L160 50 L200 45 L240 40 L240 52 L200 58 L160 62 L120 67 L80 72 L40 80 L0 84 Z" fill="#22d3ee" />
      </svg>
    ),
    gauge: (
      <svg viewBox="0 0 240 120" className="h-full w-full">
        <path d="M35 95 A85 85 0 0 1 205 95" fill="none" stroke="#27272a" strokeWidth="16" />
        <path d="M35 95 A85 85 0 0 1 170 27" fill="none" stroke="#f59e0b" strokeWidth="16" />
        <line x1="120" y1="95" x2="164" y2="54" stroke="#fafafa" strokeWidth="3" />
        <circle cx="120" cy="95" r="6" fill="#fafafa" />
      </svg>
    ),
    drawdown: (
      <svg viewBox="0 0 240 120" className="h-full w-full">
        <polyline
          points="0,24 35,32 70,35 105,50 140,66 175,57 210,72 240,66"
          fill="none"
          stroke="#f87171"
          strokeWidth="3"
        />
        <line x1="0" y1="24" x2="240" y2="24" stroke="#52525b" strokeDasharray="4 4" />
      </svg>
    ),
  }[type];

  return (
    <div className="border border-zinc-700 bg-black p-3">
      <p className="text-xs text-emerald-400">{title}</p>
      <p className="mb-2 text-[11px] text-zinc-500">{type.toUpperCase()}</p>
      <div className="grid min-h-28 place-items-center border border-zinc-800 bg-zinc-950 text-xs text-zinc-500">
        {chart}
      </div>
      <p className="mt-2 text-xs text-zinc-400">{note}</p>
    </div>
  );
}
