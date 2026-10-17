import { toast } from "sonner";
import { formatRupiah } from "@/lib/utils";

/**
 * Standardized Success Notification
 * Enforces Subject + Verb + Outcome convention across all modules.
 */
export function notifySuccess(entity: string, action: string, details?: string) {
  const message = `${entity} berhasil ${action}.`;
  toast.success(message, {
    description: details,
  });
}

/**
 * Standardized Financial Operation Success
 */
export function notifyFinancialSuccess(action: string, amount: number, reference?: string) {
  toast.success(`${action} berhasil diproses`, {
    description: `Nominal: ${formatRupiah(amount)}${reference ? ` • Ref: ${reference}` : ""}`,
  });
}

/**
 * Standardized Operational Error Notification
 * Replaces generic "Something went wrong" with specific diagnostic context.
 */
export function notifyError(
  context: string,
  error: unknown,
  fallbackMessage = "Terjadi kegagalan validasi atau server tidak merespon."
) {
  let detailMessage = fallbackMessage;

  if (error instanceof Error && error.message) {
    detailMessage = error.message;
  } else if (typeof error === "string" && error.length > 0) {
    detailMessage = error;
  }

  // Prevent generic fallback strings from being shown
  if (
    detailMessage.toLowerCase().includes("something went wrong") ||
    detailMessage.toLowerCase().includes("an error occurred")
  ) {
    detailMessage = `${context}: Silakan periksa kembali kelengkapan formulir atau koneksi server.`;
  }

  toast.error(`Gagal ${context}`, {
    description: detailMessage,
  });
}
