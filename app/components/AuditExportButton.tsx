"use client";

import { useState } from "react";

/**
 * Downloads the latest decision audit log (signals + raw/gated weights + gate
 * pass/fail + reasoning + history) as a JSON file — the DAO-treasurer "prove
 * it" artifact. Pulls from /api/autofund/audit.
 */
export default function AuditExportButton() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const download = async () => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/autofund/audit", { cache: "no-store" });
      const json = await res.json();
      const blob = new Blob([JSON.stringify(json.data ?? json, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `autofund-audit-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={download}
        disabled={busy}
        className="border border-emerald-500/70 bg-emerald-500/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-50"
      >
        {busy ? "Exporting…" : "Download audit log"}
      </button>
      {err && <span className="text-[10px] text-rose-400">{err}</span>}
    </div>
  );
}
