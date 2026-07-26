import { MoreHorizontal } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRupiah } from "@/lib/services/dashboard";
import type { Pembayaran, StatusPembayaran } from "@/lib/types";

function statusVariant(status: StatusPembayaran) {
  if (status === "Berhasil") return "default" as const;
  if (status === "Tertunda") return "secondary" as const;
  return "destructive" as const;
}

interface RecentPaymentsProps {
  data: Pembayaran[];
}

export function RecentPayments({ data }: RecentPaymentsProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <p className="text-sm font-medium">Pembayaran terbaru</p>
          <p className="text-xs text-slate-500">{data.length} transaksi terakhir</p>
        </div>
        <Button variant="outline" size="sm">
          Lihat semua
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {data.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-teal-50 text-xs font-medium text-teal-800">{tx.inisial}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{tx.penghuniNama}</p>
                <p className="text-xs text-slate-500">
                  Kamar {tx.kamarNomor} &middot; {tx.metode}
                </p>
              </div>
              <span className="w-28 text-right font-mono text-sm tabular-nums">{formatRupiah(tx.jumlah)}</span>
              <Badge variant={statusVariant(tx.status)} className="w-20 justify-center font-normal">
                {tx.status}
              </Badge>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
