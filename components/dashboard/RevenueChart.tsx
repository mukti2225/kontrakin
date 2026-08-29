// components/dashboard/revenue-chart.tsx
"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import type { TitikData } from "@/lib/types";

interface RevenueChartProps {
  data: TitikData[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card className="border-slate-200 xl:col-span-2">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Pendapatan sewa bulanan</p>
            <p className="text-xs text-slate-500">6 bulan terakhir</p>
          </div>
          <Badge variant="secondary" className="font-normal">
            IDR
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f6e56" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#0f6e56" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="bulan" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
              <Tooltip formatter={(value) => [formatRupiah(Number(value ?? 0)), "Pendapatan"]} contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e2e8f0" }} />
              <Area type="monotone" dataKey="value" stroke="#0f6e56" strokeWidth={2} fill="url(#revFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
