"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Pencil,
  Plus,
  Search,
  Trash2,
  UserX,
  MoreVertical,
  Users,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Building2,
  ArrowRightLeft,
  Eye,
  AlertTriangle,
  Receipt,
  UserCheck,
  Send,
  KeyRound,
  ShieldAlert,
  Sparkles,
  Clock,
} from "lucide-react";

import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DestructiveDialog } from "@/components/ui/destructive-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DataTablePagination,
  ColumnVisibilityToggle,
  BulkActionBar,
} from "@/components/ui/data-table-controls";
import { Copy, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { normalizeIndonesianPhone } from "@/lib/communication/provider";
import { exportToCSV } from "@/lib/utils/export-csv";
import { TenantImportModal } from "@/components/import/TenantImportModal";
import {
  FormField,
  PhoneInput,
  SubmitButton,
  UnsavedChangesDialog,
} from "@/components/form/form-controls";

import {
  createPenghuni,
  updatePenghuni,
  deletePenghuni,
  nonaktifkanPenghuni,
  pindahKamarPenghuni,
  getPenghuniList,
  getAvailableKamarOptions,
  sendTenantPortalAccessAction,
  resendTenantPortalAccessAction,
  disableTenantPortalAccessAction,
  type PenghuniInput,
  type ImportPenghuniRow,
} from "./action";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PenghuniDenganDetail = Awaited<ReturnType<typeof getPenghuniList>>[number];
export type AvailableKamarOption = Awaited<ReturnType<typeof getAvailableKamarOptions>>[number];

interface FormState {
  nama: string;
  noHp: string;
  email: string;
  noKtp: string;
  tanggalMasuk: string;
  catatan: string;
}

interface FormErrors {
  nama?: string;
  noHp?: string;
  tanggalMasuk?: string;
}

const FORM_KOSONG: FormState = {
  nama: "",
  noHp: "",
  email: "",
  noKtp: "",
  tanggalMasuk: new Date().toISOString().slice(0, 10),
  catatan: "",
};

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface PenghuniClientProps {
  initialPenghuni: PenghuniDenganDetail[];
  availableKamar?: AvailableKamarOption[];
}

export function PenghuniClient({
  initialPenghuni,
  availableKamar = [],
}: PenghuniClientProps) {
  const [list, setList] = useState<PenghuniDenganDetail[]>(initialPenghuni);
  const [vacantRooms, setVacantRooms] = useState<AvailableKamarOption[]>(availableKamar);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "semua" | "menghuni" | "belum_ditempatkan" | "tunggakan" | "nonaktif"
  >("semua");
  const [isPending, startTransition] = useTransition();

  // Create / Edit Form
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(FORM_KOSONG);
  const [errors, setErrors] = useState<FormErrors>({});

  // Form UX: Dirty State & Unsaved Changes Guard (Batch 20)
  const [initialFormSnapshot, setInitialFormSnapshot] = useState<string>(JSON.stringify(FORM_KOSONG));
  const [dirtyConfirmOpen, setDirtyConfirmOpen] = useState(false);

  const isDirty = useMemo(() => {
    return JSON.stringify(form) !== initialFormSnapshot;
  }, [form, initialFormSnapshot]);

  function handleRequestClose() {
    if (isDirty) {
      setDirtyConfirmOpen(true);
    } else {
      setFormOpen(false);
    }
  }

  // 360 Profile Drawer / Modal
  const [selectedTenant360, setSelectedTenant360] = useState<PenghuniDenganDetail | null>(null);

  // Move Room Modal
  const [moveTarget, setMoveTarget] = useState<PenghuniDenganDetail | null>(null);
  const [targetRoomId, setTargetRoomId] = useState<string>("none");
  const [isMoving, setIsMoving] = useState(false);

  // Destructive Actions
  const [deleteTarget, setDeleteTarget] = useState<PenghuniDenganDetail | null>(null);
  const [nonaktifTarget, setNonaktifTarget] = useState<PenghuniDenganDetail | null>(null);

  // Tenant Portal Access Management
  const [isPortalActionPending, setIsPortalActionPending] = useState(false);
  const [disablePortalTarget, setDisablePortalTarget] = useState<PenghuniDenganDetail | null>(null);
  const [whatsappModalData, setWhatsappModalData] = useState<{
    tenantName: string;
    phone: string;
    directUrl: string;
  } | null>(null);

  // CSV / Spreadsheet Import Modal state
  const [importOpen, setImportOpen] = useState(false);

  // ─── Analytics / KPIs ────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = list.length;
    const menghuni = list.filter((p) => p.kamar !== null && p.status === "aktif").length;
    const belumDitempatkan = list.filter((p) => p.kamar === null && p.status === "aktif").length;
    const nonaktif = list.filter((p) => p.status === "nonaktif").length;

    let tunggakanCount = 0;
    let totalNominalTunggakan = 0;

    list.forEach((p) => {
      const unpaid = (p.invoices ?? []).reduce(
        (sum, inv) => sum + Number(inv.balanceDue ?? 0),
        0
      );
      if (unpaid > 0) {
        tunggakanCount++;
        totalNominalTunggakan += unpaid;
      }
    });

    return { total, menghuni, belumDitempatkan, nonaktif, tunggakanCount, totalNominalTunggakan };
  }, [list]);

  // ─── Portal Access Handlers ────────────────────────────────────────────────
  async function handleSendPortalAccess(t: PenghuniDenganDetail) {
    setIsPortalActionPending(true);

    try {
      console.log("[PortalAccess] Mengirim permintaan akses portal untuk:", {
        id: t.id,
        nama: t.nama,
        noHp: t.noHp,
        origin: window.location.origin,
      });

      const res = await sendTenantPortalAccessAction(t.id, window.location.origin);
      console.log("[PortalAccess] Response dari server:", res);

      if (res?.directUrl) {
        console.log("[PortalAccess] directUrl berhasil didapatkan:", res.directUrl);

        // Tampilkan modal dialog WhatsApp
        setWhatsappModalData({
          tenantName: t.nama,
          phone: t.noHp,
          directUrl: res.directUrl,
        });

        // Buka langsung ke URL WhatsApp jika diizinkan browser
        try {
          window.open(res.directUrl, "_blank", "noopener,noreferrer");
        } catch (e) {
          console.warn("[PortalAccess] window.open diblokir popup blocker:", e);
        }

        toast.success("Tautan akses WhatsApp berhasil disiapkan!");
      } else {
        toast.success("Akses Tenant Portal berhasil diproses!");
      }

      setList((prev) =>
        prev.map((item) =>
          item.id === t.id ? { ...item, portalAccessStatus: "INVITE_SENT" } : item
        )
      );
      if (selectedTenant360?.id === t.id) {
        setSelectedTenant360((prev) =>
          prev ? { ...prev, portalAccessStatus: "INVITE_SENT" } : null
        );
      }
    } catch (err: any) {
      console.error("[PortalAccess] Gagal mengirim akses portal:", err);
      toast.error(err.message || "Gagal mengirim akses portal");
    } finally {
      setIsPortalActionPending(false);
    }
  }

  async function handleResendPortalAccess(t: PenghuniDenganDetail) {
    setIsPortalActionPending(true);

    try {
      console.log("[PortalAccess] Mengirim ulang akses portal untuk:", {
        id: t.id,
        nama: t.nama,
        noHp: t.noHp,
      });

      const res = await resendTenantPortalAccessAction(t.id, window.location.origin);
      console.log("[PortalAccess] Response kirim ulang dari server:", res);

      if (res?.directUrl) {
        console.log("[PortalAccess] Mengarahkan ke directUrl:", res.directUrl);

        setWhatsappModalData({
          tenantName: t.nama,
          phone: t.noHp,
          directUrl: res.directUrl,
        });

        try {
          window.open(res.directUrl, "_blank", "noopener,noreferrer");
        } catch (e) {
          console.warn("[PortalAccess] window.open diblokir:", e);
        }

        toast.success("Tautan akses WhatsApp baru telah disiapkan!");
      } else {
        toast.success("Tautan akses baru berhasil diproses!");
      }

      setList((prev) =>
        prev.map((item) =>
          item.id === t.id ? { ...item, portalAccessStatus: "INVITE_SENT" } : item
        )
      );
      if (selectedTenant360?.id === t.id) {
        setSelectedTenant360((prev) =>
          prev ? { ...prev, portalAccessStatus: "INVITE_SENT" } : null
        );
      }
    } catch (err: any) {
      console.error("[PortalAccess] Gagal mengirim ulang akses portal:", err);
      toast.error(err.message || "Gagal mengirim ulang akses portal");
    } finally {
      setIsPortalActionPending(false);
    }
  }

  async function handleConfirmDisablePortal() {
    if (!disablePortalTarget) return;
    setIsPortalActionPending(true);
    try {
      await disableTenantPortalAccessAction(disablePortalTarget.id);
      toast.success("Akses Tenant Portal berhasil dinonaktifkan.");
      setList((prev) =>
        prev.map((item) =>
          item.id === disablePortalTarget.id
            ? { ...item, portalAccessStatus: "DISABLED" }
            : item
        )
      );
      if (selectedTenant360?.id === disablePortalTarget.id) {
        setSelectedTenant360((prev) =>
          prev ? { ...prev, portalAccessStatus: "DISABLED" } : null
        );
      }
      setDisablePortalTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Gagal menonaktifkan akses portal");
    } finally {
      setIsPortalActionPending(false);
    }
  }

  // ─── Filtered List ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const kata = search.trim().toLowerCase();

    return list.filter((p) => {
      // 1. Text Search: nama, noHp, noKtp, kamar, properti
      if (kata) {
        const matchNama = p.nama.toLowerCase().includes(kata);
        const matchHp = p.noHp.includes(kata);
        const matchKtp = p.noKtp?.toLowerCase().includes(kata);
        const matchKamar = p.kamar?.nomor.toLowerCase().includes(kata);
        const matchProperti = p.kamar?.properti?.nama.toLowerCase().includes(kata);
        if (!matchNama && !matchHp && !matchKtp && !matchKamar && !matchProperti) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter === "menghuni") {
        return p.kamar !== null && p.status === "aktif";
      }
      if (statusFilter === "belum_ditempatkan") {
        return p.kamar === null && p.status === "aktif";
      }
      if (statusFilter === "nonaktif") {
        return p.status === "nonaktif";
      }
      if (statusFilter === "tunggakan") {
        const unpaid = (p.invoices ?? []).reduce(
          (sum, inv) => sum + Number(inv.balanceDue ?? 0),
          0
        );
        return unpaid > 0;
      }

      return true;
    }).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [list, search, statusFilter]);

  // ─── Table Usability & Responsive Data Views (Batch 19) ──────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState({
    wa: true,
    kamar: true,
    status: true,
    tunggakan: true,
  });

  // Reset to page 1 whenever filter or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // Paginated slice
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const allPageSelected =
    paginatedList.length > 0 && paginatedList.every((p) => selectedIds.has(p.id));

  function handleToggleSelectAll() {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedList.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedList.forEach((p) => next.add(p.id));
        return next;
      });
    }
  }

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSelectAllFiltered() {
    setSelectedIds(new Set(filtered.map((p) => p.id)));
  }

  function handleExportSelected() {
    const selectedData = list.filter((p) => selectedIds.has(p.id));
    if (selectedData.length === 0) return;
    const headers = [
      "Nama Lengkap",
      "Nomor WhatsApp",
      "Email",
      "Nomor KTP",
      "Unit Kamar",
      "Properti",
      "Status",
      "Tunggakan (Rp)",
    ];
    const rows = selectedData.map((p) => {
      const unpaid = (p.invoices ?? []).reduce(
        (sum, inv) => sum + Number(inv.balanceDue ?? 0),
        0
      );
      return [
        p.nama,
        p.noHp,
        p.email || "",
        p.noKtp || "",
        p.kamar ? `Kamar ${p.kamar.nomor}` : "Belum Ditempatkan",
        p.kamar?.properti?.nama || "-",
        p.status,
        unpaid,
      ];
    });
    exportToCSV(`penyewa_terpilih_${selectedData.length}`, headers, rows);
    toast.success(`${selectedData.length} penyewa terpilih berhasil diekspor`);
  }

  function handleCopySelectedPhones() {
    const selectedData = list.filter((p) => selectedIds.has(p.id));
    const phones = selectedData.map((p) => p.noHp).filter(Boolean).join(", ");
    if (!phones) {
      toast.error("Tidak ada nomor kontak yang dapat disalin");
      return;
    }
    navigator.clipboard.writeText(phones);
    toast.success(`${selectedData.length} nomor WhatsApp berhasil disalin ke clipboard`);
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function handleExportCSV() {
    const headers = [
      "Nama",
      "No. HP",
      "No. KTP",
      "Tanggal Masuk",
      "Status",
      "Properti",
      "Kamar",
      "Sisa Tunggakan",
    ];
    const rows = filtered.map((p) => {
      const unpaid = (p.invoices ?? []).reduce(
        (sum, inv) => sum + Number(inv.balanceDue ?? 0),
        0
      );
      return [
        p.nama,
        p.noHp.startsWith("62") ? `+${p.noHp}` : p.noHp,
        p.noKtp || "-",
        p.tanggalMasuk.toISOString().slice(0, 10),
        p.status,
        p.kamar?.properti?.nama || "-",
        p.kamar?.nomor || "Belum ditempatkan",
        unpaid > 0 ? unpaid : 0,
      ];
    });
    exportToCSV("daftar_penyewa_lengkap", headers, rows);
    toast.success("Daftar penyewa berhasil diekspor ke CSV");
  }

  function handleImportSuccess(created: any[]) {
    if (!created || created.length === 0) return;
    setList((prev) => [
      ...prev,
      ...created.map((c) => ({
        ...c,
        kamar: null,
        leases: [],
        invoices: [],
        pemeliharaan: [],
      })),
    ]);
  }

  function bukaTambah() {
    setEditingId(null);
    setForm(FORM_KOSONG);
    setInitialFormSnapshot(JSON.stringify(FORM_KOSONG));
    setErrors({});
    setFormOpen(true);
  }

  function bukaEdit(p: PenghuniDenganDetail) {
    setEditingId(p.id);
    const editForm: FormState = {
      nama: p.nama,
      noHp: p.noHp,
      email: p.email ?? "",
      noKtp: p.noKtp ?? "",
      tanggalMasuk: p.tanggalMasuk.toISOString().slice(0, 10),
      catatan: p.catatan ?? "",
    };
    setForm(editForm);
    setInitialFormSnapshot(JSON.stringify(editForm));
    setErrors({});
    setFormOpen(true);
  }

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!form.nama.trim()) errs.nama = "Nama wajib diisi";
    if (!form.noHp.trim()) errs.noHp = "No. HP wajib diisi";
    const digits = form.noHp.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 15) {
      errs.noHp = "Nomor HP harus 9-15 digit angka";
    }
    if (!form.tanggalMasuk) errs.tanggalMasuk = "Tanggal masuk wajib diisi";
    return errs;
  }

  function simpanPenghuni() {
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) {
      toast.error("Lengkapi dulu field yang wajib diisi");
      return;
    }

    const payload: PenghuniInput = {
      nama: form.nama.trim(),
      noHp: normalizeIndonesianPhone(form.noHp),
      email: form.email.trim() || undefined,
      noKtp: form.noKtp.trim() || undefined,
      tanggalMasuk: form.tanggalMasuk,
      catatan: form.catatan.trim() || undefined,
    };

    startTransition(async () => {
      try {
        if (editingId) {
          const updated = await updatePenghuni(editingId, payload);
          setList((prev) =>
            prev.map((p) => (p.id === editingId ? { ...p, ...updated } : p))
          );
          toast.success(`Data ${payload.nama} berhasil diperbarui`);
        } else {
          const created = await createPenghuni(payload);
          setList((prev) => [
            ...prev,
            {
              ...created,
              kamar: null,
              leases: [],
              invoices: [],
              pemeliharaan: [],
              activationTokens: [],
            },
          ]);
          toast.success(`${payload.nama} berhasil didaftarkan`);
        }
        setFormOpen(false);
      } catch {
        toast.error("Gagal menyimpan data. Cek kembali No. KTP (harus unik) jika diisi.");
      }
    });
  }

  function konfirmasiNonaktifkan() {
    if (!nonaktifTarget) return;
    const target = nonaktifTarget;
    startTransition(async () => {
      try {
        await nonaktifkanPenghuni(target.id);
        setList((prev) =>
          prev.map((p) =>
            p.id === target.id
              ? { ...p, status: "nonaktif", kamarId: null, kamar: null }
              : p
          )
        );
        toast.success(`${target.nama} ditandai keluar dari kamar`);
      } catch {
        toast.error("Gagal memproses");
      } finally {
        setNonaktifTarget(null);
      }
    });
  }

  function konfirmasiHapus() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      try {
        await deletePenghuni(target.id);
        setList((prev) => prev.filter((p) => p.id !== target.id));
        toast.success(`${target.nama} berhasil dihapus`);
      } catch {
        toast.error("Gagal menghapus data");
      } finally {
        setDeleteTarget(null);
      }
    });
  }

  async function handlePindahKamar() {
    if (!moveTarget) return;
    setIsMoving(true);
    const newRoomId = targetRoomId === "none" ? null : targetRoomId;

    try {
      await pindahKamarPenghuni(moveTarget.id, newRoomId);

      // Cari data kamar baru
      const targetRoom = vacantRooms.find((r) => r.id === newRoomId);

      // Update list
      setList((prev) =>
        prev.map((p) => {
          if (p.id === moveTarget.id) {
            return {
              ...p,
              kamarId: newRoomId,
              kamar: targetRoom ? { ...targetRoom } : null,
            };
          }
          return p;
        })
      );

      // Update available rooms
      if (newRoomId) {
        setVacantRooms((prev) => prev.filter((r) => r.id !== newRoomId));
      }
      if (moveTarget.kamar) {
        setVacantRooms((prev) => [
          ...prev,
          {
            ...moveTarget.kamar!,
            status: "kosong" as const,
          },
        ]);
      }

      toast.success(
        newRoomId
          ? `${moveTarget.nama} berhasil dipindahkan ke Kamar ${targetRoom?.nomor ?? ""}`
          : `${moveTarget.nama} berhasil dilepaskan dari penempatan kamar`
      );
      setMoveTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Gagal memindahkan kamar");
    } finally {
      setIsMoving(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Penyewa
          </h1>
          <p className="text-sm text-slate-500">
            Pusat operasional data penghuni, kontrak aktif, monitoring tunggakan, dan komunikasi WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="mr-1.5 size-3.5" />
            Ekspor CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Upload className="mr-1.5 size-3.5" />
            Impor CSV / Excel
          </Button>
          <Button
            onClick={bukaTambah}
            disabled={isPending}
            className="rounded-xl bg-teal-600 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 active:scale-[0.98]"
          >
            <Plus className="mr-1.5 size-3.5" />
            Daftarkan Penyewa
          </Button>
        </div>
      </div>

      {/* ── Operational KPI Cards ──────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Penyewa */}
        <div
          onClick={() => setStatusFilter("semua")}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            statusFilter === "semua"
              ? "border-teal-500 bg-teal-50/40 ring-1 ring-teal-400"
              : "border-slate-100 bg-white hover:border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Total Penyewa</span>
            <Users className="size-4 text-teal-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{stats.total}</p>
          <p className="mt-1 text-xs text-slate-400">Terdaftar di portofolio</p>
        </div>

        {/* Aktif Menghuni */}
        <div
          onClick={() => setStatusFilter("menghuni")}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            statusFilter === "menghuni"
              ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-400"
              : "border-slate-100 bg-white hover:border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Aktif Menghuni</span>
            <Building2 className="size-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-emerald-700">{stats.menghuni}</p>
          <p className="mt-1 text-xs text-slate-400">Ditempatkan di unit kamar</p>
        </div>

        {/* Belum Ditempatkan */}
        <div
          onClick={() => setStatusFilter("belum_ditempatkan")}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            statusFilter === "belum_ditempatkan"
              ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-400"
              : "border-slate-100 bg-white hover:border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Belum Ditempatkan</span>
            <UserCheck className="size-4 text-amber-500" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-amber-600">{stats.belumDitempatkan}</p>
          <p className="mt-1 text-xs text-slate-400">Perlu penempatan kamar</p>
        </div>

        {/* Menunggak Tagihan */}
        <div
          onClick={() => setStatusFilter("tunggakan")}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            statusFilter === "tunggakan"
              ? "border-rose-500 bg-rose-50/40 ring-1 ring-rose-400"
              : "border-slate-100 bg-white hover:border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Menunggak</span>
            <AlertTriangle className="size-4 text-rose-500" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-rose-600">{stats.tunggakanCount}</p>
          <p className="mt-1 text-xs font-medium text-rose-600">
            {stats.totalNominalTunggakan > 0
              ? formatRupiah(stats.totalNominalTunggakan)
              : "Tidak ada tunggakan"}
          </p>
        </div>
      </div>

      {/* ── Search, Column Toggle & Filter Pills ─────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari nama, no. HP, kamar, KTP..."
              className="pl-9 rounded-xl border-slate-200 bg-slate-50/50 text-xs focus:bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Column Visibility Selector */}
          <ColumnVisibilityToggle
            columns={[
              { key: "wa", label: "Kontak WhatsApp", visible: visibleColumns.wa },
              { key: "kamar", label: "Unit & Properti", visible: visibleColumns.kamar },
              { key: "status", label: "Status Sewa", visible: visibleColumns.status },
              { key: "tunggakan", label: "Status Tunggakan", visible: visibleColumns.tunggakan },
            ]}
            onToggle={(key) =>
              setVisibleColumns((prev: any) => ({ ...prev, [key]: !prev[key] }))
            }
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1">
          {[
            { id: "semua", label: `Semua (${stats.total})` },
            { id: "menghuni", label: `Menghuni (${stats.menghuni})` },
            { id: "belum_ditempatkan", label: `Belum Ditempatkan (${stats.belumDitempatkan})` },
            { id: "tunggakan", label: `Menunggak (${stats.tunggakanCount})` },
            { id: "nonaktif", label: `Nonaktif (${stats.nonaktif})` },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id as any)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                statusFilter === pill.id
                  ? "bg-white text-teal-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Floating / Sticky Bulk Action Bar ──────────────────────── */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        totalFilteredCount={filtered.length}
        onClearSelection={() => setSelectedIds(new Set())}
        onSelectAllFiltered={handleSelectAllFiltered}
        itemLabel="penyewa"
        actions={[
          {
            label: "Ekspor Terpilih (CSV)",
            icon: <Download className="size-3.5" />,
            onClick: handleExportSelected,
            variant: "default",
          },
          {
            label: "Salin No WhatsApp",
            icon: <Copy className="size-3.5" />,
            onClick: handleCopySelectedPhones,
            variant: "outline",
          },
        ]}
      />

      {/* ── Table Card (Desktop Table + Mobile Cards) ─────────────── */}
      <Card className="rounded-2xl border-slate-200/80 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {/* 1. Mobile Alternative: Touch-Friendly Stacked Cards (< md) */}
          <div className="md:hidden divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
                  <Users className="size-6" />
                </div>
                {list.length === 0 ? (
                  <>
                    <p className="text-sm font-bold text-slate-800">Belum ada penyewa</p>
                    <p className="text-xs text-slate-500 mt-1 mb-4">Tambahkan penyewa untuk memulai kelola sewa</p>
                    <Button size="sm" onClick={bukaTambah} className="bg-teal-600 text-white rounded-xl text-xs">
                      <Plus className="mr-1.5 size-3.5" /> Tambah Penyewa
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-slate-800">Tidak ada penyewa yang cocok</p>
                    <p className="text-xs text-slate-500 mt-1 mb-4">Ubah kata kunci pencarian atau reset filter</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSearch("");
                        setStatusFilter("semua");
                      }}
                      className="rounded-xl border-slate-200 text-xs"
                    >
                      Reset Filter
                    </Button>
                  </>
                )}
              </div>
            ) : (
              paginatedList.map((p) => {
                const unpaid = (p.invoices ?? []).reduce(
                  (sum, inv) => sum + Number(inv.balanceDue ?? 0),
                  0
                );
                const initials = p.nama
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                const waMessage = `Halo ${p.nama}, salam dari pengelola ${p.kamar?.properti?.nama ?? "kost"}.`;
                const waUrl = `https://wa.me/${p.noHp}?text=${encodeURIComponent(waMessage)}`;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedTenant360(p)}
                    className={`p-4 space-y-3 cursor-pointer transition-colors ${
                      selectedIds.has(p.id) ? "bg-teal-50/50" : "hover:bg-slate-50/80 active:bg-slate-100/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(p.id)}
                            onCheckedChange={() => handleToggleSelect(p.id)}
                            aria-label={`Pilih ${p.nama}`}
                          />
                        </div>
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-800 font-bold text-xs">
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{p.nama}</p>
                          <p className="text-[11px] text-slate-500">
                            {p.kamar ? `Kamar ${p.kamar.nomor} • ${p.kamar.properti?.nama ?? "Kost"}` : "Belum Ditempatkan"}
                          </p>
                        </div>
                      </div>

                      <StatusBadge variant={p.status === "aktif" ? "emerald" : "slate"} dot>
                        {p.status === "aktif" ? "Aktif" : "Nonaktif"}
                      </StatusBadge>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100/80">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                      >
                        <MessageSquare className="size-3 text-emerald-600" />
                        <span>{p.noHp}</span>
                      </a>

                      <div>
                        {unpaid > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                            <AlertCircle className="size-3 text-rose-600" />
                            {formatRupiah(unpaid)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="size-3 text-emerald-600" /> Lunas
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTenant360(p);
                        }}
                        className="h-7 text-[11px] rounded-lg border-slate-200 text-slate-700"
                      >
                        <Eye className="mr-1 size-3 text-slate-500" />
                        Profil 360°
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMoveTarget(p);
                          setTargetRoomId(p.kamarId ?? "none");
                        }}
                        className="h-7 text-[11px] rounded-lg border-slate-200 text-slate-700"
                      >
                        <ArrowRightLeft className="mr-1 size-3 text-slate-500" />
                        Pindah
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 2. Desktop Structured Data Table (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200">
                <TableRow>
                  <TableHead className="w-12 px-4 py-3">
                    <Checkbox
                      checked={allPageSelected}
                      onCheckedChange={handleToggleSelectAll}
                      aria-label="Pilih semua pada halaman ini"
                    />
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold text-slate-600">Penyewa</TableHead>
                  {visibleColumns.wa && (
                    <TableHead className="px-5 py-3 text-xs font-bold text-slate-600">Kontak WhatsApp</TableHead>
                  )}
                  {visibleColumns.kamar && (
                    <TableHead className="px-5 py-3 text-xs font-bold text-slate-600">Unit &amp; Properti</TableHead>
                  )}
                  {visibleColumns.status && (
                    <TableHead className="px-5 py-3 text-xs font-bold text-slate-600">Status Sewa</TableHead>
                  )}
                  {visibleColumns.tunggakan && (
                    <TableHead className="px-5 py-3 text-xs font-bold text-slate-600">Tunggakan</TableHead>
                  )}
                  <TableHead className="px-5 py-3 text-xs font-bold text-slate-600 text-right">Aksi Operasional</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center">
                      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <Users className="size-6" />
                      </div>
                      {list.length === 0 ? (
                        <>
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 mb-2">
                            <span>Langkah 3 dari 5 Setup Portofolio</span>
                          </div>
                          <p className="mt-1 text-base font-semibold text-slate-800">
                            Belum ada data penyewa
                          </p>
                          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                            Daftarkan penyewa kamar Anda untuk memudahkan pencatatan kontrak sewa resmi, tagihan berkala, dan notifikasi pengingat via WhatsApp.
                          </p>
                          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                            <Button
                              size="sm"
                              onClick={bukaTambah}
                              className="rounded-xl bg-teal-600 text-xs font-semibold text-white shadow-sm hover:bg-teal-700"
                            >
                              <Plus className="mr-1.5 size-3.5" />
                              Tambah Penyewa Pertama
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setImportOpen(true)}
                              className="rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <Upload className="mr-1.5 size-3.5" />
                              Impor Excel / CSV
                            </Button>
                            <Link
                              href="/dashboard/owner"
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                            >
                              Panduan Setup
                            </Link>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="mt-3 text-base font-semibold text-slate-800">
                            Tidak ada penyewa yang cocok
                          </p>
                          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                            Tidak ada data penyewa yang sesuai dengan filter atau kata kunci &quot;{search}&quot;.
                          </p>
                          <div className="mt-4 flex items-center justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSearch("");
                                setStatusFilter("semua");
                              }}
                              className="rounded-xl border-slate-200 text-xs text-slate-700 hover:bg-slate-50"
                            >
                              Reset Filter &amp; Pencarian
                            </Button>
                          </div>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedList.map((p) => {
                    const unpaid = (p.invoices ?? []).reduce(
                      (sum, inv) => sum + Number(inv.balanceDue ?? 0),
                      0
                    );
                    const initials = p.nama
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                    const waMessage = `Halo ${p.nama}, salam dari pengelola ${p.kamar?.properti?.nama ?? "kost"}.`;
                    const waUrl = `https://wa.me/${p.noHp}?text=${encodeURIComponent(waMessage)}`;

                    return (
                      <TableRow
                        key={p.id}
                        onClick={() => setSelectedTenant360(p)}
                        className={`cursor-pointer transition-colors ${
                          selectedIds.has(p.id)
                            ? "bg-teal-50/50 hover:bg-teal-50/70"
                            : "hover:bg-teal-50/20"
                        }`}
                      >
                        {/* Checkbox column */}
                        <TableCell
                          className="w-12 px-4 py-3.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={selectedIds.has(p.id)}
                            onCheckedChange={() => handleToggleSelect(p.id)}
                            aria-label={`Pilih ${p.nama}`}
                          />
                        </TableCell>

                        {/* Penyewa Info */}
                        <TableCell className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-800 font-bold text-xs">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 text-sm truncate">{p.nama}</p>
                              <p className="text-[11px] text-slate-400 truncate">
                                KTP: {p.noKtp || "Belum ada KTP"}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* WhatsApp */}
                        {visibleColumns.wa && (
                          <TableCell className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                            >
                              <MessageSquare className="size-3 text-emerald-600" />
                              <span className="font-mono">{p.noHp.startsWith("62") ? `+${p.noHp}` : p.noHp}</span>
                            </a>
                          </TableCell>
                        )}

                        {/* Unit & Properti */}
                        {visibleColumns.kamar && (
                          <TableCell className="px-5 py-3.5">
                            {p.kamar ? (
                              <div>
                                <p className="font-bold text-slate-900 text-sm">
                                  Kamar {p.kamar.nomor}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                  {p.kamar.properti?.nama ?? "Kost Utama"} (Lt. {p.kamar.lantai})
                                </p>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200/60">
                                <UserX className="size-3" /> Belum Ditempatkan
                              </span>
                            )}
                          </TableCell>
                        )}

                        {/* Status Sewa */}
                        {visibleColumns.status && (
                          <TableCell className="px-5 py-3.5">
                            <div className="space-y-1">
                              <StatusBadge
                                variant={p.status === "aktif" ? "emerald" : "slate"}
                                dot
                              >
                                {p.status === "aktif" ? "Aktif" : "Nonaktif"}
                              </StatusBadge>
                              <p className="text-[11px] text-slate-400">
                                Masuk: {new Date(p.tanggalMasuk).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                          </TableCell>
                        )}

                        {/* Tunggakan */}
                        {visibleColumns.tunggakan && (
                          <TableCell className="px-5 py-3.5">
                            {unpaid > 0 ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
                                  <AlertCircle className="size-3 text-rose-600" />
                                  {formatRupiah(unpaid)}
                                </span>
                                <p className="text-[10px] text-rose-500 font-medium">Perlu ditagih</p>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                <CheckCircle2 className="size-3 text-emerald-600" /> Lunas
                              </span>
                            )}
                          </TableCell>
                        )}

                        {/* Actions */}
                        <TableCell className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTenant360(p)}
                              className="h-8 rounded-xl border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <Eye className="mr-1 size-3 text-slate-500" />
                              360°
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setMoveTarget(p);
                                setTargetRoomId(p.kamarId ?? "none");
                              }}
                              className="h-8 rounded-xl border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <ArrowRightLeft className="mr-1 size-3 text-slate-500" />
                              Pindah
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button variant="ghost" size="icon" className="size-8 rounded-xl text-slate-500">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end" className="rounded-xl">
                                <DropdownMenuItem onClick={() => bukaEdit(p)}>
                                  <Pencil className="mr-2 h-3.5 w-3.5 text-slate-500" />
                                  Edit Data
                                </DropdownMenuItem>
                                {p.kamar && (
                                  <DropdownMenuItem onClick={() => setNonaktifTarget(p)}>
                                    <UserX className="mr-2 h-3.5 w-3.5 text-amber-500" />
                                    Tandai Keluar Kamar
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteTarget(p)}
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5 text-rose-500" />
                                  Hapus Penyewa
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* 3. Pagination Controls */}
          {filtered.length > 0 && (
            <DataTablePagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={filtered.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              itemLabel="penyewa"
            />
          )}
        </CardContent>
      </Card>

      {/* ── 360° Tenant Profile Drawer (Batch 21: Contextual Inspection) ── */}
      <Sheet
        open={!!selectedTenant360}
        onOpenChange={(open) => !open && setSelectedTenant360(null)}
      >
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-6 flex flex-col gap-4">
          {selectedTenant360 && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white font-extrabold text-base shadow-sm">
                    {selectedTenant360.nama
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <SheetTitle className="text-xl font-bold text-slate-900">
                      {selectedTenant360.nama}
                    </SheetTitle>
                    <SheetDescription className="text-xs text-slate-500 mt-0.5">
                      KTP: {selectedTenant360.noKtp || "Tidak tercatat"} • Terdaftar sejak{" "}
                      {new Date(selectedTenant360.tanggalMasuk).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              {/* Quick Actions Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                <a
                  href={`https://wa.me/${selectedTenant360.noHp}?text=${encodeURIComponent(
                    `Halo ${selectedTenant360.nama}, salam dari pengelola ${
                      selectedTenant360.kamar?.properti?.nama ?? "kost"
                    }.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition text-center"
                >
                  <MessageSquare className="size-3.5 text-emerald-600" />
                  Chat WA
                </a>

                <Link
                  href={`/dashboard/owner/keuangan?tab=invoices&penghuniId=${selectedTenant360.id}`}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition text-center"
                >
                  <Receipt className="size-3.5 text-teal-600" />
                  Tagih
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const t = selectedTenant360;
                    setSelectedTenant360(null);
                    setMoveTarget(t);
                    setTargetRoomId(t.kamarId ?? "none");
                  }}
                  className="rounded-xl border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ArrowRightLeft className="mr-1.5 size-3.5 text-slate-500" />
                  Pindah
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const t = selectedTenant360;
                    setSelectedTenant360(null);
                    bukaEdit(t);
                  }}
                  className="rounded-xl border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Pencil className="mr-1.5 size-3.5 text-slate-500" />
                  Edit
                </Button>
              </div>

              {/* Detail Sections */}
              <div className="space-y-4 pt-2">
                {/* 1. Kamar & Unit */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Unit Kamar &amp; Kontrak
                  </p>
                  {selectedTenant360.kamar ? (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400">Nomor Kamar:</span>
                        <p className="font-bold text-slate-800 text-sm">
                          Kamar {selectedTenant360.kamar.nomor}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Properti:</span>
                        <p className="font-semibold text-slate-800">
                          {selectedTenant360.kamar.properti?.nama ?? "Kost Utama"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Lantai / Tipe:</span>
                        <p className="text-slate-700 font-medium">
                          Lt. {selectedTenant360.kamar.lantai} • {selectedTenant360.kamar.tipe}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Tarif Bulanan:</span>
                        <p className="text-teal-700 font-bold">
                          {formatRupiah(selectedTenant360.kamar.hargaBulanan)}/bln
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      <UserX className="size-4 shrink-0" />
                      <span>Penyewa ini belum ditempatkan ke kamar manapun.</span>
                    </div>
                  )}
                </div>

                {/* 2. Akses Portal Tenant (Frictionless Onboarding) */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="size-4 text-emerald-600" />
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Akses Portal Tenant
                      </p>
                    </div>
                    {(() => {
                      const status = selectedTenant360.portalAccessStatus || "NOT_SENT";
                      if (status === "ACTIVE") {
                        return (
                          <StatusBadge variant="emerald" dot>
                            Portal Aktif
                          </StatusBadge>
                        );
                      }
                      if (status === "INVITE_SENT") {
                        return (
                          <StatusBadge variant="blue" dot>
                            Undangan Terkirim
                          </StatusBadge>
                        );
                      }
                      if (status === "ACTIVATION_PENDING") {
                        return (
                          <StatusBadge variant="amber" dot>
                            Menunggu OTP
                          </StatusBadge>
                        );
                      }
                      if (status === "DISABLED") {
                        return (
                          <StatusBadge variant="rose" dot>
                            Dinonaktifkan
                          </StatusBadge>
                        );
                      }
                      return (
                        <StatusBadge variant="slate" dot>
                          Belum Dikirim
                        </StatusBadge>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400">Kontak Login:</span>
                      <p className="font-semibold text-slate-800">
                        {selectedTenant360.noHp}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Akun Terhubung:</span>
                      <p className="font-semibold text-slate-800">
                        {selectedTenant360.userId ? "Terdaftar & Aktif" : "Belum Aktivasi"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Tautan Terakhir:</span>
                      <p className="text-slate-700">
                        {selectedTenant360.activationTokens?.[0]?.createdAt
                          ? new Date(
                              selectedTenant360.activationTokens[0].createdAt
                            ).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Belum pernah dikirim"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Tanggal Aktivasi:</span>
                      <p className="text-slate-700">
                        {selectedTenant360.portalActivatedAt
                          ? new Date(
                              selectedTenant360.portalActivatedAt
                            ).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </p>
                    </div>
                  </div>

                  {/* Actions for Portal Access */}
                  <div className="pt-1 flex flex-wrap gap-2">
                    {(!selectedTenant360.portalAccessStatus ||
                      selectedTenant360.portalAccessStatus === "NOT_SENT") && (
                      <Button
                        size="sm"
                        disabled={isPortalActionPending}
                        onClick={() => handleSendPortalAccess(selectedTenant360)}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                      >
                        <Send className="mr-1.5 size-3.5" />
                        {isPortalActionPending ? "Mengirim..." : "Kirim Akses Portal (WhatsApp)"}
                      </Button>
                    )}

                    {(selectedTenant360.portalAccessStatus === "INVITE_SENT" ||
                      selectedTenant360.portalAccessStatus === "ACTIVATION_PENDING") && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPortalActionPending}
                        onClick={() => handleResendPortalAccess(selectedTenant360)}
                        className="rounded-xl border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-semibold"
                      >
                        <Send className="mr-1.5 size-3.5" />
                        {isPortalActionPending ? "Mengirim..." : "Kirim Ulang Akses Portal"}
                      </Button>
                    )}

                    {selectedTenant360.portalAccessStatus === "ACTIVE" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPortalActionPending}
                        onClick={() => setDisablePortalTarget(selectedTenant360)}
                        className="rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold"
                      >
                        <ShieldAlert className="mr-1.5 size-3.5" />
                        Nonaktifkan Akses Portal
                      </Button>
                    )}

                    {selectedTenant360.portalAccessStatus === "DISABLED" && (
                      <Button
                        size="sm"
                        disabled={isPortalActionPending}
                        onClick={() => handleResendPortalAccess(selectedTenant360)}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                      >
                        <Sparkles className="mr-1.5 size-3.5" />
                        {isPortalActionPending ? "Mengirim..." : "Aktifkan & Kirim Akses Baru"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* 2. Status Keuangan & Tagihan Terbuka */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Tagihan &amp; Tunggakan
                    </p>
                    <Link
                      href={`/dashboard/owner/keuangan?tab=invoices&penghuniId=${selectedTenant360.id}`}
                      className="text-xs font-semibold text-teal-600 hover:underline"
                    >
                      Buka Keuangan →
                    </Link>
                  </div>

                  {(() => {
                    const invoices = selectedTenant360.invoices ?? [];
                    const totalUnpaid = invoices.reduce(
                      (sum, inv) => sum + Number(inv.balanceDue ?? 0),
                      0
                    );

                    if (invoices.length === 0 || totalUnpaid === 0) {
                      return (
                        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                          <span>Tidak ada tunggakan terbuka. Seluruh tagihan tercatat lunas.</span>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between rounded-lg bg-rose-50 p-2.5 border border-rose-200">
                          <span className="text-xs font-medium text-rose-700">Total Sisa Tagihan:</span>
                          <span className="font-bold text-rose-700 text-sm">{formatRupiah(totalUnpaid)}</span>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          {invoices.map((inv) => (
                            <div
                              key={inv.id}
                              className="flex items-center justify-between rounded-lg border border-slate-100 p-2 text-xs hover:bg-slate-50 transition"
                            >
                              <div>
                                <p className="font-semibold text-slate-800">{inv.invoiceNumber}</p>
                                <p className="text-[11px] text-slate-400">
                                  Jatuh Tempo:{" "}
                                  {new Date(inv.dueDate).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-rose-600">
                                  {formatRupiah(Number(inv.balanceDue))}
                                </p>
                                <span className="text-[10px] uppercase font-semibold text-slate-400">
                                  {inv.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 3. Pemeliharaan Terakhir */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Riwayat Pemeliharaan &amp; Aduan
                    </p>
                    <Link
                      href="/dashboard/owner/pemeliharaan"
                      className="text-xs font-semibold text-teal-600 hover:underline"
                    >
                      Buka Pemeliharaan →
                    </Link>
                  </div>

                  {(!selectedTenant360.pemeliharaan || selectedTenant360.pemeliharaan.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">Belum ada laporan pemeliharaan dari penyewa ini.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedTenant360.pemeliharaan.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between rounded-lg border border-slate-100 p-2 text-xs"
                        >
                          <span className="font-medium text-slate-800 truncate mr-2">{m.judul}</span>
                          <StatusBadge
                            variant={
                              m.status === "selesai"
                                ? "emerald"
                                : m.status === "diproses"
                                ? "amber"
                                : "rose"
                            }
                          >
                            {m.status}
                          </StatusBadge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Catatan Operasional */}
                {selectedTenant360.catatan && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Catatan Pengelola
                    </p>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap">{selectedTenant360.catatan}</p>
                  </div>
                )}
              </div>

              <SheetFooter className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTenant360(null)}
                  className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700"
                >
                  Tutup Profil
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Modal Pindah Kamar ────────────────────────────────────── */}
      <Dialog open={!!moveTarget} onOpenChange={(open) => !open && setMoveTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Pindah / Tetapkan Kamar</DialogTitle>
            <DialogDescription>
              Atur penempatan kamar untuk penyewa{" "}
              <strong className="text-slate-800">{moveTarget?.nama}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              <span className="text-slate-500">Kamar saat ini:</span>
              <p className="font-bold text-slate-900 mt-0.5">
                {moveTarget?.kamar
                  ? `Kamar ${moveTarget.kamar.nomor} — ${
                      moveTarget.kamar.properti?.nama ?? "Kost"
                    } (Lt. ${moveTarget.kamar.lantai})`
                  : "Belum ditempatkan"}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="targetRoom">Pilih Kamar Tujuan</Label>
              <Select
                value={targetRoomId}
                onValueChange={(val) => setTargetRoomId(val ?? "none")}
              >
                <SelectTrigger id="targetRoom" className="rounded-xl">
                  <SelectValue placeholder="Pilih kamar kosong..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none">
                    <span className="text-rose-600 font-medium">
                      Lepas dari kamar (Tidak ada kamar)
                    </span>
                  </SelectItem>
                  {vacantRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      Kamar {room.nomor} ({room.tipe}) — {room.properti?.nama ?? "Kost"} (
                      {formatRupiah(room.hargaBulanan)}/bln)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {vacantRooms.length === 0 && (
                <p className="text-[11px] text-amber-600">
                  Tidak ada kamar kosong yang tersedia saat ini.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMoveTarget(null)}
              disabled={isMoving}
              className="rounded-xl border-slate-200"
            >
              Batal
            </Button>
            <Button
              onClick={handlePindahKamar}
              disabled={isMoving}
              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold"
            >
              {isMoving ? "Menyimpan..." : "Konfirmasi Pindah Kamar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Tambah / Edit Penghuni (Batch 20 Form Standardization) ──── */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) handleRequestClose();
          else setFormOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Data Penyewa" : "Daftarkan Penyewa Baru"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Perbarui identitas, kontak WhatsApp, dan data penting penyewa."
                : "Masukkan identitas penyewa. Penempatan kamar dapat dihubungkan langsung atau menyusul."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Nama Lengkap */}
            <FormField label="Nama Lengkap" required error={errors.nama}>
              {({ id, "aria-invalid": ariaInvalid }) => (
                <Input
                  id={id}
                  value={form.nama}
                  onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                  placeholder="Contoh: Budi Santoso"
                  className={`rounded-xl ${ariaInvalid ? "border-rose-300 focus:border-rose-400" : ""}`}
                />
              )}
            </FormField>

            {/* Kontak WA & No KTP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                label="No. WhatsApp"
                required
                error={errors.noHp}
                description="Untuk pengiriman invoice & pengingat otomatis"
              >
                {({ id, "aria-invalid": ariaInvalid }) => (
                  <PhoneInput
                    id={id}
                    value={form.noHp}
                    onChange={(cleanDigits) => setForm((f) => ({ ...f, noHp: cleanDigits }))}
                    hasError={ariaInvalid}
                    placeholder="812 3456 7890"
                  />
                )}
              </FormField>

              <FormField
                label="No. KTP / NIK"
                description="Identitas kependudukan 16 digit"
              >
                {({ id }) => (
                  <Input
                    id={id}
                    placeholder="3201..."
                    value={form.noKtp}
                    onChange={(e) => setForm((f) => ({ ...f, noKtp: e.target.value }))}
                    className="rounded-xl"
                  />
                )}
              </FormField>
            </div>

            {/* Email & Tanggal Masuk */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Alamat Email" description="Untuk pengiriman kuitansi digital">
                {({ id }) => (
                  <Input
                    id={id}
                    type="email"
                    placeholder="penyewa@email.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="rounded-xl"
                  />
                )}
              </FormField>

              <FormField label="Tanggal Mulai Tinggal" required error={errors.tanggalMasuk}>
                {({ id, "aria-invalid": ariaInvalid }) => (
                  <Input
                    id={id}
                    type="date"
                    value={form.tanggalMasuk}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tanggalMasuk: e.target.value }))
                    }
                    className={`rounded-xl ${ariaInvalid ? "border-rose-300 focus:border-rose-400" : ""}`}
                  />
                )}
              </FormField>
            </div>

            {/* Catatan Operasional */}
            <FormField
              label="Catatan Tambahan & Kontak Darurat"
              description="Nomor darurat keluarga, plat motor/mobil, pekerjaan"
            >
              {({ id }) => (
                <Textarea
                  id={id}
                  rows={2}
                  placeholder="Contoh: Kontak darurat Ayah (0812...), B 1234 XYZ (Honda Vario)"
                  value={form.catatan}
                  onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
                  className="rounded-xl text-xs"
                />
              )}
            </FormField>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={handleRequestClose}
              disabled={isPending}
              className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </Button>
            <SubmitButton
              onClick={simpanPenghuni}
              isPending={isPending}
              loadingText="Menyimpan..."
              className="text-xs"
            >
              {editingId ? "Simpan Perubahan" : "Daftarkan Penyewa"}
            </SubmitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dirty Form Warning Dialog (Batch 20) ──────────────────── */}
      <UnsavedChangesDialog
        open={dirtyConfirmOpen}
        onOpenChange={setDirtyConfirmOpen}
        onConfirmDiscard={() => {
          setDirtyConfirmOpen(false);
          setFormOpen(false);
        }}
      />

      {/* ── Dialog Konfirmasi Keluar Kamar ────────────────────────── */}
      <AlertDialog
        open={!!nonaktifTarget}
        onOpenChange={(open) => !open && setNonaktifTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Tandai keluar dari kamar?</AlertDialogTitle>
            <AlertDialogDescription>
              Penyewa <strong className="text-slate-800">{nonaktifTarget?.nama}</strong> akan
              dilepaskan dari Kamar {nonaktifTarget?.kamar?.nomor}. Status kamar akan otomatis
              kembali menjadi <strong>KOSONG</strong> dan data riwayat penyewa tetap tersimpan di
              sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} className="rounded-xl">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={konfirmasiNonaktifkan}
              disabled={isPending}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              {isPending ? "Memproses..." : "Tandai Keluar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Dialog Konfirmasi Hapus (Batch 21: Destructive Confirmation) ── */}
      <DestructiveDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={konfirmasiHapus}
        title="Hapus Penyewa Secara Permanen?"
        entityName={deleteTarget?.nama}
        description="Data penyewa dan seluruh keterkaitan kamar akan dihapus permanen dari sistem. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus Permanen"
        isPending={isPending}
      />

      {/* ── Dialog Konfirmasi Nonaktifkan Akses Portal ───────── */}
      <DestructiveDialog
        open={!!disablePortalTarget}
        onOpenChange={(open) => !open && setDisablePortalTarget(null)}
        onConfirm={handleConfirmDisablePortal}
        title="Nonaktifkan Akses Portal Tenant?"
        entityName={disablePortalTarget?.nama}
        description="Penyewa tidak akan dapat masuk atau mengakses data sewa di Tenant Portal. Seluruh histori sewa, kamar, tagihan, dan bukti pembayaran tetap aman di sistem."
        confirmLabel="Nonaktifkan Akses"
        isPending={isPortalActionPending}
      />

      {/* ── Dialog Impor Penyewa Multi-Format & Audit ─────────────── */}
      <TenantImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onImportSuccess={handleImportSuccess}
      />
      {/* ── Dialog Akses Portal WhatsApp ── */}
      <Dialog
        open={!!whatsappModalData}
        onOpenChange={(open) => {
          if (!open) setWhatsappModalData(null);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-[#0FA37F] mb-3">
              <MessageSquare className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-neutral-900">
              Kirim Akses Portal ke WhatsApp
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-neutral-500">
              Tautan aktivasi untuk <strong>{whatsappModalData?.tenantName}</strong> ({whatsappModalData?.phone}) telah berhasil dibuat.
            </DialogDescription>
          </DialogHeader>

          <div className="my-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 text-xs text-neutral-600 space-y-1.5">
            <p className="font-semibold text-neutral-800">Status Pengiriman:</p>
            <p className="leading-relaxed text-neutral-500">
              Klik tombol hijau di bawah untuk membuka WhatsApp Web atau aplikasi WhatsApp dengan pesan dan link aktivasi yang sudah terisi otomatis.
            </p>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
            <a
              href={whatsappModalData?.directUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setWhatsappModalData(null)}
              className="inline-flex w-full sm:flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1EBE5D] transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              Buka WhatsApp Sekarang
            </a>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-neutral-200 text-xs"
              onClick={() => {
                if (whatsappModalData?.directUrl) {
                  navigator.clipboard.writeText(whatsappModalData.directUrl);
                  toast.success("Tautan WhatsApp berhasil disalin!");
                }
              }}
            >
              Salin Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
