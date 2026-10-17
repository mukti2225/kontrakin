"use server";

import { requireTenant } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function updateTenantProfile(formData: FormData) {
  const user = await requireTenant();
  const nama = (formData.get("nama") as string)?.trim();
  const noHp = (formData.get("noHp") as string)?.trim();

  if (!nama) {
    throw new Error("Nama lengkap tidak boleh kosong");
  }

  if (!noHp) {
    throw new Error("Nomor HP / WhatsApp wajib diisi");
  }

  // Update user record
  await prisma.user.update({
    where: { id: user.id },
    data: { name: nama },
  });

  // Update corresponding penghuni records
  await prisma.penghuni.updateMany({
    where: {
      OR: [
        { userId: user.id },
        { email: user.email },
      ],
    },
    data: {
      nama,
      noHp,
    },
  });

  revalidatePath("/dashboard/tenant");
  revalidatePath("/dashboard/tenant/pengaturan");
  revalidatePath("/dashboard/tenant/tagihan");
  revalidatePath("/dashboard/tenant/kontrak");
  return { success: true };
}
