"use client";

import { useState, useTransition, useId } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  FileText,
  Clock,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/utils/export-csv";
import { normalizeIndonesianPhone } from "@/lib/communication/provider";
import {
  importPenghuniBatch,
  getTenantImportHistory,
  type ImportPenghuniRow,
  type ImportRowError,
} from "@/app/dashboard/owner/penghuni/action";

interface TenantImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: (created: any[]) => void;
}

type Step = "upload" | "mapping" | "preview" | "result" | "history";

interface FieldMapping {
  nama: string;
  noHp: string;
  email: string;
  noKtp: string;
  tanggalMasuk: string;
  catatan: string;
}

const TEMPLATE_HEADERS = [
  "Nama Lengkap",
  "No WhatsApp",
  "Email",
  "No KTP",
  "Tanggal Masuk",
  "Catatan",
];

const TEMPLATE_SAMPLE_ROWS = [
  [
    "Budi Santoso",
    "081234567890",
    "budi.santoso@email.com",
    "3201010101010001",
    "2026-03-01",
    "Karyawan BUMN",
  ],
  [
    "Siti Aminah",
    "085712345678",
    "siti.aminah@email.com",
    "3201010202020002",
    "2026-03-05",
    "Mahasiswi Universitas",
  ],
  [
    "Rian Hidayat",
    "082198765432",
    "rian.h@email.com",
    "",
    "2026-03-10",
    "Wirausaha",
  ],
];

/**
 * Robust CSV parser supporting quotes and escaped commas
 */
