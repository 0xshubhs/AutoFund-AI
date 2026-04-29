"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ComposedChart,
  Line,
  LineChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  const timeline = [
    { t: "Mon", portfolio: 100, btc: 100, index: 100, risk: 42, drawdown: 0 },
    { t: "Tue", portfolio: 103, btc: 101, index: 100.4, risk: 48, drawdown: -1.2 },
    { t: "Wed", portfolio: 106, btc: 103, index: 101.4, risk: 54, drawdown: -1.8 },
    { t: "Thu", portfolio: 104, btc: 100.8, index: 100.9, risk: 61, drawdown: -3.4 },
    { t: "Fri", portfolio: 110, btc: 104, index: 102.2, risk: 57, drawdown: -2.1 },
    { t: "Sat", portfolio: 114, btc: 105, index: 103, risk: 52, drawdown: -1.5 },
    { t: "Sun", portfolio: 118, btc: 107, index: 104.3, risk: 49, drawdown: -0.9 },
  ];
  const allocation = [
    { t: "W1", l1: 44, ai: 21, defi: 19, stable: 16 },
    { t: "W2", l1: 39, ai: 27, defi: 18, stable: 16 },
    { t: "W3", l1: 35, ai: 31, defi: 17, stable: 17 },
    { t: "W4", l1: 33, ai: 34, defi: 15, stable: 18 },
  ];
  const rebalance = [
    { name: "BTC", before: 42, after: 35 },
    { name: "ETH", before: 28, after: 34 },
    { name: "AI", before: 18, after: 23 },
    { name: "USDC", before: 12, after: 8 },
  ];
  const candle = [
    { t: "9", close: 64.1, avg: 63.7, buy: 64.1 },
    { t: "10", close: 64.9, avg: 64.2, sell: 64.9 },
    { t: "11", close: 64.3, avg: 64.4 },
    { t: "12", close: 65.2, avg: 64.7, buy: 65.2 },
    { t: "13", close: 65.6, avg: 65.1 },
    { t: "14", close: 65.1, avg: 65.2, sell: 65.1 },
  ];
  const riskRadar = [
    { subject: "Volatility", v: 68 },
    { subject: "Drawdown", v: 55 },
    { subject: "Liquidity", v: 38 },
    { subject: "Correlation", v: 61 },
    { subject: "Macro", v: 57 },
  ];

  const commonAxis = { tick: { fill: "#a1a1aa", fontSize: 11 }, axisLine: false, tickLine: false };
  const chart = {
    line: (
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={timeline}>
          <XAxis dataKey="t" {...commonAxis} />
          <YAxis {...commonAxis} />
          <Tooltip />
          <Line type="monotone" dataKey="risk" stroke="#34d399" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    ),
    multiline: (
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={timeline}>
          <XAxis dataKey="t" {...commonAxis} />
          <YAxis {...commonAxis} />
          <Tooltip />
          <Line type="monotone" dataKey="portfolio" stroke="#34d399" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="btc" stroke="#f59e0b" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="index" stroke="#71717a" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    ),
    donut: (
      <ResponsiveContainer width="100%" height={180}>
        <RadarChart outerRadius={70} data={riskRadar}>
          <PolarGrid stroke="#27272a" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
          <Radar dataKey="v" stroke="#34d399" fill="#34d399" fillOpacity={0.35} />
        </RadarChart>
      </ResponsiveContainer>
    ),
    "bar-compare": (
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={rebalance}>
          <XAxis dataKey="name" {...commonAxis} />
          <YAxis {...commonAxis} />
          <Tooltip />
          <Bar dataKey="before" fill="#3f3f46" />
          <Bar dataKey="after" fill="#34d399" />
        </BarChart>
      </ResponsiveContainer>
    ),
    candlestick: (
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={candle}>
          <XAxis dataKey="t" {...commonAxis} />
          <YAxis {...commonAxis} />
          <Tooltip />
          <Bar dataKey="close" fill="#0f172a" barSize={16} />
          <Line dataKey="avg" stroke="#22d3ee" dot={false} strokeWidth={2} />
          <Line dataKey="buy" stroke="#34d399" dot={{ r: 4 }} connectNulls={false} />
          <Line dataKey="sell" stroke="#f97316" dot={{ r: 4 }} connectNulls={false} />
        </ComposedChart>
      </ResponsiveContainer>
    ),
    "stacked-area": (
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={allocation}>
          <XAxis dataKey="t" {...commonAxis} />
          <YAxis {...commonAxis} />
          <Tooltip />
          <Area type="monotone" dataKey="l1" stackId="1" stroke="#1f2937" fill="#064e3b" />
          <Area type="monotone" dataKey="ai" stackId="1" stroke="#0f766e" fill="#0f766e" />
          <Area type="monotone" dataKey="defi" stackId="1" stroke="#14b8a6" fill="#14b8a6" />
          <Area type="monotone" dataKey="stable" stackId="1" stroke="#94a3b8" fill="#334155" />
        </AreaChart>
      </ResponsiveContainer>
    ),
    gauge: (
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={[{ label: "Risk", score: 68 }, { label: "Limit", score: 80 }]}>
          <XAxis dataKey="label" {...commonAxis} />
          <YAxis domain={[0, 100]} {...commonAxis} />
          <Tooltip />
          <Bar dataKey="score" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
    ),
    drawdown: (
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={timeline}>
          <XAxis dataKey="t" {...commonAxis} />
          <YAxis {...commonAxis} />
          <Tooltip />
          <Line type="monotone" dataKey="drawdown" stroke="#f87171" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    ),
  }[type];

  return (
    <div className="border border-zinc-700 bg-black p-3">
      <p className="text-xs text-emerald-400">{title}</p>
      <p className="mb-2 text-[11px] text-zinc-500">{type.toUpperCase()}</p>
      <div className="grid min-h-44 place-items-center border border-zinc-800 bg-zinc-950 text-xs text-zinc-500">
        {chart}
      </div>
      <p className="mt-2 text-xs text-zinc-400">{note}</p>
    </div>
  );
}
