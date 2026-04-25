type AutoFundChartCardProps = {
  title: string;
  type: "line" | "multiline" | "donut" | "bar-compare" | "candlestick";
  note: string;
};

export default function AutoFundChartCard({ title, type, note }: AutoFundChartCardProps) {
  return (
    <div className="border border-zinc-700 bg-black p-3">
      <p className="text-xs text-emerald-400">{title}</p>
      <p className="mb-2 text-[11px] text-zinc-500">{type.toUpperCase()}</p>
      <div className="grid min-h-24 place-items-center border border-zinc-800 bg-zinc-950 text-xs text-zinc-500">
        Chart placeholder
      </div>
      <p className="mt-2 text-xs text-zinc-400">{note}</p>
    </div>
  );
}
