import AutoFundLayout from "../components/AutoFundLayout";
import AutoFundChartCard from "../components/AutoFundChartCard";

export default function ExecutionPage() {
  return (
    <AutoFundLayout
      title="Execution Monitor"
      subtitle="Track SoDEX order flow and execution quality"
    >
      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Live Orders</h2>
        <div className="space-y-2 text-sm">
          <div className="border border-zinc-700 bg-black p-3">ETH-USDT · Buy · 0.35 ETH</div>
          <div className="border border-zinc-700 bg-black p-3">BTC-USDT · Sell · 0.01 BTC</div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Order Status</h2>
        <div className="space-y-2 text-sm">
          <div className="border border-zinc-700 bg-black p-3">ETH order: Partially Filled</div>
          <div className="border border-zinc-700 bg-black p-3">BTC order: Filled</div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Execution Logs</h2>
        <div className="space-y-2 text-sm">
          <div className="border border-zinc-700 bg-black p-3">03:12:10 · Sent order batch #882</div>
          <div className="border border-zinc-700 bg-black p-3">03:12:11 · Ack received in 141 ms</div>
          <div className="border border-zinc-700 bg-black p-3">03:12:14 · Fill complete</div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Slippage and Price Info</h2>
        <div className="space-y-2 text-sm">
          <div className="border border-zinc-700 bg-black p-3">ETH slippage: 0.14%</div>
          <div className="border border-zinc-700 bg-black p-3">BTC slippage: 0.08%</div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5 md:col-span-2">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Trade Execution Chart</h2>
        <AutoFundChartCard
          title="Candles with Buy/Sell Markers"
          type="candlestick"
          note="Shows execution points overlaid on price structure for auditability."
        />
      </section>
    </AutoFundLayout>
  );
}
