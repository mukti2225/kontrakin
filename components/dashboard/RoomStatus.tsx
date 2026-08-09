import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/services/dashboard";
import type { Kamar, StatusKamar } from "@/lib/types";

function statusStyle(status: StatusKamar) {
  switch (status) {
    case "terisi":
      return "bg-teal-50 text-teal-800 border-teal-200";
    case "kosong":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "maintenance":
      return "bg-rose-50 text-rose-800 border-rose-200";
  }
}

interface RoomStatusProps {
  data: Kamar[];
}

export function RoomStatus({ data }: RoomStatusProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <p className="text-sm font-medium">Status kamar</p>
        <p className="text-xs text-slate-500">{data.length} kamar terdaftar</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.map((kamar) => (
            <div key={kamar.id} className={`rounded-lg border p-3 ${statusStyle(kamar.status)}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{kamar.nomor}</span>
                <Badge variant="outline" className="border-current bg-white/60 text-[10px] font-normal">
                  {kamar.status}
                </Badge>
              </div>
              <p className="mt-1 text-xs opacity-80">{kamar.tipe}</p>
              <p className="mt-2 font-mono text-xs tabular-nums">{formatRupiah(kamar.hargaBulanan)}/bln</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
