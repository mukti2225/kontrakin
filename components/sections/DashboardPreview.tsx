import { CheckCircle2 } from "lucide-react";

export const DashboardPreview = () => {
  type RoomStatus = "lunas" | "jatuh-tempo" | "nunggak";

  const STATUS_STYLES: Record<RoomStatus, { bg: string; text: string; label: string }> = {
    lunas: { bg: "bg-[#E3F5EF]", text: "text-[#0FA37F]", label: "Lunas" },
    "jatuh-tempo": { bg: "bg-[#FDF1DC]", text: "text-[#B87706]", label: "Jatuh tempo" },
    nunggak: { bg: "bg-[#FBE7E6]", text: "text-[#C43D37]", label: "Nunggak" },
  };

  const ROOMS: { code: string; status: RoomStatus }[] = [
    { code: "A1", status: "lunas" },
    { code: "A2", status: "lunas" },
    { code: "A3", status: "jatuh-tempo" },
    { code: "B1", status: "lunas" },
    { code: "B2", status: "nunggak" },
    { code: "B3", status: "lunas" },
  ];

  const RoomStatusCard = ({ code, status }: { code: string; status: RoomStatus }) => {
    const s = STATUS_STYLES[status];
    return (
      <div className={`flex flex-col items-center justify-center rounded-lg ${s.bg} px-3 py-3`}>
        <span className="text-[13px] font-semibold text-[#12141B]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          {code}
        </span>
        <span className={`mt-1 text-[10px] font-medium ${s.text}`}>{s.label}</span>
      </div>
    );
  };

  const LEDGER = [
    { unit: "A1", penyewa: "Dewi R.", jatuhTempo: "5 Jul", status: "lunas" as RoomStatus, jumlah: "Rp 1.500.000" },
    { unit: "A3", penyewa: "Fajar S.", jatuhTempo: "8 Jul", status: "jatuh-tempo" as RoomStatus, jumlah: "Rp 1.600.000" },
    { unit: "B2", penyewa: "Rangga P.", jatuhTempo: "1 Jul", status: "nunggak" as RoomStatus, jumlah: "Rp 1.500.000" },
  ];

  return (
    <section className="bg-[#FAFAF8] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div>
            <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#0FA37F]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Dasbor
            </span>
            <h2 className="mt-3 max-w-[24ch] text-[30px] font-semibold tracking-tight text-[#12141B] md:text-[36px]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Tahu persis siapa yang belum bayar, tanpa buka buku catatan.
            </h2>
            <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-[#4B4F58]">Warna status langsung terlihat di setiap kamar. Klik satu unit untuk lihat riwayat pembayaran lengkap penyewanya.</p>
            <ul className="mt-6 flex flex-col gap-3">
              {["Update status pembayaran real-time", "Riwayat lengkap per penyewa", "Ekspor laporan ke Excel kapan saja"].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-[14px] text-[#12141B]">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0FA37F]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[#E5E5E0] bg-white p-6 shadow-[0_20px_50px_-20px_rgba(18,20,27,0.15)]">
            <div className="grid grid-cols-3 gap-3">
              {ROOMS.map((room) => (
                <RoomStatusCard key={room.code} {...room} />
              ))}
            </div>
            <div className="mt-6 border-t border-[#E5E5E0] pt-5">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    {["Unit", "Penyewa", "Jatuh Tempo", "Jumlah"].map((h) => (
                      <th key={h} className="pb-2 text-[11px] font-medium uppercase tracking-wide text-[#8A8E97]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LEDGER.map((row) => (
                    <tr key={row.unit} className="border-t border-[#F0F0EE]">
                      <td className="py-2.5 text-[13px] font-medium text-[#12141B]">{row.unit}</td>
                      <td className="py-2.5 text-[13px] text-[#4B4F58]">{row.penyewa}</td>
                      <td className="py-2.5 text-[13px] text-[#4B4F58]">{row.jatuhTempo}</td>
                      <td className="py-2.5 text-[13px] text-[#12141B]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {row.jumlah}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default DashboardPreview;
