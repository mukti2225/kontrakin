"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Wrench,
  Search,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  UserCheck,
  Phone,
  Building,
  Filter,
  MoreVertical,
  Calendar,
  Users,
  Download,
  Check,
  X,
  Eye,
  Printer,
  MessageCircle,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  RotateCcw,
  FileText,
  ChevronRight,
  Image as ImageIcon,
  DollarSign,
  User,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  FormField,
  CurrencyInput,
  SubmitButton,
  UnsavedChangesDialog,
} from "@/components/form/form-controls";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/utils/export-csv";

import {
  updateStatusPemeliharaan,
  assignVendorPemeliharaan,
  createVendorAction,
  createPemeliharaanAction,
  reopenPemeliharaanAction,
  type CreateVendorInput,
  type CreatePemeliharaanInput,
} from "./action";
import { VendorManagementTab, type MaintenanceExpenseItem } from "./vendor-management-tab";


// ─── Types & Metadata ─────────────────────────────────────────────────────────

export interface PemeliharaanItem {
  id: string;
  judul: string;
  deskripsi: string;
  status: "menunggu" | "diproses" | "selesai";
  prioritas: "rendah" | "sedang" | "tinggi";
  kategori: string;
  foto: string | null;
  penghuniId: string;
  kamarId: string;
  ownerId: string;
  organizationId: string | null;
  vendorId: string | null;
  createdAt: string;
  updatedAt: string;
  penghuni?: { id: string; nama: string; noHp: string } | null;
  kamar?: {
    id: string;
    nomor: string;
    properti?: { id: string; nama: string } | null;
  } | null;
  vendor?: {
    id: string;
    name: string;
    category: string;
    phone: string;
  } | null;
}

export interface VendorItem {
  id: string;
  name: string;
  category: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
}

export interface RoomOption {
  id: string;
  nomor: string;
  propertiId?: string | null;
  properti?: { id: string; nama: string } | null;
  penghuni?: Array<{ id: string; nama: string; noHp: string }> | null;
}

export interface TenantOption {
  id: string;
  nama: string;
  noHp: string;
  kamarId?: string | null;
}

export interface TeamMemberDTO {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
}

interface PemeliharaanClientProps {
  initialItems: PemeliharaanItem[];
  initialVendors: VendorItem[];
  propertiList?: Array<{ id: string; nama: string }>;
  kamarList?: RoomOption[];
  penghuniList?: TenantOption[];
  teamMembers?: TeamMemberDTO[];
  initialExpenses?: MaintenanceExpenseItem[];
}

// ─── SLA & Metadata Helpers ───────────────────────────────────────────────────

export interface ParsedMaintenanceMetadata {
  estimatedCost?: number;
  assignedStaff?: string;
  reopenReason?: string;
  cleanDescription: string;
}

export function parseMaintenanceDescription(deskripsi: string): ParsedMaintenanceMetadata {
  let str = deskripsi || "";
  let estimatedCost: number | undefined;
  let assignedStaff: string | undefined;
  let reopenReason: string | undefined;

  const estMatch = str.match(/\[Estimasi:\s*Rp\s*([\d.,]+)\]/i);
  if (estMatch) {
    const num = parseInt(estMatch[1].replace(/[.,]/g, ""), 10);
    if (!isNaN(num)) estimatedCost = num;
    str = str.replace(estMatch[0], "").trim();
  }

  const picMatch = str.match(/\[PIC:\s*([^\]]+)\]/i);
  if (picMatch) {
    assignedStaff = picMatch[1].trim();
    str = str.replace(picMatch[0], "").trim();
  }

  const reopenMatch = str.match(/\[Reopen:\s*([^\]]+)\]/i);
  if (reopenMatch) {
    reopenReason = reopenMatch[1].trim();
    str = str.replace(reopenMatch[0], "").trim();
  }

  return {
    estimatedCost,
    assignedStaff,
    reopenReason,
    cleanDescription: str.trim() || "-",
  };
}

export interface SLAResult {
  status: "breached" | "warning" | "ontrack" | "completed_ontrack" | "completed_late";
  label: string;
  badgeVariant: "rose" | "amber" | "emerald" | "slate";
  hoursLeft: number;
  text: string;
}

export function calculateTicketSLA(
  createdAtStr: string,
  prioritas: "rendah" | "sedang" | "tinggi",
  status: "menunggu" | "diproses" | "selesai",
  updatedAtStr?: string
): SLAResult {
  // Target limits in hours:
  // tinggi = 24h (1 day)
  // sedang = 48h (2 days)
  // rendah = 120h (5 days)
  const limitHours = prioritas === "tinggi" ? 24 : prioritas === "sedang" ? 48 : 120;
  const createdDate = new Date(createdAtStr);
  const deadlineDate = new Date(createdDate.getTime() + limitHours * 3600 * 1000);
  const now = Date.now();

  if (status === "selesai") {
    const completedDate = updatedAtStr ? new Date(updatedAtStr) : new Date();
    const diffToDeadline = completedDate.getTime() - deadlineDate.getTime();
    if (diffToDeadline <= 0) {
      return {
        status: "completed_ontrack",
        label: "Sesuai SLA",
        badgeVariant: "emerald",
        hoursLeft: 0,
        text: "Selesai dalam target",
      };
    } else {
      const lateHours = Math.ceil(diffToDeadline / (3600 * 1000));
      return {
        status: "completed_late",
        label: "Lewat Target",
        badgeVariant: "slate",
        hoursLeft: -lateHours,
        text: `Melewati ${lateHours >= 24 ? Math.floor(lateHours / 24) + " hr" : lateHours + " jam"}`,
      };
    }
  }

  const diffMs = deadlineDate.getTime() - now;
  if (diffMs < 0) {
    const overdueHours = Math.ceil(Math.abs(diffMs) / (3600 * 1000));
    return {
      status: "breached",
      label: "SLA Terlewat",
      badgeVariant: "rose",
      hoursLeft: -overdueHours,
      text: `Lewat ${overdueHours >= 24 ? Math.floor(overdueHours / 24) + " hr" : overdueHours + " jam"}`,
    };
  } else if (diffMs < limitHours * 0.25 * 3600 * 1000) {
    const hoursLeft = Math.ceil(diffMs / (3600 * 1000));
    return {
      status: "warning",
      label: "Mendekati Tenggat",
      badgeVariant: "amber",
      hoursLeft,
      text: `Sisa ${hoursLeft} jam`,
    };
  } else {
    const hoursLeft = Math.ceil(diffMs / (3600 * 1000));
    return {
      status: "ontrack",
      label: "On-Track",
      badgeVariant: "emerald",
      hoursLeft,
      text: `Sisa ${hoursLeft >= 24 ? Math.floor(hoursLeft / 24) + " hr" : hoursLeft + " jam"}`,
    };
  }
}

// ─── Component Main ───────────────────────────────────────────────────────────

