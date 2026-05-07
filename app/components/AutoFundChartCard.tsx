"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SeriesPoint = {
  t: string;
  portfolio?: number;
  btc?: number;
  eth?: number;
  index?: number;
  risk?: number;
  drawdown?: number;
};

type AllocationPoint = { t: string; l1: number; ai: number; defi: number; stable: number };

type RebalancePoint = { name: string; before: number; after: number };

type CandlePoint = { t: string; close: number; avg?: number; buy?: number | null; sell?: number | null };

type RadarPoint = { subject: string; v: number };

type DonutSlice = { name: string; value: number };

export type ChartPayload =
  | { type: "line"; data: SeriesPoint[]; dataKey?: keyof SeriesPoint; color?: string }
  | { type: "multiline"; data: SeriesPoint[] }
  | { type: "donut"; data: DonutSlice[] }
  | { type: "radar"; data: RadarPoint[] }
  | { type: "bar-compare"; data: RebalancePoint[] }
  | { type: "candlestick"; data: CandlePoint[] }
  | { type: "stacked-area"; data: AllocationPoint[] }
  | { type: "gauge"; score: number; cap?: number }
  | { type: "drawdown"; data: SeriesPoint[] };

export type AutoFundChartType = ChartPayload["type"];

type AutoFundChartCardProps = {
  payload: ChartPayload;
  height?: number;
};

const axis = {
  tick: { fill: "#a1a1aa", fontSize: 11 },
  axisLine: false,
  tickLine: false,
};

const tooltipStyle = {
  contentStyle: {
    background: "#000",
    border: "1px solid #27272a",
    borderRadius: 0,
    fontSize: 11,
    color: "#e4e4e7",
  },
  labelStyle: { color: "#71717a" },
  cursor: { fill: "#0c1410" },
};

const DONUT_COLORS = ["#22c55e", "#10b981", "#34d399", "#f59e0b", "#71717a"];

export default function AutoFundChartCard({ payload, height = 200 }: AutoFundChartCardProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      {renderChart(payload)}
    </ResponsiveContainer>
  );
}

function renderChart(p: ChartPayload) {
  switch (p.type) {
    case "line": {
      const dk = (p.dataKey ?? "risk") as string;
      const color = p.color ?? "#34d399";
      return (
        <LineChart data={p.data} margin={{ top: 6, right: 8, bottom: 0, left: -10 }}>
          <XAxis dataKey="t" {...axis} />
          <YAxis {...axis} />
          <Tooltip {...tooltipStyle} />
          <Line type="monotone" dataKey={dk} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      );
    }
    case "multiline":
      return (
        <LineChart data={p.data} margin={{ top: 6, right: 8, bottom: 0, left: -10 }}>
          <XAxis dataKey="t" {...axis} />
          <YAxis {...axis} domain={["auto", "auto"]} />
          <Tooltip {...tooltipStyle} />
          <Line type="monotone" dataKey="portfolio" name="Fund" stroke="#22c55e" strokeWidth={2.4} dot={false} />
          <Line type="monotone" dataKey="btc" name="BTC" stroke="#f59e0b" strokeWidth={1.6} dot={false} />
          <Line type="monotone" dataKey="index" name="Index" stroke="#71717a" strokeWidth={1.4} dot={false} strokeDasharray="3 3" />
        </LineChart>
      );
    case "donut":
      return (
        <PieChart>
          <Tooltip {...tooltipStyle} />
          <Pie
            data={p.data}
            dataKey="value"
            nameKey="name"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            stroke="#000"
          >
            {p.data.map((_, i) => (
              <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      );
    case "radar":
      return (
        <RadarChart outerRadius={70} data={p.data}>
          <PolarGrid stroke="#27272a" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
          <Radar dataKey="v" stroke="#22c55e" fill="#22c55e" fillOpacity={0.32} />
        </RadarChart>
      );
    case "bar-compare":
      return (
        <BarChart data={p.data} margin={{ top: 6, right: 8, bottom: 0, left: -10 }}>
          <XAxis dataKey="name" {...axis} />
          <YAxis {...axis} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="before" fill="#3f3f46" name="Before" />
          <Bar dataKey="after" fill="#22c55e" name="After" />
        </BarChart>
      );
    case "candlestick":
      return (
        <ComposedChart data={p.data} margin={{ top: 6, right: 8, bottom: 0, left: -10 }}>
          <XAxis dataKey="t" {...axis} />
          <YAxis {...axis} domain={["auto", "auto"]} />
          <Tooltip {...tooltipStyle} />
          <Line type="monotone" dataKey="close" stroke="#52525b" strokeWidth={1.4} dot={false} />
          <Line type="monotone" dataKey="avg" stroke="#22d3ee" strokeWidth={1.6} dot={false} />
          <Scatter dataKey="buy" fill="#22c55e" />
          <Scatter dataKey="sell" fill="#f97316" />
        </ComposedChart>
      );
    case "stacked-area":
      return (
        <AreaChart data={p.data} margin={{ top: 6, right: 8, bottom: 0, left: -10 }}>
          <XAxis dataKey="t" {...axis} />
          <YAxis {...axis} />
          <Tooltip {...tooltipStyle} />
          <Area type="monotone" dataKey="l1" stackId="1" stroke="#064e3b" fill="#064e3b" name="L1" />
          <Area type="monotone" dataKey="ai" stackId="1" stroke="#0f766e" fill="#0f766e" name="AI" />
          <Area type="monotone" dataKey="defi" stackId="1" stroke="#14b8a6" fill="#14b8a6" name="DeFi" />
          <Area type="monotone" dataKey="stable" stackId="1" stroke="#475569" fill="#334155" name="Stable" />
        </AreaChart>
      );
    case "gauge": {
      const score = clamp(p.score, 0, 100);
      const cap = clamp(p.cap ?? 80, 0, 100);
      const data = [
        { name: "score", value: score },
        { name: "rest", value: Math.max(0, 100 - score) },
      ];
      const color = score < 40 ? "#22c55e" : score < 70 ? "#f59e0b" : "#ef4444";
      return (
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            startAngle={180}
            endAngle={0}
            innerRadius={56}
            outerRadius={84}
            stroke="none"
            cy="76%"
          >
            <Cell fill={color} />
            <Cell fill="#1f1f1f" />
          </Pie>
          <Pie
            data={[{ value: 1 }]}
            dataKey="value"
            startAngle={180 - cap * 1.8}
            endAngle={180 - cap * 1.8 - 2}
            innerRadius={56}
            outerRadius={88}
            stroke="none"
            cy="76%"
          >
            <Cell fill="#fafafa" />
          </Pie>
        </PieChart>
      );
    }
    case "drawdown":
      return (
        <AreaChart data={p.data} margin={{ top: 6, right: 8, bottom: 0, left: -10 }}>
          <XAxis dataKey="t" {...axis} />
          <YAxis {...axis} />
          <Tooltip {...tooltipStyle} />
          <ReferenceLine y={0} stroke="#3f3f46" strokeDasharray="2 2" />
          <Area type="monotone" dataKey="drawdown" stroke="#ef4444" fill="#7f1d1d" fillOpacity={0.45} />
        </AreaChart>
      );
  }
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
