/**
 * MarketMind coupling — INGEST side only.
 *
 * MarketMind (the sibling buildathon project) emits a
 * `marketmind.autofund.signal/v1` JSON: target weights + conviction +
 * contradiction flag + recommendedAction. AutoFund consumes it here and feeds
 * the contradiction flag + conviction into the existing risk gate (which
 * already has a `contradictionFlag` input). This file is fully self-contained —
 * there is NO runtime dependency on the MarketMind repo; we just parse a pasted
 * / uploaded / env-provided JSON object. If no signal is provided, AutoFund
 * behaves exactly as before.
 */

export type MarketMindSignal = {
  schema: string; // "marketmind.autofund.signal/v1"
  generatedAt?: string | number;
  targetWeights?: Record<string, number>;
  conviction?: number; // 0..1 or 0..100 (we normalize)
  contradiction?: boolean; // explicit contradiction flag
  contradictionFlag?: boolean; // alias tolerated
  recommendedAction?: string; // e.g. "reduce-risk", "hold", "rotate"
};

export type IngestedSignal = {
  valid: boolean;
  source: "MarketMind" | "none";
  contradictionFlag: boolean;
  conviction: number | null; // normalized 0..1
  recommendedAction: string | null;
  schema: string | null;
  error?: string;
};

const SCHEMA = "marketmind.autofund.signal/v1";

function normConviction(v: unknown): number | null {
  if (typeof v !== "number" || Number.isNaN(v)) return null;
  // Accept either 0..1 or 0..100; clamp to 0..1.
  const x = v > 1 ? v / 100 : v;
  return Math.max(0, Math.min(1, x));
}

/**
 * Parse + validate a MarketMind signal object (already JSON-parsed). Returns a
 * normalized IngestedSignal. Derives the contradiction flag from either the
 * explicit `contradiction` flag OR a "reduce/cut/sell"-style recommendedAction
 * paired with conviction above a threshold, so a strong contradicting call
 * engages the gate even if the producer didn't set the boolean.
 */
export function parseMarketMindSignal(raw: unknown): IngestedSignal {
  if (!raw || typeof raw !== "object") {
    return empty("not an object");
  }
  const s = raw as MarketMindSignal;
  if (s.schema && s.schema !== SCHEMA) {
    return empty(`unexpected schema "${s.schema}"`);
  }
  const conviction = normConviction(s.conviction);
  const explicit = Boolean(s.contradiction ?? s.contradictionFlag);
  const action = typeof s.recommendedAction === "string" ? s.recommendedAction : null;
  const actionContradicts =
    !!action && /reduce|cut|sell|de-?risk|defensive|exit/i.test(action) && (conviction ?? 0) >= 0.5;

  return {
    valid: true,
    source: "MarketMind",
    contradictionFlag: explicit || actionContradicts,
    conviction,
    recommendedAction: action,
    schema: s.schema ?? SCHEMA,
  };
}

function empty(error?: string): IngestedSignal {
  return {
    valid: false,
    source: "none",
    contradictionFlag: false,
    conviction: null,
    recommendedAction: null,
    schema: null,
    error,
  };
}

/**
 * Server-side: read a MarketMind signal from env if configured. Either inline
 * JSON (MARKETMIND_SIGNAL_JSON) or a URL to fetch (MARKETMIND_SIGNAL_URL). Both
 * optional; absence → no signal (today's behavior). Keyless.
 */
export async function loadMarketMindFromEnv(): Promise<IngestedSignal> {
  const inline = process.env.MARKETMIND_SIGNAL_JSON;
  if (inline) {
    try {
      return parseMarketMindSignal(JSON.parse(inline));
    } catch {
      return empty("MARKETMIND_SIGNAL_JSON not valid JSON");
    }
  }
  const url = process.env.MARKETMIND_SIGNAL_URL;
  if (url) {
    try {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 3000);
      const res = await fetch(url, { cache: "no-store", signal: ac.signal });
      clearTimeout(timer);
      if (!res.ok) return empty(`signal URL HTTP ${res.status}`);
      return parseMarketMindSignal(await res.json());
    } catch (err) {
      return empty(err instanceof Error ? err.message : "signal fetch failed");
    }
  }
  return empty();
}
