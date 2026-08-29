"use client";

import { useState } from "react";
import {
  ChevronDown,
  Plus,
  Home,
  MapPin,
  DoorOpen,
  Users,
  Bed,
  Wrench,
  Edit,
  Trash,
} from "lucide-react";
import type { Properti, Kamar, Penghuni } from "@/lib/generated/prisma/client";

import { KamarClient } from "../kamar/kamar-client";
import { FormProperti } from "./form-properti";
import { deleteProperti } from "./actions";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

type KamarDenganPenghuni = Kamar & { penghuni: Penghuni[] };
type PropertiDenganKamar = Properti & { kamar: KamarDenganPenghuni[] };
type KamarWithProperti = Kamar & {
  penghuni: Penghuni[];
  properti: { id: string; nama: string } | null;
};

interface Props {
  propertiData: PropertiDenganKamar[];
  kamarData: KamarWithProperti[];
  penghuniOptions: Penghuni[];
}

// ─── Properti stats mini card ─────────────────────────────────────────────────

function PropertiStatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[40px]">
      <span className={`text-sm font-bold ${color}`}>{value}</span>
      <span className="text-[10px] text-slate-500">{label}</span>
    </div>
  );
}

// ─── Properti selector dropdown item ─────────────────────────────────────────

function PropertiOption({
  properti,
  isSelected,
  onSelect,
}: {
  properti: PropertiDenganKamar;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const total = properti.kamar.length;
  const terisi = properti.kamar.filter((k) => k.status === "terisi").length;
  const kosong = properti.kamar.filter((k) => k.status === "kosong").length;

  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
        isSelected
          ? "bg-teal-50 ring-1 ring-teal-300"
          : "hover:bg-slate-50"
      }`}
    >
      {/* Icon */}
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${isSelected ? "bg-teal-600" : "bg-slate-100"}`}>
        <Home className={`size-4 ${isSelected ? "text-white" : "text-slate-500"}`} />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold ${isSelected ? "text-teal-700" : "text-slate-800"}`}>
          {properti.nama}
        </p>
        <p className="flex items-center gap-1 truncate text-xs text-slate-500">
          <MapPin className="size-3" />
          {properti.alamat}
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 divide-x divide-slate-200">
        <PropertiStatBadge label="Total" value={total} color="text-slate-700" />
        <div className="pl-3">
          <PropertiStatBadge label="Terisi" value={terisi} color="text-teal-600" />
        </div>
        <div className="pl-3">
          <PropertiStatBadge label="Kosong" value={kosong} color="text-emerald-600" />
        </div>
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PropertiKamarClient({ propertiData, kamarData, penghuniOptions }: Props) {
  const [selectedPropertiId, setSelectedPropertiId] = useState<string | null>(
    propertiData[0]?.id ?? null
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [formAddOpen, setFormAddOpen] = useState(false);
  const [editingProperti, setEditingProperti] = useState<PropertiDenganKamar | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PropertiDenganKamar | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const propertiOptions = propertiData.map((p) => ({ id: p.id, nama: p.nama }));
  const activeProperti = propertiData.find((p) => p.id === selectedPropertiId);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteProperti(deleteTarget.id);
      toast.success("Properti berhasil dihapus");
      setDeleteTarget(null);
      // If deleted properti was selected, select the first remaining one
      if (deleteTarget.id === selectedPropertiId) {
        const remaining = propertiData.filter((p) => p.id !== deleteTarget.id);
        setSelectedPropertiId(remaining[0]?.id ?? null);
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus properti");
    } finally {
      setIsDeleting(false);
    }
  };

  // Empty state — no properties yet
  if (propertiData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center px-4">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-100">
          <Home className="size-8 text-slate-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Belum ada properti</h2>
          <p className="mt-1 text-sm text-slate-500">
            Tambahkan properti pertama Anda untuk mulai mengelola unit/kamar.
          </p>
        </div>
        <button
          onClick={() => setFormAddOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
        >
          <Plus className="size-4" />
          Tambah Properti
        </button>
        <FormProperti open={formAddOpen} setOpen={setFormAddOpen} />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* ── Property Selector Bar ────────────────────────────────── */}
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          {/* Left: dropdown trigger */}
          <div className="relative flex-1 max-w-sm">
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <span className="flex items-center gap-2 truncate">
                <Home className="size-4 shrink-0 text-teal-600" />
                <span className="truncate">{activeProperti?.nama ?? "Pilih Properti"}</span>
              </span>
              <ChevronDown className={`size-4 shrink-0 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute left-0 top-full z-20 mt-1 w-[480px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                  <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Pilih Properti
                  </p>
                  <div className="space-y-1">
                    {propertiData.map((p) => (
                      <PropertiOption
                        key={p.id}
                        properti={p}
                        isSelected={p.id === selectedPropertiId}
                        onSelect={() => {
                          setSelectedPropertiId(p.id);
                          setDropdownOpen(false);
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 border-t border-slate-100 pt-2">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setFormAddOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-teal-600 transition hover:bg-teal-50"
                    >
                      <Plus className="size-4" />
                      Tambah Properti Baru
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right: properti actions */}
          {activeProperti && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingProperti(activeProperti)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
              >
                <Edit className="size-3.5" />
                <span className="hidden sm:inline">Edit Properti</span>
              </button>
              <button
                onClick={() => setDeleteTarget(activeProperti)}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 shadow-sm transition hover:bg-red-100"
              >
                <Trash className="size-3.5" />
                <span className="hidden sm:inline">Hapus</span>
              </button>
            </div>
          )}

          {/* Add properti form */}
          <button
            onClick={() => setFormAddOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Properti Baru</span>
          </button>
        </div>

        {/* Properti meta info row */}
        {activeProperti && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {activeProperti.alamat}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
              {activeProperti.tipe}
            </span>
            {activeProperti.fasilitas && (
              <span className="truncate max-w-xs">{activeProperti.fasilitas}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Kamar Grid (filtered by selected properti) ────────────── */}
      <KamarClient
        initialRooms={kamarData}
        penghuniOptions={penghuniOptions}
        propertiOptions={propertiOptions}
        selectedPropertiId={selectedPropertiId}
      />

      {/* ── Form Tambah Properti ──────────────────────────────────── */}
      <FormProperti open={formAddOpen} setOpen={setFormAddOpen} />

      {/* ── Form Edit Properti ────────────────────────────────────── */}
      {editingProperti && (
        <FormProperti
          properti={editingProperti}
          open={!!editingProperti}
          setOpen={(open) => !open && setEditingProperti(null)}
        />
      )}

      {/* ── Konfirmasi Hapus Properti ─────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus properti "{deleteTarget?.nama}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Properti ini akan dihapus secara permanen. Semua unit/kamar yang terhubung akan
              kehilangan relasinya (tidak terhapus). Pastikan tidak ada penghuni aktif.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
