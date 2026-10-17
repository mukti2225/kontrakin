"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Send,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  Sparkles,
  ExternalLink,
  History,
  FileText,
  Search,
  Copy,
  Check,
  RefreshCw,
  Phone,
  Filter,
  Eye,
  Download,
  X,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  RotateCcw,
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
import { toast } from "sonner";
import { formatRupiah } from "@/lib/utils";
import { STANDARD_TEMPLATES, renderTemplate } from "@/lib/communication/templates";
import {
  sendMessageAction,
  retryMessageAction,
  type SendMessageInput,
} from "./action";
import { exportToCSV } from "@/lib/utils/export-csv";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TenantRecipient {
  id: string;
  nama: string;
  noHp: string;
  kamarNomor: string;
  propertiNama: string;
  unpaidInvoice: {
    id: string;
    invoiceNumber: string;
    balanceDue: number;
    dueDate: string;
  } | null;
}

export interface CommunicationLog {
  id: string;
  recipientPhone: string;
  recipientName: string | null;
  channel: string;
  templateId: string | null;
  subject?: string | null;
  message: string;
  status: string;
  provider: string;
  providerMessageId?: string | null;
  sentAt: string;
  createdAt: string;
  metadata?: Record<string, any> | null;
  penghuni?: { id: string; nama: string; noHp: string } | null;
}

interface PesanClientProps {
  initialHistory: CommunicationLog[];
  recipients: TenantRecipient[];
}

