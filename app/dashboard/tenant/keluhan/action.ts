'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireTenant } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/db/prisma';
import { pemeliharaanService } from '@/lib/services/pemeliharaan.service';

export async function submitKeluhan(formData: FormData): Promise<void> {
  const user = await requireTenant();

  const judul = formData.get('judul') as string;
  const deskripsi = formData.get('deskripsi') as string;
  const kategori = formData.get('kategori') as string;
  const prioritas = formData.get('prioritas') as 'rendah' | 'sedang' | 'tinggi';

  if (!judul || !deskripsi || !kategori) {
    throw new Error('Harap lengkapi semua kolom wajib');
  }

  const penghuni = await prisma.penghuni.findFirst({
    where: { userId: user.id, status: 'aktif' },
    select: { id: true, ownerId: true, kamarId: true },
  });

  if (!penghuni || !penghuni.kamarId) {
    throw new Error('Data tenant belum terhubung ke kamar aktif.');
  }

  await pemeliharaanService.createKeluhan(penghuni.id, {
    judul,
    deskripsi,
    kategori,
    prioritas,
    ownerId: penghuni.ownerId,
    kamarId: penghuni.kamarId,
  });

  revalidatePath('/dashboard/tenant/keluhan');
  redirect('/dashboard/tenant/keluhan');
}
