"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { TitikData } from "@/lib/types";

interface OccupancyChartProps {
  data: TitikData[];
}

export function OccupancyChart({ data }: OccupancyChartProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-0">
        <p className="text-sm font-medium">Tingkat hunian</p>
        <p className="text-xs text-slate-500">Per bulan</p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="bulan" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
              <Tooltip formatter={(value) => [`${value ?? 0}%`, "Okupansi"]} contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e2e8f0" }} />
              <Bar dataKey="value" fill="#d85a30" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
