import AutoFundLayout from "../components/AutoFundLayout";

export default function SettingsPage() {
  return (
    <AutoFundLayout title="Settings" subtitle="System and execution preferences">
      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Trading Mode</h2>
        <div className="space-y-2 text-sm">
          <div className="border border-zinc-700 bg-black p-3">Automatic execution</div>
          <div className="border border-zinc-700 bg-black p-3">Fallback manual approval</div>
        </div>
      </section>

      <section className="border border-emerald-500/60 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-semibold text-emerald-300">Market Scope</h2>
        <div className="space-y-2 text-sm">
          <div className="border border-zinc-700 bg-black p-3">Spot only</div>
          <div className="border border-zinc-700 bg-black p-3">Rebalance frequency: hourly</div>
        </div>
      </section>
    </AutoFundLayout>
  );
}
