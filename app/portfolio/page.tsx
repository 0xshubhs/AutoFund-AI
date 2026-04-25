import AutoFundLayout from "../components/AutoFundLayout";
import AutoFundChartCard from "../components/AutoFundChartCard";

export default function PortfolioPage() {
  return (
    <AutoFundLayout title="Portfolio Deep Dive" subtitle="Transparency into holdings and changes">
      <section className="border border-emerald-500/60 bg-zinc-950 p-5 md:col-span-2">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Holdings Table</h2>
        <div className="overflow-x-auto border border-zinc-700 bg-black text-sm">
          <table className="w-full min-w-[640px]">
            <thead className="text-zinc-400">
              <tr>
                <th className="p-3 text-left">Token</th>
                <th className="p-3 text-left">Allocation %</th>
                <th className="p-3 text-left">Entry Price</th>
                <th className="p-3 text-left">Current Price</th>
                <th className="p-3 text-left">PnL</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-zinc-800">
                <td className="p-3">BTC</td>
                <td className="p-3">42%</td>
                <td className="p-3">$62,140</td>
                <td className="p-3">$64,210</td>
                <td className="p-3 text-emerald-400">+3.3%</td>
              </tr>
              <tr className="border-t border-zinc-800">
                <td className="p-3">ETH</td>
                <td className="p-3">33%</td>
                <td className="p-3">$3,050</td>
                <td className="p-3">$3,244</td>
                <td className="p-3 text-emerald-400">+6.3%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Trade History</h2>
        <div className="space-y-2 text-sm">
          <div className="border border-zinc-700 bg-black p-3">BUY ETH · 03:12 UTC · Filled</div>
          <div className="border border-zinc-700 bg-black p-3">SELL BTC · 03:11 UTC · Filled</div>
          <div className="border border-zinc-700 bg-black p-3">BUY SOL · 03:10 UTC · Filled</div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Rebalance History</h2>
        <div className="space-y-2 text-sm">
          <div className="border border-zinc-700 bg-black p-3">
            03:10 UTC · Shifted +4% ETH · Reason: sector momentum
          </div>
          <div className="border border-zinc-700 bg-black p-3">
            15:02 UTC · Reduced BTC -3% · Reason: macro risk
          </div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5 md:col-span-2">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Performance Comparison</h2>
        <AutoFundChartCard
          title="Portfolio vs BTC vs Index"
          type="multiline"
          note="Use /currency/historical-klines + /index/historical-klines for benchmark lines."
        />
      </section>
    </AutoFundLayout>
  );
}
