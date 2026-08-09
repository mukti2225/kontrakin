import { getCurrentUser } from '@/lib/auth/get-current-user';
import { pemeliharaanService } from '@/lib/services/pemeliharaan.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { updateStatusPemeliharaan } from './action';
import { redirect } from 'next/navigation';

export default async function OwnerPemeliharaanPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'owner' && user.role !== 'super-admin')) redirect('/unauthorized');

  // In a real app, use the actual owner ID
  const ownerId = 'dummy-owner-id'; // user.id
  const pemeliharaanList = await pemeliharaanService.getOwnerPemeliharaan(ownerId);

  const statusColor = {
    menunggu: 'bg-amber-100 text-amber-800',
    diproses: 'bg-blue-100 text-blue-800',
    selesai: 'bg-teal-100 text-teal-800',
  };

  const prioritasColor = {
    rendah: 'text-slate-500',
    sedang: 'text-amber-500',
    tinggi: 'text-rose-500',
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Pemeliharaan</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola keluhan dan permintaan perbaikan dari tenant Anda.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          {pemeliharaanList.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border border-dashed rounded-lg">
              Tidak ada laporan pemeliharaan saat ini.
            </div>
          ) : (
            <div className="space-y-4">
              {pemeliharaanList.map((item) => (
                <div key={item.id} className="p-5 border rounded-lg flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-white hover:bg-slate-50 transition-colors">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg text-slate-900">{item.judul}</h3>
                      <Badge variant="secondary" className={statusColor[item.status]}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <p className="text-slate-600 text-sm">{item.deskripsi}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium pt-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Tenant: {item.penghuniNama || '-'} (Kamar {item.kamarNomor || '-'})
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Kategori: {item.kategori}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        <span className={prioritasColor[item.prioritas]}>
                          Prioritas: {item.prioritas.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Dilaporkan: {new Date(item.tanggalDibuat).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <form action={async (formData) => {
                      'use server';
                      await updateStatusPemeliharaan(item.id, formData.get('status') as any);
                    }} className="flex items-center gap-2 w-full">
                      <select 
                        name="status" 
                        defaultValue={item.status}
                        className="h-9 w-full md:w-36 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="menunggu">Menunggu</option>
                        <option value="diproses">Diproses</option>
                        <option value="selesai">Selesai</option>
                      </select>
                      <Button type="submit" size="sm" variant="secondary" className="shrink-0 bg-slate-900 text-white hover:bg-slate-800">
                        Update
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