export function PemeliharaanClient({
  initialItems,
  initialVendors,
  propertiList = [],
  kamarList = [],
  penghuniList = [],
  teamMembers = [],
  initialExpenses = [],
}: PemeliharaanClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams?.get("status") || "all";
  const [mainTab, setMainTab] = useState<"tickets" | "vendors">(
    searchParams?.get("tab") === "vendors" ? "vendors" : "tickets"
  );

  // Data State
  const [items, setItems] = useState<PemeliharaanItem[]>(initialItems);
  const [vendors, setVendors] = useState<VendorItem[]>(initialVendors);


  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [slaFilter, setSlaFilter] = useState<string>("all");

  const [isPending, startTransition] = useTransition();

  // Dialogs State
  const [detailItem, setDetailItem] = useState<PemeliharaanItem | null>(null);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [completionCost, setCompletionCost] = useState("");
  const [autoRecordExpense, setAutoRecordExpense] = useState(true);
  const [expenseNote, setExpenseNote] = useState("");

  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");

  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [printWorkOrderOpen, setPrintWorkOrderOpen] = useState(false);

  // Create Ticket State & Dirty Form Guard (Batch 20)
  const INITIAL_TICKET_FORM = {
    judul: "",
    deskripsi: "",
    kategori: "Pemeliharaan AC",
    prioritas: "sedang" as "rendah" | "sedang" | "tinggi",
    propertiId: "",
    kamarId: "",
    penghuniId: "",
    vendorId: "",
    assignedStaff: "",
    foto: "",
    estimasiBiaya: "",
  };

  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [newTicket, setNewTicket] = useState(INITIAL_TICKET_FORM);
  const [initialTicketSnapshot, setInitialTicketSnapshot] = useState<string>(JSON.stringify(INITIAL_TICKET_FORM));
  const [dirtyTicketConfirmOpen, setDirtyTicketConfirmOpen] = useState(false);

  const isTicketDirty = useMemo(() => {
    return JSON.stringify(newTicket) !== initialTicketSnapshot;
  }, [newTicket, initialTicketSnapshot]);

  function handleRequestCloseTicket() {
    if (isTicketDirty) {
      setDirtyTicketConfirmOpen(true);
    } else {
      setCreateTicketOpen(false);
    }
  }

  function handleOpenCreateTicket() {
    setNewTicket(INITIAL_TICKET_FORM);
    setInitialTicketSnapshot(JSON.stringify(INITIAL_TICKET_FORM));
    setCreateTicketOpen(true);
  }

  // Vendor Creation Modal State
  const [addVendorOpen, setAddVendorOpen] = useState(false);
  const [newVendor, setNewVendor] = useState<CreateVendorInput>({
    name: "",
    category: "General",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  // ── Stats & KPI Action Center ─────────────────────────────────────────────
  const stats = useMemo(() => {
    const menunggu = items.filter((i) => i.status === "menunggu").length;
    const diproses = items.filter((i) => i.status === "diproses").length;
    const selesai = items.filter((i) => i.status === "selesai").length;

    // SLA Breached count (active tickets that exceeded deadline)
    const breached = items.filter((i) => {
      if (i.status === "selesai") return false;
      const sla = calculateTicketSLA(i.createdAt, i.prioritas, i.status, i.updatedAt);
      return sla.status === "breached";
    }).length;

    const mendesak = items.filter(
      (i) => i.prioritas === "tinggi" && i.status !== "selesai"
    ).length;

    return { total: items.length, menunggu, diproses, selesai, breached, mendesak };
  }, [items]);

  // Dynamic Units for cascading dropdown in Create Modal
  const availableRoomsForCreate = useMemo(() => {
    if (!newTicket.propertiId) return kamarList;
    return kamarList.filter(
      (k) => k.propertiId === newTicket.propertiId || k.properti?.id === newTicket.propertiId
    );
  }, [kamarList, newTicket.propertiId]);

  // Dynamic Units for filter bar
  const availableRoomsForFilter = useMemo(() => {
    if (propertyFilter === "all") return kamarList;
    return kamarList.filter(
      (k) => k.propertiId === propertyFilter || k.properti?.id === propertyFilter
    );
  }, [kamarList, propertyFilter]);

  // ── Filtered Tickets ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return items.filter((item) => {
      // Status filter
      if (statusFilter !== "all" && item.status !== statusFilter) return false;

      // Priority filter
      if (priorityFilter !== "all" && item.prioritas !== priorityFilter) return false;

      // Property filter
      if (propertyFilter !== "all") {
        const itemPropId = item.kamar?.properti?.id;
        if (itemPropId !== propertyFilter) return false;
      }

      // Unit filter
      if (unitFilter !== "all" && item.kamarId !== unitFilter) return false;

      // Vendor filter
      if (vendorFilter !== "all") {
        if (vendorFilter === "unassigned") {
          if (item.vendorId) return false;
        } else if (item.vendorId !== vendorFilter) {
          return false;
        }
      }

      // SLA filter
      if (slaFilter !== "all") {
        const sla = calculateTicketSLA(item.createdAt, item.prioritas, item.status, item.updatedAt);
        if (slaFilter === "breached" && sla.status !== "breached") return false;
        if (slaFilter === "warning" && sla.status !== "warning") return false;
        if (slaFilter === "ontrack" && !["ontrack", "completed_ontrack"].includes(sla.status))
          return false;
      }

      // Text Search
      if (!q) return true;
      const titleMatch = item.judul.toLowerCase().includes(q);
      const descMatch = item.deskripsi.toLowerCase().includes(q);
      const roomMatch = item.kamar?.nomor.toLowerCase().includes(q);
      const propMatch = item.kamar?.properti?.nama.toLowerCase().includes(q);
      const tenantMatch = item.penghuni?.nama.toLowerCase().includes(q);
      const vendorMatch = item.vendor?.name.toLowerCase().includes(q);
      const katMatch = item.kategori.toLowerCase().includes(q);
      const idMatch = item.id.toLowerCase().includes(q);

      return (
        titleMatch ||
        descMatch ||
        roomMatch ||
        propMatch ||
        tenantMatch ||
        vendorMatch ||
        katMatch ||
        idMatch
      );
    });
  }, [
    items,
    search,
    statusFilter,
    priorityFilter,
    propertyFilter,
    unitFilter,
    vendorFilter,
    slaFilter,
  ]);

  const hasActiveFilters =
    Boolean(search) ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    propertyFilter !== "all" ||
    unitFilter !== "all" ||
    vendorFilter !== "all" ||
    slaFilter !== "all";

  function resetAllFilters() {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setPropertyFilter("all");
    setUnitFilter("all");
    setVendorFilter("all");
    setSlaFilter("all");
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  function openDetail(item: PemeliharaanItem) {
    setDetailItem(item);
  }

  function handleExportCSV() {
    const headers = [
      "ID Tiket",
      "Keluhan",
      "Kategori",
      "Prioritas",
      "Status",
      "SLA Status",
      "Kamar",
      "Properti",
      "Penyewa",
      "No HP",
      "Vendor",
      "Tanggal Lapor",
    ];
    const rows = filtered.map((item) => {
      const sla = calculateTicketSLA(item.createdAt, item.prioritas, item.status, item.updatedAt);
      return [
        `#TIK-${item.id.slice(-6).toUpperCase()}`,
        item.judul,
        item.kategori,
        item.prioritas,
        item.status,
        sla.label,
        item.kamar?.nomor || "-",
        item.kamar?.properti?.nama || "-",
        item.penghuni?.nama || "-",
        item.penghuni?.noHp || "-",
        item.vendor?.name || "Belum ditugaskan",
        item.createdAt.slice(0, 10),
      ];
    });
    exportToCSV("daftar_pemeliharaan_operasional", headers, rows);
    toast.success("Daftar pemeliharaan berhasil diekspor ke CSV");
  }

  function handleStatusChange(
    id: string,
    newStatus: "menunggu" | "diproses" | "selesai",
    customOptions?: { biaya?: number; catatPengeluaran?: boolean; catatanBiaya?: string }
  ) {
    startTransition(async () => {
      try {
        await updateStatusPemeliharaan(id, newStatus, customOptions);
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
        if (detailItem && detailItem.id === id) {
          setDetailItem((prev) => (prev ? { ...prev, status: newStatus } : null));
        }

        if (newStatus === "selesai" && customOptions?.catatPengeluaran && customOptions.biaya) {
          toast.success(
            `Tiket selesai & biaya Rp ${customOptions.biaya.toLocaleString(
              "id-ID"
            )} otomatis dicatat ke Buku Kas`
          );
        } else {
          toast.success(`Status tiket diubah menjadi "${newStatus}"`);
        }
        setCompletionModalOpen(false);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Gagal mengubah status pemeliharaan");
      }
    });
  }

  function handleAssignVendor(id: string, vendorId: string | null) {
    startTransition(async () => {
      try {
        await assignVendorPemeliharaan(id, vendorId);
        const assignedVendor = vendors.find((v) => v.id === vendorId) || null;
        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  vendorId,
                  vendor: assignedVendor,
                  status: vendorId && item.status === "menunggu" ? "diproses" : item.status,
                }
              : item
          )
        );
        if (detailItem && detailItem.id === id) {
          setDetailItem((prev) =>
            prev
              ? {
                  ...prev,
                  vendorId,
                  vendor: assignedVendor,
                  status: vendorId && prev.status === "menunggu" ? "diproses" : prev.status,
                }
              : null
          );
        }
        toast.success(
          assignedVendor
            ? `Vendor "${assignedVendor.name}" berhasil ditugaskan!`
            : "Penugasan vendor dilepas"
        );
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Gagal menugaskan vendor");
      }
    });
  }

  function handleSaveVendor() {
    if (!newVendor.name.trim() || !newVendor.phone.trim()) {
      toast.error("Nama vendor dan nomor telepon wajib diisi");
      return;
    }

    startTransition(async () => {
      try {
        const created = await createVendorAction(newVendor);
        setVendors((prev) => [...prev, created as any]);
        toast.success(`Vendor baru "${created.name}" berhasil ditambahkan!`);
        setAddVendorOpen(false);
        setNewVendor({
          name: "",
          category: "General",
          phone: "",
          email: "",
          address: "",
          notes: "",
        });
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Gagal menambahkan vendor");
      }
    });
  }

  function handleCreateTicket() {
    if (!newTicket.judul.trim() || !newTicket.deskripsi.trim()) {
      toast.error("Judul keluhan dan deskripsi wajib diisi");
      return;
    }
    if (!newTicket.kamarId) {
      toast.error("Kamar unit wajib dipilih");
      return;
    }
    if (!newTicket.penghuniId) {
      toast.error("Penyewa terkait wajib dipilih");
      return;
    }

    startTransition(async () => {
      try {
        const estNum = newTicket.estimasiBiaya ? Number(newTicket.estimasiBiaya) : undefined;
        const created = await createPemeliharaanAction({
          judul: newTicket.judul,
          deskripsi: newTicket.deskripsi,
          kategori: newTicket.kategori,
          prioritas: newTicket.prioritas,
          kamarId: newTicket.kamarId,
          penghuniId: newTicket.penghuniId,
          vendorId: newTicket.vendorId || null,
          assignedStaff: newTicket.assignedStaff || null,
          foto: newTicket.foto || null,
          estimasiBiaya: estNum,
        });

        setItems((prev) => [created as any, ...prev]);
        toast.success(`Tiket keluhan #${created.id.slice(-6).toUpperCase()} berhasil dibuat!`);
        setCreateTicketOpen(false);
        setNewTicket({
          judul: "",
          deskripsi: "",
          kategori: "Pemeliharaan AC",
          prioritas: "sedang",
          propertiId: "",
          kamarId: "",
          penghuniId: "",
          vendorId: "",
          assignedStaff: "",
          foto: "",
          estimasiBiaya: "",
        });
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Gagal membuat tiket pemeliharaan");
      }
    });
  }

  function handleReopenTicket() {
    if (!detailItem) return;
    if (!reopenReason.trim()) {
      toast.error("Alasan pembukaan kembali tiket wajib diisi");
      return;
    }

    startTransition(async () => {
      try {
        const updated = await reopenPemeliharaanAction(detailItem.id, reopenReason);
        setItems((prev) => prev.map((item) => (item.id === detailItem.id ? (updated as any) : item)));
        setDetailItem(updated as any);
        toast.success("Tiket pemeliharaan berhasil dibuka kembali!");
        setReopenModalOpen(false);
        setReopenReason("");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Gagal membuka kembali tiket");
      }
    });
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Pusat Operasional Pemeliharaan
            </h1>
            <Badge variant="outline" className="border-teal-300 bg-teal-50 text-teal-800">
              SLA &amp; Dispatcher
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Tindak lanjuti keluhan unit, alokasikan vendor teknisi, pantau SLA ketepatan waktu, dan kendalikan biaya perbaikan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddVendorOpen(true)}
            className="gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Users className="size-4" />
            <span>+ Vendor Baru</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreateTicket}
            className="gap-1.5 bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm"
          >
            <Plus className="size-4" />
            <span>+ Buat Laporan Tiket</span>
          </Button>
        </div>
      </div>

      {/* ── Main Tab Navigation Pills ───────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setMainTab("tickets")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            mainTab === "tickets"
              ? "bg-teal-800 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Wrench className="size-4" />
          <span>Tiket Pemeliharaan &amp; SLA</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              mainTab === "tickets" ? "bg-teal-900 text-teal-100" : "bg-slate-100 text-slate-700"
            }`}
          >
            {stats.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab("vendors")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            mainTab === "vendors"
              ? "bg-teal-800 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Users className="size-4" />
          <span>Direktori Rekanan Vendor</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              mainTab === "vendors" ? "bg-teal-900 text-teal-100" : "bg-slate-100 text-slate-700"
            }`}
          >
            {vendors.length}
          </span>
        </button>
      </div>

      {mainTab === "tickets" ? (
        <>
          {/* ── KPI Action Center Stat Cards ────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* Menunggu Review */}
        <div
          onClick={() => setStatusFilter("menunggu")}
          className={`cursor-pointer rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
            statusFilter === "menunggu"
              ? "border-rose-400 bg-rose-50/50 ring-2 ring-rose-200"
              : "border-rose-100 bg-white"
          }`}
        >
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-600">Menunggu Tindakan</p>
            <div className="rounded-xl bg-rose-50 p-2 text-rose-600">
              <AlertTriangle className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-rose-600">{stats.menunggu}</p>
          <p className="mt-1 text-xs text-slate-500">Keluhan baru belum ditugaskan</p>
        </div>

        {/* Sedang Dikerjakan */}
        <div
          onClick={() => setStatusFilter("diproses")}
          className={`cursor-pointer rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
            statusFilter === "diproses"
              ? "border-amber-400 bg-amber-50/50 ring-2 ring-amber-200"
              : "border-amber-100 bg-white"
          }`}
        >
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-600">Sedang Diproses</p>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <Clock className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-amber-600">{stats.diproses}</p>
          <p className="mt-1 text-xs text-slate-500">Teknisi / vendor dalam pengerjaan</p>
        </div>

        {/* SLA Terlewat (Breached) */}
        <div
          onClick={() => setSlaFilter(slaFilter === "breached" ? "all" : "breached")}
          className={`cursor-pointer rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
            slaFilter === "breached"
              ? "border-rose-500 bg-rose-100/60 ring-2 ring-rose-300"
              : stats.breached > 0
              ? "border-rose-200 bg-rose-50/40"
              : "border-slate-100 bg-white"
          }`}
        >
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-600">SLA Terlewat (Breached)</p>
            <div
              className={`rounded-xl p-2 ${
                stats.breached > 0 ? "bg-rose-100 text-rose-600 animate-pulse" : "bg-slate-100 text-slate-400"
              }`}
            >
              <ShieldAlert className="size-5" />
            </div>
          </div>
          <p
            className={`mt-2 text-3xl font-bold ${
              stats.breached > 0 ? "text-rose-600" : "text-slate-800"
            }`}
          >
            {stats.breached}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {stats.breached > 0 ? "Wajib eskalasi segera!" : "Semua tiket sesuai SLA"}
          </p>
        </div>

        {/* Selesai Diverifikasi */}
        <div
          onClick={() => setStatusFilter("selesai")}
          className={`cursor-pointer rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
            statusFilter === "selesai"
              ? "border-emerald-400 bg-emerald-50/50 ring-2 ring-emerald-200"
              : "border-emerald-100 bg-white"
          }`}
        >
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-600">Selesai &amp; Ditutup</p>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.selesai}</p>
          <p className="mt-1 text-xs text-slate-500">Perbaikan selesai terverifikasi</p>
        </div>
      </div>

      {/* ── Multi-Dimensional Filter Bar ────────────────────────────── */}
      <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        {/* Row 1: Search & Status Pills & Action */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[260px] flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Cari tiket, keluhan, kamar, penyewa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs sm:text-sm h-9"
              />
            </div>

            {/* Status Filter Pills with Counters */}
            <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1">
              {[
                { id: "all", label: "Semua", count: stats.total },
                { id: "menunggu", label: "Menunggu", count: stats.menunggu },
                { id: "diproses", label: "Diproses", count: stats.diproses },
                { id: "selesai", label: "Selesai", count: stats.selesai },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    statusFilter === f.id
                      ? "bg-white text-teal-800 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>{f.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      statusFilter === f.id
                        ? "bg-teal-100 text-teal-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAllFilters}
                className="h-8 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <X className="mr-1 size-3.5" />
                Reset Filter
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-9 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="mr-1.5 size-3.5" />
              Ekspor CSV
            </Button>
          </div>
        </div>

        {/* Row 2: Secondary Dropdowns (Properti, Kamar, Vendor, Prioritas, SLA) */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {/* Properti Filter */}
          <Select value={propertyFilter} onValueChange={(val) => { setPropertyFilter(val ?? "all"); setUnitFilter("all"); }}>
            <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
              <SelectValue placeholder="Semua Properti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Properti</SelectItem>
              {propertiList.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Unit / Kamar Filter */}
          <Select value={unitFilter} onValueChange={(val) => setUnitFilter(val ?? "all")}>
            <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
              <SelectValue placeholder="Semua Kamar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kamar</SelectItem>
              {availableRoomsForFilter.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  Kamar {k.nomor} ({k.properti?.nama || "Kost"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Prioritas Filter */}
          <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val ?? "all")}>
            <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
              <SelectValue placeholder="Semua Prioritas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Prioritas</SelectItem>
              <SelectItem value="tinggi">Tinggi (Darurat / 24 Jam)</SelectItem>
              <SelectItem value="sedang">Sedang (48 Jam)</SelectItem>
              <SelectItem value="rendah">Rendah (5 Hari)</SelectItem>
            </SelectContent>
          </Select>

          {/* Vendor Filter */}
          <Select value={vendorFilter} onValueChange={(val) => setVendorFilter(val ?? "all")}>
            <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
              <SelectValue placeholder="Semua Vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Vendor</SelectItem>
              <SelectItem value="unassigned">Belum Ditugaskan</SelectItem>
              {vendors.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name} ({v.category})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* SLA Filter */}
          <Select value={slaFilter} onValueChange={(val) => setSlaFilter(val ?? "all")}>
            <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
              <SelectValue placeholder="Semua SLA" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status SLA</SelectItem>
              <SelectItem value="breached">SLA Terlewat (Breached)</SelectItem>
              <SelectItem value="warning">Mendekati Tenggat (&lt;25%)</SelectItem>
              <SelectItem value="ontrack">Sesuai SLA / On-Track</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Table Container ─────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Tiket &amp; Keluhan</th>
                <th className="px-5 py-3.5">Kamar &amp; Properti</th>
                <th className="px-5 py-3.5">Penyewa</th>
                <th className="px-5 py-3.5">Prioritas</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">SLA Indikator</th>
                <th className="px-5 py-3.5">Vendor / Teknisi</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Wrench className="size-6" />
                    </div>
                    {items.length === 0 ? (
                      <>
                        <p className="mt-3 text-base font-semibold text-slate-800">
                          Belum ada tiket keluhan pemeliharaan
                        </p>
                        <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                          Semua unit dalam kondisi prima. Jika ada keluhan dari penyewa, buat tiket baru untuk memantau SLA dan penugasan teknisi.
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => setCreateTicketOpen(true)}
                            className="rounded-xl bg-emerald-700 text-xs font-semibold text-white hover:bg-emerald-800"
                          >
                            <Plus className="mr-1.5 size-3.5" />
                            Buat Tiket Baru
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="mt-3 text-base font-semibold text-slate-800">
                          Tidak ada tiket yang cocok
                        </p>
                        <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                          Tidak ada tiket pemeliharaan yang sesuai dengan kombinasi filter Anda.
                        </p>
                        <div className="mt-4 flex items-center justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={resetAllFilters}
                            className="rounded-xl border-slate-200 text-xs text-slate-700 hover:bg-slate-50"
                          >
                            Reset Semua Filter
                          </Button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const sla = calculateTicketSLA(
                    item.createdAt,
                    item.prioritas,
                    item.status,
                    item.updatedAt
                  );
                  const meta = parseMaintenanceDescription(item.deskripsi);

                  return (
                    <tr
                      key={item.id}
                      className={`transition hover:bg-slate-50/70 ${
                        sla.status === "breached" ? "bg-rose-50/20" : ""
                      }`}
                    >
                      {/* Ticket Code & Title */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-teal-800">
                            #{item.id.slice(-6).toUpperCase()}
                          </span>
                          {item.foto && (
                            <button
                              onClick={() => setPhotoPreviewUrl(item.foto)}
                              title="Lihat foto keluhan"
                              className="text-slate-400 hover:text-teal-700 transition"
                            >
                              <ImageIcon className="size-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="font-semibold text-slate-900 mt-0.5 line-clamp-1">
                          {item.judul}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                            {item.kategori}
                          </span>
                          {meta.estimatedCost && (
                            <span className="text-[10px] text-slate-500">
                              Est: Rp {meta.estimatedCost.toLocaleString("id-ID")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Room & Property */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          Kamar {item.kamar?.nomor || "-"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {item.kamar?.properti?.nama || "Properti"}
                        </p>
                      </td>

                      {/* Tenant */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {item.penghuni?.nama || "Penyewa"}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                          <span>{item.penghuni?.noHp || "-"}</span>
                          {item.penghuni?.noHp && (
                            <a
                              href={`https://wa.me/${item.penghuni.noHp.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:text-emerald-700"
                              title="Chat WhatsApp"
                            >
                              <MessageCircle className="size-3" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-5 py-4">
                        {item.prioritas === "tinggi" ? (
                          <StatusBadge variant="rose">Tinggi (24h)</StatusBadge>
                        ) : item.prioritas === "sedang" ? (
                          <StatusBadge variant="amber">Sedang (48h)</StatusBadge>
                        ) : (
                          <StatusBadge variant="slate">Rendah (5h)</StatusBadge>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {item.status === "selesai" ? (
                          <StatusBadge variant="emerald" icon="check">
                            Selesai
                          </StatusBadge>
                        ) : item.status === "diproses" ? (
                          <StatusBadge variant="amber" icon="clock">
                            Diproses
                          </StatusBadge>
                        ) : (
                          <StatusBadge variant="rose" icon="alert">
                            Menunggu
                          </StatusBadge>
                        )}
                      </td>

                      {/* SLA Indicator */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span
                            className={`inline-flex items-center gap-1 w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              sla.status === "breached"
                                ? "bg-rose-100 text-rose-800 font-bold animate-pulse"
                                : sla.status === "warning"
                                ? "bg-amber-100 text-amber-800"
                                : sla.status === "completed_late"
                                ? "bg-slate-100 text-slate-600"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {sla.status === "breached" && <AlertTriangle className="size-3" />}
                            {sla.label}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">{sla.text}</span>
                        </div>
                      </td>

                      {/* Vendor / Staff */}
                      <td className="px-5 py-4">
                        {item.vendor ? (
                          <div className="text-xs">
                            <p className="font-semibold text-slate-900">{item.vendor.name}</p>
                            <p className="text-slate-400">{item.vendor.phone}</p>
                          </div>
                        ) : meta.assignedStaff ? (
                          <div className="text-xs">
                            <p className="font-semibold text-slate-900">{meta.assignedStaff}</p>
                            <span className="text-[10px] text-teal-700 bg-teal-50 px-1 rounded">
                              Staf Internal
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs italic text-slate-400">Belum ditugaskan</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetail(item)}
                          className="h-8 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Kelola &amp; Detail
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      ) : (
        <VendorManagementTab
          vendors={vendors as any}
          expenses={initialExpenses}
          onOpenTicketDetail={(ticketId) => {
            const found = items.find((i) => i.id === ticketId);
            if (found) {
              setDetailItem(found);
              setMainTab("tickets");
            }
          }}
        />
      )}


      {/* ── 360° Maintenance Detail Modal ───────────────────────────── */}
      <Dialog open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailItem && (() => {
            const sla = calculateTicketSLA(
              detailItem.createdAt,
              detailItem.prioritas,
              detailItem.status,
              detailItem.updatedAt
            );
            const meta = parseMaintenanceDescription(detailItem.deskripsi);

            return (
              <>
                <DialogHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                        #{detailItem.id.slice(-6).toUpperCase()}
                      </span>
                      <DialogTitle className="text-lg font-bold text-slate-900">
                        {detailItem.judul}
                      </DialogTitle>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={
                          detailItem.prioritas === "tinggi"
                            ? "border-rose-300 text-rose-700 bg-rose-50"
                            : detailItem.prioritas === "sedang"
                            ? "border-amber-300 text-amber-700 bg-amber-50"
                            : "border-slate-300 text-slate-700 bg-slate-50"
                        }
                      >
                        Prioritas: {detailItem.prioritas.toUpperCase()}
                      </Badge>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          sla.status === "breached"
                            ? "bg-rose-100 text-rose-800"
                            : sla.status === "warning"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {sla.label}
                      </span>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-5 text-sm py-2">
                  {/* Tenant & Room Info Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                    <div>
                      <p className="text-[11px] font-semibold uppercase text-slate-400">Unit Lokasi</p>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">
                        Kamar {detailItem.kamar?.nomor || "-"} • {detailItem.kamar?.properti?.nama || "Properti"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Dilaporkan: {new Date(detailItem.createdAt).toLocaleString("id-ID")}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase text-slate-400">Pelapor / Penyewa</p>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">
                        {detailItem.penghuni?.nama || "Penyewa"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-600">{detailItem.penghuni?.noHp || "-"}</span>
                        {detailItem.penghuni?.noHp && (
                          <a
                            href={`https://wa.me/${detailItem.penghuni.noHp.replace(
                              /\D/g,
                              ""
                            )}?text=${encodeURIComponent(
                              `Halo Sdr/i ${detailItem.penghuni.nama}, mengenai tiket keluhan pemeliharaan #${detailItem.id
                                .slice(-6)
                                .toUpperCase()} (${detailItem.judul}) di Kamar ${detailItem.kamar?.nomor || ""}...`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                          >
                            <MessageCircle className="size-3" />
                            WhatsApp Penyewa
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Problem Description & Photo */}
                  <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Deskripsi Masalah &amp; Kerusakan
                      </span>
                      <span className="rounded bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800">
                        Kategori: {detailItem.kategori}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {meta.cleanDescription}
                    </p>

                    {meta.reopenReason && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                        <span className="font-bold">Catatan Pembukaan Kembali: </span>
                        {meta.reopenReason}
                      </div>
                    )}

                    {/* Attached Photo */}
                    {detailItem.foto ? (
                      <div className="space-y-1.5 pt-2 border-t">
                        <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                          <ImageIcon className="size-3.5 text-slate-400" />
                          <span>Foto Bukti Keluhan:</span>
                        </p>
                        <div className="relative group w-48 h-32 rounded-lg overflow-hidden border border-slate-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={detailItem.foto}
                            alt="Bukti Keluhan"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setPhotoPreviewUrl(detailItem.foto)}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition"
                          >
                            <Eye className="size-4 mr-1" /> Perbesar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-slate-50 p-2 text-center text-xs text-slate-400 border border-dashed">
                        Tidak ada foto keluhan yang dilampirkan oleh penyewa.
                      </div>
                    )}
                  </div>

                  {/* Visual Operational Timeline */}
                  <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Alur Pengerjaan &amp; Linimasa
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      {/* Step 1 */}
                      <div
                        className={`rounded-lg p-2.5 text-center border ${
                          detailItem.status === "menunggu"
                            ? "border-teal-500 bg-teal-50 text-teal-900 font-bold"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1 text-xs">
                          <CheckCircle2 className="size-3.5 text-teal-600" />
                          <span>1. Dilaporkan</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(detailItem.createdAt).toLocaleDateString("id-ID")}
                        </p>
                      </div>

                      {/* Step 2 */}
                      <div
                        className={`rounded-lg p-2.5 text-center border ${
                          detailItem.status === "diproses"
                            ? "border-amber-500 bg-amber-50 text-amber-900 font-bold"
                            : detailItem.status === "selesai"
                            ? "border-slate-200 bg-slate-50 text-slate-600"
                            : "border-slate-200 bg-white text-slate-400"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1 text-xs">
                          <Wrench className="size-3.5 text-amber-600" />
                          <span>2. Dikerjakan</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {detailItem.vendor?.name || meta.assignedStaff || "Dalam proses"}
                        </p>
                      </div>

                      {/* Step 3 */}
                      <div
                        className={`rounded-lg p-2.5 text-center border ${
                          detailItem.status === "selesai"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold"
                            : "border-slate-200 bg-white text-slate-400"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1 text-xs">
                          <Check className="size-3.5 text-emerald-600" />
                          <span>3. Selesai &amp; Tutup</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {detailItem.status === "selesai"
                            ? new Date(detailItem.updatedAt).toLocaleDateString("id-ID")
                            : "Belum selesai"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Vendor & Technician Assignment Section */}
                  <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Penugasan Rekanan Vendor / Teknisi
                      </Label>
                      <button
                        type="button"
                        onClick={() => setAddVendorOpen(true)}
                        className="text-xs font-semibold text-teal-700 hover:underline"
                      >
                        + Tambah Rekanan Vendor
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <div className="flex-1 w-full">
                        <Select
                          value={detailItem.vendorId || "none"}
                          onValueChange={(val) =>
                            handleAssignVendor(detailItem.id, val === "none" ? null : val)
                          }
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Pilih vendor teknisi..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Belum ditugaskan (Lepas penugasan)</SelectItem>
                            {vendors.map((v) => (
                              <SelectItem key={v.id} value={v.id}>
                                {v.name} ({v.category} • {v.phone})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {detailItem.vendor && (
                        <a
                          href={`https://wa.me/${detailItem.vendor.phone.replace(
                            /\D/g,
                            ""
                          )}?text=${encodeURIComponent(
                            `Halo ${detailItem.vendor.name}, ada tugas perbaikan di Kamar ${detailItem.kamar?.nomor || ""} (${detailItem.kamar?.properti?.nama || ""}) mengenai "${detailItem.judul}". Mohon konfirmasi jadwal kunjungan teknisi.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                        >
                          <MessageCircle className="size-3.5" />
                          Hubungi Vendor
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Operational Status Action Bar */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Tindakan Status Operasional
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      {detailItem.status === "menunggu" && (
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleStatusChange(detailItem.id, "diproses")}
                          className="bg-amber-600 text-white hover:bg-amber-700 text-xs font-semibold"
                        >
                          <Wrench className="mr-1.5 size-3.5" />
                          Mulai Pengerjaan Langsung
                        </Button>
                      )}

                      {detailItem.status === "diproses" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setCompletionCost(meta.estimatedCost ? String(meta.estimatedCost) : "");
                            setExpenseNote(`Biaya perbaikan: ${detailItem.judul} (Kamar ${detailItem.kamar?.nomor || "-"})`);
                            setCompletionModalOpen(true);
                          }}
                          className="bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-semibold"
                        >
                          <CheckCircle2 className="mr-1.5 size-3.5" />
                          Selesaikan Perbaikan &amp; Catat Biaya
                        </Button>
                      )}

                      {detailItem.status === "selesai" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReopenModalOpen(true)}
                          className="border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-semibold"
                        >
                          <RotateCcw className="mr-1.5 size-3.5" />
                          Buka Kembali Tiket
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPrintWorkOrderOpen(true)}
                        className="border-slate-300 text-slate-700 hover:bg-white text-xs font-semibold ml-auto"
                      >
                        <Printer className="mr-1.5 size-3.5" />
                        Cetak SPK Kerja
                      </Button>
                    </div>
                  </div>
                </div>

                <DialogFooter className="border-t pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDetailItem(null)}
                  >
                    Tutup
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Completion & Expense Dialog ─────────────────────────────── */}
      <Dialog open={completionModalOpen} onOpenChange={setCompletionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-600" />
              <span>Konfirmasi Penyelesaian Perbaikan</span>
            </DialogTitle>
            <DialogDescription>
              Tandai tiket keluhan ini sebagai selesai dan catat realisasi biaya ke Buku Kas Pengeluaran.
            </DialogDescription>
          </DialogHeader>

          {detailItem && (
            <div className="space-y-4 py-2 text-sm">
              <div className="rounded-lg bg-slate-50 p-3 text-xs">
                <p className="font-bold text-slate-800">{detailItem.judul}</p>
                <p className="text-slate-500 mt-0.5">
                  Kamar {detailItem.kamar?.nomor} • {detailItem.kamar?.properti?.nama}
                </p>
              </div>

              <FormField
                label="Biaya Aktual Perbaikan"
                description="Nominal pengeluaran riil untuk material atau jasa teknisi"
              >
                {({ id }) => (
                  <CurrencyInput
                    id={id}
                    value={completionCost}
                    onChange={(val) => setCompletionCost(String(val))}
                    placeholder="0 jika tidak ada biaya operasional"
                  />
                )}
              </FormField>

              {Number(completionCost) > 0 && (
                <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                  <div className="space-y-1">
                    <Label htmlFor="compNote" className="text-xs text-slate-700">
                      Keterangan Buku Kas
                    </Label>
                    <Input
                      id="compNote"
                      value={expenseNote}
                      onChange={(e) => setExpenseNote(e.target.value)}
                      className="bg-white text-xs h-8 rounded-xl"
                    />
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={autoRecordExpense}
                      onChange={(e) => setAutoRecordExpense(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span>
                      Otomatis bukukan pengeluaran ini ke modul Keuangan &amp; Buku Kas
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompletionModalOpen(false)}
              className="rounded-xl border-slate-200"
            >
              Batal
            </Button>
            <SubmitButton
              size="sm"
              isPending={isPending}
              loadingText="Memproses..."
              onClick={() => {
                if (!detailItem) return;
                handleStatusChange(detailItem.id, "selesai", {
                  biaya: Number(completionCost) || 0,
                  catatPengeluaran: autoRecordExpense,
                  catatanBiaya: expenseNote,
                });
              }}
              className="bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-semibold"
            >
              Konfirmasi Selesai
            </SubmitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reopen Ticket Modal ─────────────────────────────────────── */}
      <Dialog open={reopenModalOpen} onOpenChange={setReopenModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="size-5 text-amber-600" />
              <span>Buka Kembali Tiket Pemeliharaan</span>
            </DialogTitle>
            <DialogDescription>
              Gunakan jika keluhan penyewa belum tuntas atau terjadi kerusakan berulang.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div className="space-y-1.5">
              <Label htmlFor="reopenReason">Alasan Pembukaan Kembali *</Label>
              <Textarea
                id="reopenReason"
                rows={3}
                placeholder="Contoh: AC masih menetes setelah 2 hari perbaikan..."
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setReopenModalOpen(false)}>
              Batal
            </Button>
            <Button
              size="sm"
              disabled={isPending}
              onClick={handleReopenTicket}
              className="bg-amber-600 text-white hover:bg-amber-700 text-xs font-semibold"
            >
              {isPending ? "Memproses..." : "Buka Kembali Tiket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create New Maintenance Ticket Modal (Batch 20 Form Standardization) ──── */}
      <Dialog
        open={createTicketOpen}
        onOpenChange={(open) => {
          if (!open) handleRequestCloseTicket();
          else setCreateTicketOpen(true);
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-5 text-teal-600" />
              <span>Buat Tiket Keluhan Baru</span>
            </DialogTitle>
            <DialogDescription>
              Catat laporan keluhan fasilitas dari penyewa atau inisiatif perawatan preventif pengelola.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Properti & Room Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Properti" required description="Pilih lokasi properti">
                {({ id }) => (
                  <Select
                    value={newTicket.propertiId}
                    onValueChange={(val) => {
                      setNewTicket((prev) => ({
                        ...prev,
                        propertiId: val ?? "",
                        kamarId: "",
                        penghuniId: "",
                      }));
                    }}
                  >
                    <SelectTrigger id={id} className="rounded-xl">
                      <SelectValue placeholder="Pilih Properti..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {propertiList.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>

              <FormField label="Kamar Unit" required description="Unit yang mengalami kendala">
                {({ id }) => (
                  <Select
                    value={newTicket.kamarId}
                    onValueChange={(val) => {
                      const selRoom = kamarList.find((k) => k.id === val);
                      const tenant = selRoom?.penghuni?.[0];
                      setNewTicket((prev) => ({
                        ...prev,
                        kamarId: val ?? "",
                        penghuniId: tenant?.id || prev.penghuniId,
                      }));
                    }}
                  >
                    <SelectTrigger id={id} className="rounded-xl">
                      <SelectValue placeholder="Pilih Unit Kamar..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {availableRoomsForCreate.map((k) => (
                        <SelectItem key={k.id} value={k.id}>
                          Kamar {k.nomor} ({k.properti?.nama || "Kost"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>
            </div>

            {/* Tenant Selection */}
            <FormField label="Penyewa Terkait" required description="Penyewa yang melaporkan keluhan">
              {({ id }) => (
                <Select
                  value={newTicket.penghuniId}
                  onValueChange={(val) => setNewTicket((prev) => ({ ...prev, penghuniId: val ?? "" }))}
                >
                  <SelectTrigger id={id} className="rounded-xl">
                    <SelectValue placeholder="Pilih Penyewa..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {penghuniList.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nama} ({p.noHp})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>

            {/* Judul & Kategori */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Judul Keluhan" required>
                {({ id }) => (
                  <Input
                    id={id}
                    placeholder="Contoh: AC kamar bocor & tidak dingin"
                    value={newTicket.judul}
                    onChange={(e) => setNewTicket((prev) => ({ ...prev, judul: e.target.value }))}
                    className="rounded-xl"
                  />
                )}
              </FormField>

              <FormField label="Kategori Masalah" required>
                {() => (
                  <Select
                    value={newTicket.kategori}
                    onValueChange={(val) => setNewTicket((prev) => ({ ...prev, kategori: val ?? "Lain-lain" }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Pemeliharaan AC">Pemeliharaan AC &amp; Pendingin</SelectItem>
                      <SelectItem value="Plumbing & Pompa Air">Plumbing &amp; Pompa Air</SelectItem>
                      <SelectItem value="Kelistrikan">Kelistrikan &amp; Saklar</SelectItem>
                      <SelectItem value="Bangunan & Sipil">Bangunan, Genteng &amp; Dinding</SelectItem>
                      <SelectItem value="Kunci & Pintu">Kunci, Pintu &amp; Jendela</SelectItem>
                      <SelectItem value="Sanitasi & Toilet">Sanitasi &amp; Toilet</SelectItem>
                      <SelectItem value="Internet & Wifi">Internet &amp; Wifi</SelectItem>
                      <SelectItem value="Lain-lain">Lain-lain</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </FormField>
            </div>

            {/* Prioritas & Estimasi Biaya */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Prioritas & Target SLA" required description="Menentukan tenggat penyelesaian">
                {() => (
                  <Select
                    value={newTicket.prioritas}
                    onValueChange={(val: any) => setNewTicket((prev) => ({ ...prev, prioritas: val }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="tinggi">Tinggi (Darurat • SLA 24 Jam)</SelectItem>
                      <SelectItem value="sedang">Sedang (Biasa • SLA 48 Jam)</SelectItem>
                      <SelectItem value="rendah">Rendah (Ringan • SLA 5 Hari)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </FormField>

              <FormField label="Estimasi Biaya" description="Prakiraan kebutuhan dana">
                {({ id }) => (
                  <CurrencyInput
                    id={id}
                    value={newTicket.estimasiBiaya}
                    onChange={(val) => setNewTicket((prev) => ({ ...prev, estimasiBiaya: String(val) }))}
                    placeholder="Contoh: 150.000"
                  />
                )}
              </FormField>
            </div>

            {/* Vendor & Assigned Staff */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Tugaskan Rekanan Vendor">
                {() => (
                  <Select
                    value={newTicket.vendorId || "none"}
                    onValueChange={(val) =>
                      setNewTicket((prev) => ({ ...prev, vendorId: val === "none" ? "" : (val ?? "") }))
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Pilih vendor..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="none">Belum Ditugaskan</SelectItem>
                      {vendors.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name} ({v.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>

              <FormField label="PIC Staf Internal">
                {() => (
                  <Select
                    value={newTicket.assignedStaff || "none"}
                    onValueChange={(val) =>
                      setNewTicket((prev) => ({ ...prev, assignedStaff: val === "none" ? "" : (val ?? "") }))
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Pilih staf internal..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="none">Tidak ada</SelectItem>
                      {teamMembers.map((m) => (
                        <SelectItem key={m.id} value={m.name}>
                          {m.name} ({m.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>
            </div>

            {/* Foto Attachment URL */}
            <FormField label="URL Foto Lampiran" description="Tautan foto kondisi kerusakan dari penyewa">
              {({ id }) => (
                <Input
                  id={id}
                  placeholder="https://images.unsplash.com/... atau URL foto"
                  value={newTicket.foto}
                  onChange={(e) => setNewTicket((prev) => ({ ...prev, foto: e.target.value }))}
                  className="rounded-xl"
                />
              )}
            </FormField>

            {/* Detail Deskripsi */}
            <FormField label="Rincian Masalah & Catatan Khusus" required>
              {({ id }) => (
                <Textarea
                  id={id}
                  rows={3}
                  placeholder="Jelaskan detail masalah, posisi kerusakan, waktu mulai rusak, dll."
                  value={newTicket.deskripsi}
                  onChange={(e) => setNewTicket((prev) => ({ ...prev, deskripsi: e.target.value }))}
                  className="rounded-xl text-xs"
                />
              )}
            </FormField>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestCloseTicket}
              disabled={isPending}
              className="rounded-xl border-slate-200"
            >
              Batal
            </Button>
            <SubmitButton
              size="sm"
              isPending={isPending}
              loadingText="Menyimpan..."
              onClick={handleCreateTicket}
              className="bg-emerald-700 text-white hover:bg-emerald-800"
            >
              Simpan &amp; Buat Tiket
            </SubmitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dirty Ticket Warning Dialog (Batch 20) ─────────────────── */}
      <UnsavedChangesDialog
        open={dirtyTicketConfirmOpen}
        onOpenChange={setDirtyTicketConfirmOpen}
        onConfirmDiscard={() => {
          setDirtyTicketConfirmOpen(false);
          setCreateTicketOpen(false);
        }}
      />

      {/* ── Add Vendor Modal ────────────────────────────────────────── */}
      <Dialog open={addVendorOpen} onOpenChange={setAddVendorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="size-5 text-teal-600" />
              <span>Daftarkan Rekanan Vendor / Teknisi</span>
            </DialogTitle>
            <DialogDescription>
              Catat database vendor teknisi, spesialisasi AC, pipa, kelistrikan, atau bangunan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div className="space-y-1.5">
              <Label className="text-xs">Nama Vendor / Toko / Teknisi *</Label>
              <Input
                placeholder="Contoh: Pak Joko Teknisi AC / CV Tirta Abadi"
                value={newVendor.name}
                onChange={(e) => setNewVendor((prev) => ({ ...prev, name: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Kategori Spesialisasi</Label>
                <Select
                  value={newVendor.category}
                  onValueChange={(val) => setNewVendor((prev) => ({ ...prev, category: val ?? "General" }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Teknisi AC">Teknisi AC &amp; Pendingin</SelectItem>
                    <SelectItem value="Plumbing & Pompa">Plumbing &amp; Saluran Air</SelectItem>
                    <SelectItem value="Kelistrikan">Kelistrikan</SelectItem>
                    <SelectItem value="Tukang Bangunan">Tukang Bangunan / Sipil</SelectItem>
                    <SelectItem value="Tukang Kunci">Kunci &amp; Pintu</SelectItem>
                    <SelectItem value="Cleaning Service">Cleaning &amp; Sampah</SelectItem>
                    <SelectItem value="General">Umum / General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Nomor Telepon / WhatsApp *</Label>
                <Input
                  placeholder="08123456789"
                  value={newVendor.phone}
                  onChange={(e) => setNewVendor((prev) => ({ ...prev, phone: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Alamat / Lokasi Bengkel</Label>
              <Input
                placeholder="Contoh: Jl. Kaliurang Km 5 No. 12"
                value={newVendor.address || ""}
                onChange={(e) => setNewVendor((prev) => ({ ...prev, address: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Catatan Layanan / Tarif Standar</Label>
              <Textarea
                rows={2}
                placeholder="Contoh: Cuci AC 75rb, garansi 1 bulan..."
                value={newVendor.notes || ""}
                onChange={(e) => setNewVendor((prev) => ({ ...prev, notes: e.target.value }))}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddVendorOpen(false)}>
              Batal
            </Button>
            <Button
              size="sm"
              disabled={isPending}
              onClick={handleSaveVendor}
              className="bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-semibold"
            >
              {isPending ? "Menyimpan..." : "Simpan Rekanan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Photo Preview Dialog ────────────────────────────────────── */}
      <Dialog open={!!photoPreviewUrl} onOpenChange={(open) => !open && setPhotoPreviewUrl(null)}>
        <DialogContent className="max-w-xl p-2 bg-black/95 border-none">
          {photoPreviewUrl && (
            <div className="relative flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreviewUrl}
                alt="Foto Keluhan Detail"
                className="max-h-[75vh] w-auto rounded object-contain"
              />
              <div className="mt-2 flex items-center justify-between w-full px-2 text-xs text-white">
                <span>Foto Keluhan Pemeliharaan</span>
                <a
                  href={photoPreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-teal-400 hover:underline"
                >
                  <ExternalLink className="size-3.5" /> Buka Tab Baru
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Printable SPK Work Order Modal ──────────────────────────── */}
      <Dialog open={printWorkOrderOpen} onOpenChange={setPrintWorkOrderOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="size-5 text-teal-600" />
              <span>Surat Perintah Kerja (SPK) Pemeliharaan</span>
            </DialogTitle>
          </DialogHeader>

          {detailItem && (
            <div className="space-y-4 py-2 text-xs text-slate-800 border p-4 rounded-xl bg-white">
              {/* Header */}
              <div className="border-b pb-3 text-center">
                <h2 className="text-base font-bold uppercase tracking-wider text-teal-900">
                  SURAT PERINTAH KERJA (SPK)
                </h2>
                <p className="text-[11px] text-slate-500">
                  KONTRAKIN PROPERTY OPERATING SYSTEM • NO: #SPK-{detailItem.id.slice(-6).toUpperCase()}
                </p>
              </div>

              {/* Specs Table */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-500">Properti / Unit:</span>
                  <p className="font-bold text-slate-900">
                    Kamar {detailItem.kamar?.nomor} ({detailItem.kamar?.properti?.nama || "-"})
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Penyewa &amp; Kontak:</span>
                  <p className="font-bold text-slate-900">
                    {detailItem.penghuni?.nama || "-"} ({detailItem.penghuni?.noHp || "-"})
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Vendor Teknisi:</span>
                  <p className="font-bold text-slate-900">
                    {detailItem.vendor?.name || "Belum ditugaskan"}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Tanggal Terbit:</span>
                  <p className="font-bold text-slate-900">
                    {new Date(detailItem.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
              </div>

              {/* Problem */}
              <div className="rounded-lg bg-slate-50 p-3 border">
                <span className="font-semibold text-slate-600">Rincian Perbaikan / Masalah:</span>
                <p className="font-bold text-slate-900 mt-0.5">{detailItem.judul}</p>
                <p className="mt-1 text-slate-700 whitespace-pre-wrap">{detailItem.deskripsi}</p>
              </div>

              {/* Signature Columns */}
              <div className="pt-6 grid grid-cols-2 text-center text-xs">
                <div>
                  <p className="text-slate-500">Teknisi / Pelaksana</p>
                  <div className="h-14"></div>
                  <p className="font-bold border-t border-slate-300 pt-1 w-32 mx-auto">
                    ( {detailItem.vendor?.name || "Teknisi"} )
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Pengelola Properti</p>
                  <div className="h-14"></div>
                  <p className="font-bold border-t border-slate-300 pt-1 w-32 mx-auto">
                    ( Manajemen )
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPrintWorkOrderOpen(false)}>
              Batal
            </Button>
            <Button
              size="sm"
              onClick={() => {
                window.print();
              }}
              className="bg-teal-700 text-white hover:bg-teal-800 text-xs font-semibold gap-1.5"
            >
              <Printer className="size-3.5" />
              Cetak Dokumen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
