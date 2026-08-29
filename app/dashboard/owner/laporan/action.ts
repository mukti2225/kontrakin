"use server";

import { revalidatePath } from "next/cache";
import { pemeliharaanService } from "@/lib/services/pemeliharaan.service";

export async function updateStatusPemeliharaan(id: string, status: "menunggu" | "diproses" | "selesai") {
  try {
    await pemeliharaanService.updateStatus(id, status);

    revalidatePath("/dashboard/owner/pemeliharaan");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Terjadi kesalahan" };
  }
}
