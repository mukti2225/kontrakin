"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export function CapacityGauge({ filled, total }: { filled: number; total: number }) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  const empty = 100 - pct;

  const data = [
    { value: pct },
    { value: empty },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[110px] w-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="90%"
              startAngle={180}
              endAngle={0}
              innerRadius={52}
              outerRadius={72}
              dataKey="value"
              stroke="none"
            >
              <Cell fill="#0d9488" />
              <Cell fill="#e2e8f0" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className="text-2xl font-bold text-slate-800">{pct}%</span>
          <span className="text-[11px] text-slate-500">Terisi</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-teal-600" />
          Terisi
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-slate-200" />
          Kosong
        </span>
      </div>
    </div>
  );
}
