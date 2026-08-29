"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const weeklyData = [
  { day: "S", value: 60 },
  { day: "M", value: 75 },
  { day: "T", value: 85 },
  { day: "W", value: 95 },
  { day: "T", value: 70 },
  { day: "F", value: 55 },
  { day: "S", value: 50 },
];

const TEAL = "#0d9488";
const TEAL_LIGHT = "#5eead4";
const GRAY = "#e2e8f0";

export function OccupancyBarChart({
  occupancyRate,
}: {
  occupancyRate: number;
}) {
  // Highlight the tallest bar (Wednesday = index 3) in teal, others in gray/light
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={weeklyData} barSize={32} barGap={6}>
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#94a3b8", fontSize: 12 }}
        />
        <YAxis hide />
        <Tooltip
          cursor={false}
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs shadow-md">
                  <p className="font-semibold text-slate-700">{label}</p>
                  <p className="text-teal-600">{payload[0].value}% hunian</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
          {weeklyData.map((entry, index) => {
            let color = GRAY;
            if (index === 3) color = TEAL; // W = highlight utama
            if (index === 2) color = TEAL_LIGHT; // T = secondary
            return <Cell key={`cell-${index}`} fill={color} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