export function PesanClient({ initialHistory, recipients }: PesanClientProps) {
  const router = useRouter();
  const [history, setHistory] = useState<CommunicationLog[]>(initialHistory);
  const [activeTab, setActiveTab] = useState<"send" | "history" | "timeline">("send");
  const [isPending, startTransition] = useTransition();

  // Form State
  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    recipients[0]?.id || ""
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("reminder_due");
  const [customMessage, setCustomMessage] = useState<string>("");
  const [manualPhone, setManualPhone] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Filter & Search History State
  const [historySearch, setHistorySearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");

  // Selected Log for Detail Modal
  const [selectedLog, setSelectedLog] = useState<CommunicationLog | null>(null);

  // Tenant Timeline Selection State
  const [timelineTenantId, setTimelineTenantId] = useState<string>(
    recipients[0]?.id || ""
  );

  const selectedTenant = useMemo(
    () => recipients.find((r) => r.id === selectedTenantId),
    [recipients, selectedTenantId]
  );

  const timelineTenant = useMemo(
    () => recipients.find((r) => r.id === timelineTenantId),
    [recipients, timelineTenantId]
  );

  // Auto-fill template variables when tenant or template changes
  const computedMessage = useMemo(() => {
    if (selectedTemplateId === "custom") {
      return customMessage;
    }

    const tpl = STANDARD_TEMPLATES[selectedTemplateId];
    if (!tpl) return customMessage;

    const tenantName = selectedTenant ? selectedTenant.nama : "[Nama Penyewa]";
    const roomNum = selectedTenant ? selectedTenant.kamarNomor : "[Nomor Kamar]";
    const propName = selectedTenant ? selectedTenant.propertiNama : "[Nama Properti]";

    let invTotal = "Rp 0";
    let invBal = "Rp 0";
    let invNum = "INV-XXXX";
    let dueDateStr = "5 tiap bulan";

    if (selectedTenant?.unpaidInvoice) {
      invTotal = formatRupiah(selectedTenant.unpaidInvoice.balanceDue);
      invBal = formatRupiah(selectedTenant.unpaidInvoice.balanceDue);
      invNum = selectedTenant.unpaidInvoice.invoiceNumber;
      const d = new Date(selectedTenant.unpaidInvoice.dueDate);
      dueDateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    }

    const vars: Record<string, string> = {
      nama_penyewa: tenantName,
      nama_properti: propName,
      nomor_kamar: roomNum,
      total_tagihan: invTotal,
      sisa_tagihan: invBal,
      nominal_bayar: invTotal,
      nomor_tagihan: invNum,
      jatuh_tempo: dueDateStr,
      tanggal_bayar: new Date().toLocaleDateString("id-ID"),
      isi_pengumuman: "Diharapkan selalu menjaga kebersihan dan ketertiban fasilitas bersama.",
    };

    return renderTemplate(tpl.defaultContent, vars);
  }, [selectedTemplateId, selectedTenant, customMessage]);

  // Overall Stats
  const stats = useMemo(() => {
    const deliveredCount = history.filter(
      (h) => h.status === "delivered" || h.status === "sent"
    ).length;
    const failedCount = history.filter((h) => h.status === "failed").length;
    const pendingCount = history.filter((h) => h.status === "pending").length;

    return {
      total: history.length,
      deliveredCount,
      failedCount,
      pendingCount,
      recipientCount: recipients.length,
    };
  }, [history, recipients]);

  // Messages for Timeline Tenant
  const tenantTimelineMessages = useMemo(() => {
    if (!timelineTenantId) return [];
    return history.filter(
      (h) =>
        h.penghuni?.id === timelineTenantId ||
        (timelineTenant && h.recipientPhone === timelineTenant.noHp)
    );
  }, [history, timelineTenantId, timelineTenant]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase();

    return history.filter((h) => {
      if (statusFilter !== "all" && h.status !== statusFilter) return false;
      if (channelFilter !== "all" && h.channel !== channelFilter) return false;

      if (!q) return true;
      const phoneMatch = h.recipientPhone.toLowerCase().includes(q);
      const nameMatch = (h.recipientName || h.penghuni?.nama || "").toLowerCase().includes(q);
      const msgMatch = h.message.toLowerCase().includes(q);
      const templateMatch = (h.templateId || "").toLowerCase().includes(q);

      return phoneMatch || nameMatch || msgMatch || templateMatch;
    });
  }, [history, historySearch, statusFilter, channelFilter]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleSend(provider: "direct" | "fonnte") {
    const phone = selectedTenant ? selectedTenant.noHp : manualPhone.trim();
    if (!phone) {
      toast.error("Nomor WhatsApp penerima wajib diisi");
      return;
    }

    const msgToSend = customMessage.trim() || computedMessage;
    if (!msgToSend.trim()) {
      toast.error("Isi pesan tidak boleh kosong");
      return;
    }

    startTransition(async () => {
      try {
        const payload: SendMessageInput = {
          penghuniId: selectedTenant ? selectedTenant.id : undefined,
          recipientPhone: phone,
          recipientName: selectedTenant?.nama || "Penyewa",
          templateId: selectedTemplateId === "custom" ? undefined : selectedTemplateId,
          customMessage: msgToSend,
          providerName: provider,
        };

        const result = await sendMessageAction(payload);

        if (result.directUrl) {
          window.open(result.directUrl, "_blank");
          toast.success("WhatsApp dibuka! Pesan berhasil dicatat ke Riwayat Outbound.");
        } else {
          toast.success("Pesan berhasil dikirim via Gateway API!");
        }

        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Gagal mengirim pesan");
      }
    });
  }

  function handleRetry(log: CommunicationLog) {
    startTransition(async () => {
      try {
        const res = await retryMessageAction(log.id);
        if (res.directUrl) {
          window.open(res.directUrl, "_blank");
          toast.success("Pengiriman ulang via WhatsApp dibuka!");
        } else {
          toast.success("Pengiriman ulang berhasil diproses!");
        }
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Gagal mengirim ulang pesan");
      }
    });
  }

  function handleCopyMessage() {
    const textToCopy = customMessage.trim() || computedMessage;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Pesan disalin ke clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  function insertVariable(varName: string) {
    const placeholder = `{{${varName}}}`;
    setCustomMessage((prev) => (prev ? `${prev} ${placeholder}` : placeholder));
  }

  function handleExportCSV() {
    const headers = [
      "ID Pesan",
      "Waktu Kirim",
      "Penerima",
      "Nomor HP",
      "Channel",
      "Template",
      "Provider",
      "Status",
      "Isi Pesan",
    ];
    const rows = filteredHistory.map((h) => [
      h.id,
      h.sentAt,
      h.recipientName || h.penghuni?.nama || "-",
      h.recipientPhone,
      h.channel,
      h.templateId || "Custom",
      h.provider,
      h.status,
      h.message.replace(/\n/g, " "),
    ]);
    exportToCSV("riwayat_komunikasi_outbound", headers, rows);
    toast.success("Riwayat pesan berhasil diekspor ke CSV");
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Pusat Komunikasi &amp; WhatsApp
            </h1>
            <Badge variant="outline" className="border-teal-300 bg-teal-50 text-teal-800">
              Outbound &amp; Templates
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Kirim pengingat sewa tepat waktu, kwitansi pelunasan, pengumuman fasilitas, dan pantau linimasa komunikasi penyewa.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab("send")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === "send"
                ? "bg-white text-teal-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Send className="size-3.5" />
            <span>Kirim Pesan</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === "history"
                ? "bg-white text-teal-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <History className="size-3.5" />
            <span>Riwayat Outbound ({history.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === "timeline"
                ? "bg-white text-teal-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="size-3.5" />
            <span>Linimasa Penyewa</span>
          </button>
        </div>
      </div>

      {/* ── KPI Action Center Stat Cards ────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Pesan Terkirim */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-500">Total Pesan Terkirim</p>
            <div className="rounded-xl bg-teal-50 p-2 text-teal-700">
              <MessageSquare className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.total}</p>
          <p className="mt-1 text-xs text-slate-400">Tercatat dalam audit trail log</p>
        </div>

        {/* Berhasil Tersampaikan */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-500">Tersampaikan (Delivered)</p>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {stats.deliveredCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">WhatsApp &amp; gateway terkonfirmasi</p>
        </div>

        {/* Gagal Kirim / Perlu Retry */}
        <div
          onClick={() => {
            if (stats.failedCount > 0) {
              setActiveTab("history");
              setStatusFilter("failed");
            }
          }}
          className={`rounded-2xl border p-5 shadow-sm transition ${
            stats.failedCount > 0
              ? "border-rose-300 bg-rose-50/50 cursor-pointer hover:shadow-md"
              : "border-slate-100 bg-white"
          }`}
        >
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-500">Gagal Kirim (Failed)</p>
            <div
              className={`rounded-xl p-2 ${
                stats.failedCount > 0 ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-400"
              }`}
            >
              <AlertTriangle className="size-5" />
            </div>
          </div>
          <p
            className={`mt-2 text-3xl font-bold ${
              stats.failedCount > 0 ? "text-rose-600" : "text-slate-800"
            }`}
          >
            {stats.failedCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {stats.failedCount > 0 ? "Klik untuk tinjau & kirim ulang" : "Semua pesan lancar"}
          </p>
        </div>

        {/* Kontak Penyewa Aktif */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-500">Penyewa Siap Dihubungi</p>
            <div className="rounded-xl bg-teal-50 p-2 text-teal-700">
              <Users className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.recipientCount}</p>
          <p className="mt-1 text-xs text-slate-400">Kontak valid dengan nomor telepon</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 1: KIRIM PESAN & TEMPLATE PREVIEW                         */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === "send" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          {/* ── Left: Composer ────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">Format &amp; Penerima Pesan</h2>
              <span className="text-xs text-slate-400">Channel: WhatsApp &amp; SMS</span>
            </div>

            {/* Recipient Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Pilih Penerima (Penyewa) *
              </Label>
              <Select
                value={selectedTenantId}
                onValueChange={(val) => {
                  setSelectedTenantId(val ?? "");
                  setCustomMessage("");
                }}
              >
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Pilih penyewa atau masukkan nomor manual..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- Input Nomor Manual --</SelectItem>
                  {recipients.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nama} • Kamar {t.kamarNomor} ({t.propertiNama}) • {t.noHp}
                      {t.unpaidInvoice ? ` [Tagihan ${formatRupiah(t.unpaidInvoice.balanceDue)}]` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!selectedTenantId && (
                <div className="mt-2 space-y-1">
                  <Label className="text-xs text-slate-500">Nomor WhatsApp Manual</Label>
                  <Input
                    placeholder="Contoh: 081234567890"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              )}
            </div>

            {/* Template Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">
                Pilih Template Pesan WhatsApp
              </Label>

              {/* Template Category Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "reminder_h5", label: "📅 Pengingat H-5", desc: "Ramah awal waktu" },
                  { id: "reminder_h1", label: "⏰ Pengingat H-1", desc: "Besok jatuh tempo" },
                  { id: "reminder_due", label: "🔔 Batas Hari H", desc: "Jatuh tempo hari ini" },
                  { id: "overdue_h1", label: "⚠️ Tertunggak", desc: "Lewat batas tempo" },
                  { id: "receipt_paid", label: "✅ Kwitansi Lunas", desc: "Bukti pembayaran" },
                  { id: "announcement", label: "📢 Pengumuman", desc: "Broadcast kos" },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplateId(tpl.id);
                      setCustomMessage("");
                    }}
                    className={`rounded-xl p-2.5 text-left border transition ${
                      selectedTemplateId === tpl.id
                        ? "border-teal-600 bg-teal-50/80 ring-1 ring-teal-500 text-teal-900"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <p className="text-xs font-bold">{tpl.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{tpl.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Clickable Variable Insertion Chips */}
            <div className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-500">
                  Klik untuk Sisipkan Variabel Otomatis:
                </span>
                <span className="text-[10px] text-slate-400">Otomatis digantikan data penyewa</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {[
                  { tag: "nama_penyewa", label: "{{nama_penyewa}}" },
                  { tag: "nomor_kamar", label: "{{nomor_kamar}}" },
                  { tag: "nama_properti", label: "{{nama_properti}}" },
                  { tag: "total_tagihan", label: "{{total_tagihan}}" },
                  { tag: "sisa_tagihan", label: "{{sisa_tagihan}}" },
                  { tag: "jatuh_tempo", label: "{{jatuh_tempo}}" },
                  { tag: "nomor_tagihan", label: "{{nomor_tagihan}}" },
                ].map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => insertVariable(v.tag)}
                    className="rounded bg-white px-2 py-0.5 text-[11px] font-mono font-medium text-teal-800 border border-slate-200 hover:border-teal-400 hover:bg-teal-50 transition"
                  >
                    + {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Body Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700">
                  Isi Pesan WhatsApp
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">
                    Format: *tebal*, _miring_
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:underline"
                  >
                    {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                    <span>{copied ? "Tersalin" : "Salin Pesan"}</span>
                  </button>
                </div>
              </div>
              <Textarea
                rows={7}
                value={customMessage || computedMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="font-mono text-xs leading-relaxed"
                placeholder="Tulis pesan khusus Anda..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
              <div className="text-xs text-slate-500">
                Penerima: <strong className="text-slate-900">{selectedTenant ? selectedTenant.nama : manualPhone || "-"}</strong>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleSend("direct")}
                  disabled={isPending}
                  className="gap-2 bg-emerald-600 font-semibold text-white hover:bg-emerald-700 shadow-sm text-xs"
                >
                  <ExternalLink className="size-4" />
                  <span>Kirim via WhatsApp (1-Tap Langsung)</span>
                </Button>
              </div>
            </div>
          </div>

          {/* ── Right: Live WhatsApp Phone Preview ────────────────── */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-900 p-5 text-white shadow-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-sm font-bold tracking-wide">Live WhatsApp Preview</h3>
                </div>
                <Smartphone className="size-4 text-slate-400" />
              </div>

              {/* Chat Bubble Simulation */}
              <div className="mt-4 rounded-xl bg-slate-800 p-4 shadow-inner">
                <div className="rounded-lg bg-emerald-950/80 p-3.5 text-xs leading-relaxed text-emerald-100 border border-emerald-800/50 shadow">
                  <pre className="font-sans whitespace-pre-wrap">
                    {customMessage || computedMessage}
                  </pre>
                  <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-emerald-400/80">
                    <span>{new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="font-bold text-teal-300">✓✓</span>
                  </div>
                </div>
              </div>

              {/* Live detected variables strip */}
              <div className="mt-4 rounded-lg bg-white/5 p-3 text-xs text-slate-300 space-y-1.5 border border-white/5">
                <p className="font-bold text-white text-[11px] uppercase tracking-wider">
                  Variabel Aktif:
                </p>
                <div className="space-y-1 text-slate-300 text-xs">
                  <p>• Penyewa: <strong className="text-white">{selectedTenant ? selectedTenant.nama : "Belum dipilih"}</strong></p>
                  <p>• Kamar: <strong className="text-white">{selectedTenant ? `Kamar ${selectedTenant.kamarNomor} (${selectedTenant.propertiNama})` : "-"}</strong></p>
                  <p>• No HP: <strong className="text-white">{selectedTenant ? selectedTenant.noHp : manualPhone || "-"}</strong></p>
                  <p>• Sisa Tagihan: <strong className="text-emerald-400">{selectedTenant?.unpaidInvoice ? formatRupiah(selectedTenant.unpaidInvoice.balanceDue) : "Rp 0"}</strong></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 2: AUDIT TRAIL RIWAYAT OUTBOUND                         */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {/* History Filter Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Cari penerima, telepon, pesan..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-9 text-xs sm:text-sm h-9"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? "all")}>
                <SelectTrigger className="h-9 w-40 text-xs bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="sent">Terkirim (Sent)</SelectItem>
                  <SelectItem value="delivered">Tersampaikan (Delivered)</SelectItem>
                  <SelectItem value="failed">Gagal Kirim (Failed)</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              {/* Channel Filter */}
              <Select value={channelFilter} onValueChange={(val) => setChannelFilter(val ?? "all")}>
                <SelectTrigger className="h-9 w-36 text-xs bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Semua Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Channel</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>

              {(historySearch || statusFilter !== "all" || channelFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setHistorySearch("");
                    setStatusFilter("all");
                    setChannelFilter("all");
                  }}
                  className="h-8 text-xs text-rose-600 hover:bg-rose-50"
                >
                  <X className="mr-1 size-3.5" />
                  Reset
                </Button>
              )}
            </div>

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

          {/* History Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Waktu Kirim</th>
                    <th className="px-5 py-3.5">Penerima &amp; Nomor</th>
                    <th className="px-5 py-3.5">Template</th>
                    <th className="px-5 py-3.5">Ringkasan Pesan</th>
                    <th className="px-5 py-3.5">Channel / Provider</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-14 text-center">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <MessageSquare className="size-6" />
                        </div>
                        {history.length === 0 ? (
                          <>
                            <p className="mt-3 text-base font-semibold text-slate-800">
                              Belum ada riwayat pesan outbound
                            </p>
                            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                              Pesan pengingat tagihan dan kwitansi sewa yang dikirimkan akan otomatis tercatat lengkap di sini.
                            </p>
                            <div className="mt-4 flex items-center justify-center">
                              <Button
                                size="sm"
                                onClick={() => setActiveTab("send")}
                                className="rounded-xl bg-teal-700 text-xs font-semibold text-white hover:bg-teal-800 shadow-sm"
                              >
                                <Send className="mr-1.5 size-3.5" />
                                Kirim Pesan Pertama
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="mt-3 text-base font-semibold text-slate-800">
                              Tidak ada riwayat yang cocok
                            </p>
                            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                              Tidak ada pesan yang cocok dengan kriteria filter Anda.
                            </p>
                            <div className="mt-4 flex items-center justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setHistorySearch("");
                                  setStatusFilter("all");
                                  setChannelFilter("all");
                                }}
                                className="rounded-xl border-slate-200 text-xs text-slate-700 hover:bg-slate-50"
                              >
                                Reset Filter
                              </Button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((h) => {
                      const d = new Date(h.sentAt);
                      const formattedDate = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;

                      const isFailed = h.status === "failed";
                      const isDelivered = h.status === "delivered" || h.status === "sent";

                      return (
                        <tr
                          key={h.id}
                          className={`transition hover:bg-slate-50/60 ${
                            isFailed ? "bg-rose-50/20" : ""
                          }`}
                        >
                          <td className="px-5 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                            {formattedDate}
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900">
                              {h.recipientName || h.penghuni?.nama || "Penyewa"}
                            </p>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                              {h.recipientPhone}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-xs">
                            <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                              {h.templateId || "Pesan Kustom"}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-700 max-w-xs">
                            <p className="truncate font-sans">{h.message}</p>
                          </td>

                          <td className="px-5 py-4 text-xs">
                            <p className="font-semibold uppercase text-slate-800">
                              {h.channel}
                            </p>
                            <span className="text-[10px] text-slate-400">{h.provider}</span>
                          </td>

                          <td className="px-5 py-4">
                            {isDelivered ? (
                              <StatusBadge variant="emerald" icon="check">
                                {h.status === "delivered" ? "Tersampaikan" : "Terkirim"}
                              </StatusBadge>
                            ) : isFailed ? (
                              <StatusBadge variant="rose" icon="alert">
                                Gagal Kirim
                              </StatusBadge>
                            ) : (
                              <StatusBadge variant="amber" icon="clock">
                                Pending
                              </StatusBadge>
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isFailed && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isPending}
                                  onClick={() => handleRetry(h)}
                                  className="h-8 border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold gap-1"
                                  title="Kirim Ulang Pesan"
                                >
                                  <RotateCcw className="size-3" />
                                  <span>Retry</span>
                                </Button>
                              )}

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedLog(h)}
                                className="h-8 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                Detail
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 3: LINIMASA KOMUNIKASI PENYEWA                            */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === "timeline" && (
        <div className="space-y-6">
          {/* Tenant Selector Strip */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Linimasa Komunikasi Spesifik Penyewa
                </h2>
                <p className="text-xs text-slate-500">
                  Lihat seluruh jejak pesan pengingat tagihan dan notifikasi yang pernah diterima penyewa terpilih.
                </p>
              </div>

              <div className="w-full sm:w-80">
                <Select
                  value={timelineTenantId}
                  onValueChange={(val) => setTimelineTenantId(val ?? "")}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih penyewa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {recipients.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nama} (Kamar {t.kamarNomor} • {t.propertiNama})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {timelineTenant && (
              <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 p-3 text-xs border border-slate-200/80">
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Penyewa:</span>
                  <p className="font-bold text-slate-900">{timelineTenant.nama}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Kamar:</span>
                  <p className="font-bold text-slate-900">
                    Kamar {timelineTenant.kamarNomor} ({timelineTenant.propertiNama})
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">WhatsApp:</span>
                  <p className="font-bold text-slate-900">{timelineTenant.noHp}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Status Tagihan:</span>
                  <p className="font-bold text-emerald-700">
                    {timelineTenant.unpaidInvoice
                      ? `Tertunggak ${formatRupiah(timelineTenant.unpaidInvoice.balanceDue)}`
                      : "Lunas / Tidak Ada Tunggakan"}
                  </p>
                </div>

                <a
                  href={`https://wa.me/${timelineTenant.noHp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                >
                  <ExternalLink className="size-3.5" />
                  Buka Chat WhatsApp
                </a>
              </div>
            )}
          </div>

          {/* Timeline Stream */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6">
              Jejak Linimasa Pesan Terkirim ({tenantTimelineMessages.length})
            </h3>

            {tenantTimelineMessages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                Belum ada pesan yang pernah dikirimkan kepada penyewa ini.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {tenantTimelineMessages.map((msg) => {
                  const d = new Date(msg.sentAt);
                  const isDelivered = msg.status === "delivered" || msg.status === "sent";

                  return (
                    <div key={msg.id} className="relative">
                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-6 top-1.5 size-3 rounded-full border-2 border-white ring-2 ${
                          isDelivered ? "bg-emerald-500 ring-emerald-200" : "bg-rose-500 ring-rose-200"
                        }`}
                      />

                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-2 hover:bg-slate-50 transition">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">
                              {msg.templateId ? STANDARD_TEMPLATES[msg.templateId]?.name || msg.templateId : "Pesan Kustom"}
                            </span>
                            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 uppercase">
                              {msg.channel}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>{d.toLocaleDateString("id-ID")} {d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                            {isDelivered ? (
                              <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-0.5">
                                <Check className="size-3" /> Terkirim
                              </span>
                            ) : (
                              <span className="text-rose-600 font-semibold text-[11px] flex items-center gap-0.5">
                                <AlertTriangle className="size-3" /> Gagal
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Message Detail Modal ────────────────────────────────────── */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="size-5 text-teal-600" />
              <span>Rincian Pesan Outbound</span>
            </DialogTitle>
            <DialogDescription>
              Detail audit pengiriman pesan dan status delivery.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 py-2 text-xs text-slate-800">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 border">
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Penerima:</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {selectedLog.recipientName || selectedLog.penghuni?.nama || "Penyewa"}
                  </p>
                  <p className="text-slate-500 font-mono text-[11px]">{selectedLog.recipientPhone}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Waktu Kirim:</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {new Date(selectedLog.sentAt).toLocaleString("id-ID")}
                  </p>
                  <p className="text-slate-500 text-[11px]">Provider: {selectedLog.provider}</p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500">Isi Pesan Terkirim:</span>
                <div className="rounded-xl border bg-slate-50/70 p-3 leading-relaxed whitespace-pre-wrap font-sans text-slate-800">
                  {selectedLog.message}
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-500">Status:</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      selectedLog.status === "failed"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {selectedLog.status.toUpperCase()}
                  </span>
                </div>

                {selectedLog.status === "failed" && (
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleRetry(selectedLog)}
                    className="bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold gap-1"
                  >
                    <RotateCcw className="size-3" />
                    Kirim Ulang (Retry)
                  </Button>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
