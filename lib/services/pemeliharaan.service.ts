import { pemeliharaanRepository } from "@/lib/repositories/pemeliharaan.repository";
import type { PemeliharaanDTO } from "@/lib/types/dto";
import { AppError } from "@/lib/errors";
import type { Prisma } from "@/lib/types";

export class PemeliharaanService {
  /**
   * Mendapatkan daftar pemeliharaan untuk owner, dimapping ke DTO
   */
  async getOwnerPemeliharaan(ownerId: string): Promise<PemeliharaanDTO[]> {
    try {
      const data = await pemeliharaanRepository.getByOwner(ownerId);
      return data.map((item: any) => this.mapToDTO(item));
    } catch (error) {
      console.error("Error fetching owner pemeliharaan:", error);
      throw new AppError("Gagal mengambil data pemeliharaan", 500);
    }
  }

  /**
   * Mendapatkan daftar keluhan untuk tenant, dimapping ke DTO
   */
  async getTenantKeluhan(penghuniId: string): Promise<PemeliharaanDTO[]> {
    try {
      const data = await pemeliharaanRepository.getByPenghuni(penghuniId);
      return data.map((item: any) => this.mapToDTO(item));
    } catch (error) {
      console.error("Error fetching tenant keluhan:", error);
      throw new AppError("Gagal mengambil data keluhan Anda", 500);
    }
  }

  /**
   * Membuat keluhan baru dari tenant
   */
  async createKeluhan(penghuniId: string, data: { judul: string; deskripsi: string; kategori: string; ownerId: string; kamarId: string; prioritas?: "rendah" | "sedang" | "tinggi" }): Promise<PemeliharaanDTO> {
    try {
      if (!data.judul || !data.deskripsi || !data.kategori) {
        throw new AppError("Data keluhan tidak lengkap", 400);
      }

      const input: Prisma.PemeliharaanUncheckedCreateInput = {
        judul: data.judul,
        deskripsi: data.deskripsi,
        kategori: data.kategori,
        prioritas: data.prioritas || "sedang",
        penghuniId,
        ownerId: data.ownerId,
        kamarId: data.kamarId,
        status: "menunggu",
      };

      const result = await pemeliharaanRepository.create(input);
      return this.mapToDTO(result);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("Error creating keluhan:", error);
      throw new AppError("Gagal membuat keluhan baru", 500);
    }
  }

  /**
   * Owner memperbarui status pemeliharaan
   */
  async updateStatus(id: string, status: "menunggu" | "diproses" | "selesai"): Promise<PemeliharaanDTO> {
    try {
      const result = await pemeliharaanRepository.updateStatus(id, status);
      return this.mapToDTO(result);
    } catch (error) {
      console.error("Error updating status pemeliharaan:", error);
      throw new AppError("Gagal memperbarui status", 500);
    }
  }

  private mapToDTO(item: any): PemeliharaanDTO {
    return {
      id: item.id,
      judul: item.judul,
      deskripsi: item.deskripsi,
      status: item.status as "menunggu" | "diproses" | "selesai",
      prioritas: item.prioritas as "rendah" | "sedang" | "tinggi",
      kategori: item.kategori,
      foto: item.foto,
      penghuniNama: item.penghuni?.nama,
      kamarNomor: item.kamar?.nomor,
      tanggalDibuat: item.createdAt.toISOString(),
    };
  }
}

export const pemeliharaanService = new PemeliharaanService();