function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  const rawLines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

  for (const rawLine of rawLines) {
    const row: string[] = [];
    let insideQuote = false;
    let currentCell = "";

    for (let i = 0; i < rawLine.length; i++) {
      const char = rawLine[i];
      if (char === '"' || char === "'") {
        insideQuote = !insideQuote;
      } else if ((char === "," || char === "\t" || char === ";") && !insideQuote) {
        row.push(currentCell.trim().replace(/^["']|["']$/g, ""));
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
    row.push(currentCell.trim().replace(/^["']|["']$/g, ""));
    if (row.some((cell) => cell.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

export function TenantImportModal({
  open,
  onOpenChange,
  onImportSuccess,
}: TenantImportModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [uploadMode, setUploadMode] = useState<"file" | "paste">("file");
  const [fileName, setFileName] = useState<string>("");
  const [rawText, setRawText] = useState<string>("");
  const [parsedRows, setParsedRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<FieldMapping>({
    nama: "",
    noHp: "",
    email: "",
    noKtp: "",
    tanggalMasuk: "",
    catatan: "",
  });

  const [previewFilter, setPreviewFilter] = useState<"all" | "valid" | "error">("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<{
    totalProcessed: number;
    importedCount: number;
    failedCount: number;
    errors: ImportRowError[];
  } | null>(null);

  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fileInputId = useId();

  // Reset modal state
  function handleClose() {
    setStep("upload");
    setRawText("");
    setFileName("");
    setParsedRows([]);
    setHeaders([]);
    setImportResult(null);
    onOpenChange(false);
  }

  // 1-Click download standardized template
  function downloadSampleTemplate() {
    exportToCSV("template_impor_penghuni", TEMPLATE_HEADERS, TEMPLATE_SAMPLE_ROWS);
    toast.success("Template CSV berhasil diunduh. Silakan isi di Excel atau Google Sheets.");
  }

  // Process raw text or file text
  function processContent(content: string, name = "Data Tempel") {
    const table = parseCSV(content);
    if (table.length < 2) {
      toast.error("File harus memiliki baris header dan minimal 1 baris data penyewa");
      return;
    }

    const detectedHeaders = table[0];
    const dataRows = table.slice(1);

    setFileName(name);
    setHeaders(detectedHeaders);
    setParsedRows(dataRows);

    // Auto-map columns based on heuristics
    const autoMap: FieldMapping = {
      nama: "",
      noHp: "",
      email: "",
      noKtp: "",
      tanggalMasuk: "",
      catatan: "",
    };

    detectedHeaders.forEach((h) => {
      const lower = h.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!autoMap.nama && (lower.includes("nama") || lower.includes("name") || lower.includes("penyewa") || lower.includes("tenant"))) {
        autoMap.nama = h;
      } else if (!autoMap.noHp && (lower.includes("hp") || lower.includes("wa") || lower.includes("whatsapp") || lower.includes("telepon") || lower.includes("phone") || lower.includes("kontak"))) {
        autoMap.noHp = h;
      } else if (!autoMap.email && (lower.includes("email") || lower.includes("mail") || lower.includes("surel"))) {
        autoMap.email = h;
      } else if (!autoMap.noKtp && (lower.includes("ktp") || lower.includes("nik") || lower.includes("identitas") || lower.includes("noktp"))) {
        autoMap.noKtp = h;
      } else if (!autoMap.tanggalMasuk && (lower.includes("tanggal") || lower.includes("tgl") || lower.includes("masuk") || lower.includes("mulai") || lower.includes("start"))) {
        autoMap.tanggalMasuk = h;
      } else if (!autoMap.catatan && (lower.includes("catatan") || lower.includes("note") || lower.includes("keterangan") || lower.includes("deskripsi"))) {
        autoMap.catatan = h;
      }
    });

    setMapping(autoMap);
    setStep("mapping");
  }

  // File picker handler
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      processContent(text, file.name);
    };
    reader.onerror = () => {
      toast.error("Gagal membaca berkas. Pastikan format CSV valid.");
    };
    reader.readAsText(file);
  }

  // Generate preview items based on current mapping
  const previewItems = parsedRows.map((row, idx) => {
    const getVal = (colName: string) => {
      if (!colName) return "";
      const colIdx = headers.indexOf(colName);
      return colIdx >= 0 ? (row[colIdx] || "").trim() : "";
    };

    const nama = getVal(mapping.nama);
    const noHp = getVal(mapping.noHp);
    const email = getVal(mapping.email);
    const noKtp = getVal(mapping.noKtp);
    const tanggalMasuk = getVal(mapping.tanggalMasuk);
    const catatan = getVal(mapping.catatan);

    let valid = true;
    let error = "";

    if (!nama) {
      valid = false;
      error = "Nama penyewa wajib diisi";
    } else if (!noHp) {
      valid = false;
      error = "Nomor WhatsApp/HP wajib diisi";
    } else {
      const digits = noHp.replace(/\D/g, "");
      if (digits.length < 9 || digits.length > 15) {
        valid = false;
        error = "Format HP tidak valid (harus 9-15 digit)";
      }
    }

    return {
      rowNumber: idx + 2, // 1-indexed including header
      data: { nama, noHp, email, noKtp, tanggalMasuk, catatan } as ImportPenghuniRow,
      valid,
      error,
    };
  });

  const validCount = previewItems.filter((p) => p.valid).length;
  const errorCount = previewItems.filter((p) => !p.valid).length;

  const filteredPreview = previewItems.filter((item) => {
    if (previewFilter === "valid") return item.valid;
    if (previewFilter === "error") return !item.valid;
    return true;
  });

  // Handle final import submission
  async function handleExecuteImport() {
    const validRows = previewItems.filter((p) => p.valid).map((p) => ({
      ...p.data,
      rowNumber: p.rowNumber,
    }));

    if (validRows.length === 0) {
      toast.error("Tidak ada baris valid yang dapat diimpor");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await importPenghuniBatch(validRows, { fileName });
      setImportResult({
        totalProcessed: parsedRows.length,
        importedCount: res.importedCount,
        failedCount: errorCount + res.failedCount,
        errors: [
          ...previewItems
            .filter((p) => !p.valid)
            .map((p) => ({
              rowNumber: p.rowNumber,
              nama: p.data.nama,
              noHp: p.data.noHp,
              email: p.data.email,
              noKtp: p.data.noKtp,
              tanggalMasuk: p.data.tanggalMasuk,
              catatan: p.data.catatan,
              reason: p.error,
            })),
          ...res.errors,
        ],
      });

      if (res.importedCount > 0) {
        onImportSuccess(res.created);
        toast.success(`Berhasil mengimpor ${res.importedCount} penyewa ke sistem`);
      } else {
        toast.error("Tidak ada penyewa yang berhasil diimpor karena data duplikat atau bermasalah");
      }

      setStep("result");
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat memproses impor data");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Download failed rows as CSV with reason column
  function handleDownloadFailedRows() {
    if (!importResult || importResult.errors.length === 0) return;

    const failedHeaders = [
      "Baris",
      "Nama Lengkap",
      "No WhatsApp",
      "Email",
      "No KTP",
      "Tanggal Masuk",
      "Catatan",
      "Alasan Gagal",
    ];

    const failedRows = importResult.errors.map((err) => [
      err.rowNumber,
      err.nama,
      err.noHp,
      err.email || "",
      err.noKtp || "",
      err.tanggalMasuk || "",
      err.catatan || "",
      err.reason,
    ]);

    exportToCSV(`penyewa_gagal_impor_${fileName.replace(/\.[^/.]+$/, "")}`, failedHeaders, failedRows);
    toast.success("Daftar baris gagal berhasil diunduh. Perbaiki dan unggah kembali.");
  }

  // Load audit history
  async function loadHistory() {
    setLoadingHistory(true);
    setStep("history");
    try {
      const logs = await getTenantImportHistory();
      setHistoryList(logs);
    } catch (err: any) {
      toast.error("Gagal memuat riwayat impor: " + err.message);
    } finally {
      setLoadingHistory(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="size-5 text-teal-600" />
              Impor & Migrasi Data Penyewa
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">
              Migrasikan daftar penyewa massal dari Excel atau CSV dengan pemetaan kolom otomatis & deteksi duplikat
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2">
            {step !== "history" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={loadHistory}
                className="text-xs h-8 border-slate-200 text-slate-700 rounded-lg gap-1.5"
              >
                <Clock className="size-3.5 text-slate-500" />
                Riwayat Impor
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("upload")}
                className="text-xs h-8 border-slate-200 text-slate-700 rounded-lg gap-1.5"
              >
                <ArrowLeft className="size-3.5" />
                Kembali ke Impor
              </Button>
            )}
          </div>
        </div>

        {/* Step Progression Indicator */}
        {step !== "history" && step !== "result" && (
          <div className="px-6 py-2.5 bg-slate-100/60 border-b border-slate-200/70 flex items-center gap-2 text-xs">
            <span
              className={`flex items-center gap-1.5 font-medium ${
                step === "upload" ? "text-teal-700 font-semibold" : "text-slate-500"
              }`}
            >
              <span className={`size-5 rounded-full flex items-center justify-center text-[10px] ${
                step === "upload" ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-700"
              }`}>1</span>
              Pilih Berkas
            </span>
            <span className="text-slate-400">/</span>
            <span
              className={`flex items-center gap-1.5 font-medium ${
                step === "mapping" ? "text-teal-700 font-semibold" : "text-slate-500"
              }`}
            >
              <span className={`size-5 rounded-full flex items-center justify-center text-[10px] ${
                step === "mapping" ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-700"
              }`}>2</span>
              Pemetaan Kolom
            </span>
            <span className="text-slate-400">/</span>
            <span
              className={`flex items-center gap-1.5 font-medium ${
                step === "preview" ? "text-teal-700 font-semibold" : "text-slate-500"
              }`}
            >
              <span className={`size-5 rounded-full flex items-center justify-center text-[10px] ${
                step === "preview" ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-700"
              }`}>3</span>
              Pratinjau & Validasi
            </span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* ──────────────── STEP 1: UPLOAD ──────────────── */}
          {step === "upload" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadMode("file")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      uploadMode === "file"
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Unggah File (CSV / TXT)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode("paste")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      uploadMode === "paste"
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Tempel Teks Clipboard
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadSampleTemplate}
                  className="text-xs h-8 border-teal-200 bg-teal-50/50 text-teal-800 hover:bg-teal-100/70 rounded-lg gap-1.5"
                >
                  <Download className="size-3.5" />
                  Unduh Template CSV
                </Button>
              </div>

              {uploadMode === "file" ? (
                <div>
                  <input
                    id={fileInputId}
                    type="file"
                    accept=".csv, .txt, .tsv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor={fileInputId}
                    className="border-2 border-dashed border-slate-300 hover:border-teal-500 bg-slate-50/50 hover:bg-teal-50/20 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group"
                  >
                    <div className="size-12 rounded-full bg-teal-100/80 group-hover:scale-110 text-teal-700 flex items-center justify-center mb-3 transition-transform">
                      <Upload className="size-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      Klik untuk memilih berkas atau seret berkas ke sini
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Mendukung format .CSV, .TXT, atau .TSV (Maks. 5 MB)
                    </p>
                    <div className="mt-4 px-3 py-1 rounded-full bg-slate-200/60 text-slate-700 text-[11px] font-medium">
                      Excel: Simpan lembar kerja sebagai "CSV (Comma delimited)"
                    </div>
                  </label>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pasteArea" className="text-xs font-semibold text-slate-700">
                      Tempel Data Tabel CSV
                    </Label>
                    <span className="text-[11px] text-slate-400">
                      Pastikan baris pertama berisi judul kolom
                    </span>
                  </div>
                  <Textarea
                    id="pasteArea"
                    rows={8}
                    placeholder={`Nama Lengkap, No WhatsApp, Email, No KTP\nBudi Santoso, 081234567890, budi@mail.com, 3201010101\nSiti Aminah, 085712345678, siti@mail.com, 3201010202`}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="font-mono text-xs rounded-xl"
                  />
                  <Button
                    onClick={() => processContent(rawText, "Clipboard Data")}
                    disabled={!rawText.trim()}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold h-9"
                  >
                    Lanjutkan ke Pemetaan Kolom
                    <ArrowRight className="size-3.5 ml-1.5" />
                  </Button>
                </div>
              )}

              {/* Informational Guidelines */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs text-blue-900 space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5 text-blue-950">
                  <HelpCircle className="size-3.5 text-blue-600" />
                  Panduan Impor Cepat:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-blue-800">
                  <li>Kolom <strong>Nama</strong> dan <strong>Nomor WhatsApp</strong> wajib terisi pada setiap baris data.</li>
                  <li>Nomor HP akan otomatis dinormalisasi ke format standar Indonesia (+62/08).</li>
                  <li>Sistem akan mendeteksi dan mencegah nomor HP duplikat yang sudah terdaftar di organisasi ini.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 2: COLUMN MAPPING ──────────────── */}
          {step === "mapping" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="font-semibold text-slate-800">Berkas: </span>
                  <span className="text-slate-600 font-mono">{fileName}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Total Baris Data: </span>
                  <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
                    {parsedRows.length} baris
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Cocokkan kolom pada berkas Anda dengan kolom sistem Kontrakin:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Nama Field */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5 shadow-xs">
                    <Label className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                      Nama Lengkap <span className="text-rose-600">*</span>
                    </Label>
                    <select
                      value={mapping.nama}
                      onChange={(e) => setMapping((prev) => ({ ...prev, nama: e.target.value }))}
                      className="w-full text-xs h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 font-medium"
                    >
                      <option value="">-- Pilih Kolom --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400">Wajib diisi</p>
                  </div>

                  {/* No HP Field */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5 shadow-xs">
                    <Label className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                      Nomor WhatsApp / HP <span className="text-rose-600">*</span>
                    </Label>
                    <select
                      value={mapping.noHp}
                      onChange={(e) => setMapping((prev) => ({ ...prev, noHp: e.target.value }))}
                      className="w-full text-xs h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 font-medium"
                    >
                      <option value="">-- Pilih Kolom --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400">Wajib diisi (9-15 digit)</p>
                  </div>

                  {/* Email Field */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5 shadow-xs">
                    <Label className="text-xs font-semibold text-slate-700">
                      Alamat Email (Opsional)
                    </Label>
                    <select
                      value={mapping.email}
                      onChange={(e) => setMapping((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full text-xs h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 font-medium"
                    >
                      <option value="">-- Lewati / Tidak Ada --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* No KTP Field */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5 shadow-xs">
                    <Label className="text-xs font-semibold text-slate-700">
                      Nomor KTP / NIK (Opsional)
                    </Label>
                    <select
                      value={mapping.noKtp}
                      onChange={(e) => setMapping((prev) => ({ ...prev, noKtp: e.target.value }))}
                      className="w-full text-xs h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 font-medium"
                    >
                      <option value="">-- Lewati / Tidak Ada --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tanggal Masuk Field */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5 shadow-xs">
                    <Label className="text-xs font-semibold text-slate-700">
                      Tanggal Masuk (Opsional)
                    </Label>
                    <select
                      value={mapping.tanggalMasuk}
                      onChange={(e) => setMapping((prev) => ({ ...prev, tanggalMasuk: e.target.value }))}
                      className="w-full text-xs h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 font-medium"
                    >
                      <option value="">-- Gunakan Tanggal Hari Ini --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Catatan Field */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5 shadow-xs">
                    <Label className="text-xs font-semibold text-slate-700">
                      Catatan Tambahan (Opsional)
                    </Label>
                    <select
                      value={mapping.catatan}
                      onChange={(e) => setMapping((prev) => ({ ...prev, catatan: e.target.value }))}
                      className="w-full text-xs h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 font-medium"
                    >
                      <option value="">-- Lewati / Tidak Ada --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 3: PREVIEW & VALIDATION ──────────────── */}
          {step === "preview" && (
            <div className="space-y-4">
              {/* Summary Badges & Filter */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-800">
                    Hasil Validasi:
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="size-3" />
                    {validCount} Siap Diimpor
                  </span>
                  {errorCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      {errorCount} Bermasalah
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewFilter("all")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      previewFilter === "all"
                        ? "bg-slate-800 text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Semua ({previewItems.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter("valid")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      previewFilter === "valid"
                        ? "bg-emerald-600 text-white"
                        : "bg-white text-emerald-700 border border-slate-200 hover:bg-emerald-50"
                    }`}
                  >
                    Valid Saja ({validCount})
                  </button>
                  {errorCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreviewFilter("error")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        previewFilter === "error"
                          ? "bg-rose-600 text-white"
                          : "bg-white text-rose-700 border border-slate-200 hover:bg-rose-50"
                      }`}
                    >
                      Error Saja ({errorCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Preview Table */}
              <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 w-16">Baris</th>
                      <th className="px-3 py-2 w-28">Status</th>
                      <th className="px-3 py-2">Nama</th>
                      <th className="px-3 py-2">No. WhatsApp/HP</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Keterangan / Masalah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPreview.map((item) => (
                      <tr
                        key={item.rowNumber}
                        className={item.valid ? "hover:bg-slate-50" : "bg-rose-50/40 hover:bg-rose-50/60"}
                      >
                        <td className="px-3 py-2 font-mono text-slate-500 text-[11px]">
                          #{item.rowNumber}
                        </td>
                        <td className="px-3 py-2">
                          {item.valid ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 text-[11px]">
                              <CheckCircle2 className="size-3" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-rose-700 text-[11px]">
                              <AlertCircle className="size-3" /> Bermasalah
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {item.data.nama || <span className="text-slate-400 italic">Kosong</span>}
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-700">
                          {item.data.noHp || <span className="text-slate-400 italic">Kosong</span>}
                        </td>
                        <td className="px-3 py-2 text-slate-600 text-[11px]">
                          {item.data.email || "-"}
                        </td>
                        <td className="px-3 py-2 text-[11px]">
                          {item.valid ? (
                            <span className="text-emerald-700">Siap diimpor</span>
                          ) : (
                            <span className="text-rose-700 font-medium">{item.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 4: RESULT ──────────────── */}
          {step === "result" && importResult && (
            <div className="space-y-4 py-2">
              <div className="text-center p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="size-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="size-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Proses Impor Selesai
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  {importResult.importedCount} penyewa berhasil ditambahkan ke database organisasi Anda.
                  {importResult.failedCount > 0 &&
                    ` Sebanyak ${importResult.failedCount} baris dilewati karena duplikasi atau ketidaklengkapan data.`}
                </p>
              </div>

              {/* Metric Breakdown */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                  <p className="text-[11px] text-slate-500 font-medium">Total Diproses</p>
                  <p className="text-lg font-bold text-slate-900">{importResult.totalProcessed}</p>
                </div>
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 text-center">
                  <p className="text-[11px] text-emerald-700 font-medium">Berhasil Diimpor</p>
                  <p className="text-lg font-bold text-emerald-700">{importResult.importedCount}</p>
                </div>
                <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-200 text-center">
                  <p className="text-[11px] text-rose-700 font-medium">Dilewati / Gagal</p>
                  <p className="text-lg font-bold text-rose-700">{importResult.failedCount}</p>
                </div>
              </div>

              {/* Download Failed Rows Button if errors exist */}
              {importResult.errors.length > 0 && (
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                      <AlertCircle className="size-4 text-rose-600" />
                      Terdapat {importResult.errors.length} Baris Data Bermasalah
                    </p>
                    <p className="text-[11px] text-rose-800">
                      Unduh daftar baris gagal beserta alasan errornya untuk langsung diperbaiki dan diunggah kembali.
                    </p>
                  </div>
                  <Button
                    onClick={handleDownloadFailedRows}
                    size="sm"
                    className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shrink-0 gap-1.5"
                  >
                    <Download className="size-3.5" />
                    Unduh Baris Gagal (CSV)
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ──────────────── STEP 5: IMPORT HISTORY ──────────────── */}
          {step === "history" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-800">
                  Riwayat 10 Batch Impor Terakhir Organisasi
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadHistory}
                  disabled={loadingHistory}
                  className="text-xs h-7 gap-1 text-slate-600"
                >
                  <RefreshCw className={`size-3 ${loadingHistory ? "animate-spin" : ""}`} />
                  Segarkan
                </Button>
              </div>

              {loadingHistory ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Memuat riwayat impor...
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl space-y-1">
                  <Clock className="size-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">Belum Ada Riwayat Impor</p>
                  <p className="text-[11px] text-slate-400">
                    Setiap batch impor yang dilakukan akan dicatat dalam audit log organisasi.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historyList.map((h) => (
                    <div
                      key={h.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:border-teal-200 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <FileText className="size-3.5 text-teal-600" />
                          {h.fileName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Oleh {h.actorName} ({h.actorEmail}) • {new Date(h.createdAt).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-700">
                          +{h.importedCount} berhasil
                        </span>
                        {h.failedCount > 0 && (
                          <span className="text-[11px] text-rose-600 block">
                            {h.failedCount} dilewati
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          {step === "upload" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="rounded-xl border-slate-200 text-xs text-slate-600"
              >
                Batal
              </Button>
              <div />
            </>
          )}

          {step === "mapping" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("upload")}
                className="rounded-xl border-slate-200 text-xs text-slate-600 gap-1.5"
              >
                <ArrowLeft className="size-3.5" />
                Kembali
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (!mapping.nama || !mapping.noHp) {
                    toast.error("Kolom Nama Lengkap dan Nomor WhatsApp wajib dipilih");
                    return;
                  }
                  setStep("preview");
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold gap-1.5"
              >
                Lanjutkan ke Pratinjau
                <ArrowRight className="size-3.5" />
              </Button>
            </>
          )}

          {step === "preview" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("mapping")}
                disabled={isSubmitting}
                className="rounded-xl border-slate-200 text-xs text-slate-600 gap-1.5"
              >
                <ArrowLeft className="size-3.5" />
                Ubah Pemetaan
              </Button>
              <Button
                size="sm"
                onClick={handleExecuteImport}
                disabled={isSubmitting || validCount === 0}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    Mengimpor {validCount} Penyewa...
                  </>
                ) : (
                  <>
                    <Upload className="size-3.5" />
                    Impor {validCount} Penyewa Valid
                  </>
                )}
              </Button>
            </>
          )}

          {step === "result" && (
            <div className="w-full flex justify-end">
              <Button
                size="sm"
                onClick={handleClose}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold px-5"
              >
                Selesai
              </Button>
            </div>
          )}

          {step === "history" && (
            <div className="w-full flex justify-end">
              <Button
                size="sm"
                onClick={() => setStep("upload")}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold px-4"
              >
                Tutup Riwayat
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
