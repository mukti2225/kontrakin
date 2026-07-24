import { ArrowDownRight, ArrowUpRight, CreditCard, Home, TrendingDown, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { StatRingkasan } from "@/lib/types";

const iconMap = {
  revenue: CreditCard,
  occupancy: Home,
  tenants: Users,
  overdue: TrendingDown,
} as const;

interface StatCardsProps {
  stats: StatRingkasan[];
}

export function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = iconMap[stat.icon];
        return (
          <Card key={stat.id} className="border-slate-200">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{stat.label}</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100">
                  <Icon className="h-3.5 w-3.5 text-slate-500" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <span className="font-mono text-2xl font-semibold tabular-nums">{stat.value}</span>
                <span className={`flex items-center gap-0.5 text-xs font-medium ${stat.naik ? "text-teal-700" : "text-orange-700"}`}>
                  {stat.naik ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {stat.delta}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
