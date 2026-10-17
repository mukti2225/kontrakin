"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Building2,
  BedDouble,
  Users,
  FileText,
  Wallet,
  Wrench,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  Settings,
  PlusCircle,
  ArrowRight,
  Command,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "Navigasi Menu" | "Aksi Cepat";
  href: string;
  icon: React.ElementType;
}

const COMMANDS: CommandItem[] = [
  // ── Menu Navigation
  {
    id: "nav-dashboard",
    title: "Ringkasan Operasional",
    subtitle: "KPI okupansi, proyeksi sewa, dan alert prioritas",
    category: "Navigasi Menu",
    href: "/dashboard/owner",
    icon: LayoutDashboard,
  },
  {
    id: "nav-properti",
    title: "Properti & Gedung",
    subtitle: "Daftar bangunan kos, kontrakan, dan fasilitas",
    category: "Navigasi Menu",
    href: "/dashboard/owner/properti",
    icon: Building2,
  },
  {
    id: "nav-kamar",
    title: "Unit Kamar",
    subtitle: "Inventaris kamar, status keterisian, dan tarif",
    category: "Navigasi Menu",
    href: "/dashboard/owner/kamar",
    icon: BedDouble,
  },
  {
    id: "nav-penghuni",
    title: "Manajemen Penyewa",
    subtitle: "Data penyewa aktif, nomor WhatsApp, dan histori",
    category: "Navigasi Menu",
    href: "/dashboard/owner/penghuni",
    icon: Users,
  },
  {
    id: "nav-kontrak",
    title: "Kontrak Sewa",
    subtitle: "Perjanjian sewa, tanggal jatuh tempo, dan deposit",
    category: "Navigasi Menu",
    href: "/dashboard/owner/kontrak",
    icon: FileText,
  },
  {
    id: "nav-keuangan",
    title: "Keuangan & Buku Kas",
    subtitle: "Tagihan berkala, arus kas masuk/keluar, dan rekonsiliasi",
    category: "Navigasi Menu",
    href: "/dashboard/owner/keuangan",
    icon: Wallet,
  },
  {
    id: "nav-pemeliharaan",
    title: "Pemeliharaan & Vendor",
    subtitle: "Tiket kerusakan unit dan penugasan teknisi",
    category: "Navigasi Menu",
    href: "/dashboard/owner/pemeliharaan",
    icon: Wrench,
  },
  {
    id: "nav-pesan",
    title: "Komunikasi WhatsApp",
    subtitle: "Template pesan tagihan dan broadcast penyewa",
    category: "Navigasi Menu",
    href: "/dashboard/owner/pesan",
    icon: MessageSquare,
  },
  {
    id: "nav-laporan",
    title: "Laporan & AI Advisory",
    subtitle: "Kalkulasi laba bersih, tren okupansi, dan rekomendasi",
    category: "Navigasi Menu",
    href: "/dashboard/owner/laporan",
    icon: BarChart3,
  },
  {
    id: "nav-tim",
    title: "Tim & Staf Operasional",
    subtitle: "Undang pengelola dan kelola hak akses RBAC",
    category: "Navigasi Menu",
    href: "/dashboard/owner/tim",
    icon: ShieldCheck,
  },
  {
    id: "nav-pengaturan",
    title: "Pengaturan Akun",
    subtitle: "Profil owner, password, dan integrasi WhatsApp",
    category: "Navigasi Menu",
    href: "/dashboard/owner/pengaturan",
    icon: Settings,
  },

  // ── Quick Actions
  {
    id: "act-tambah-properti",
    title: "Tambah Properti Baru",
    subtitle: "Daftarkan aset kos atau gedung kontrakan baru",
    category: "Aksi Cepat",
    href: "/dashboard/owner/properti",
    icon: PlusCircle,
  },
  {
    id: "act-tambah-kamar",
    title: "Tambah Unit Kamar",
    subtitle: "Tambahkan nomor kamar dan tentukan tarif sewa",
    category: "Aksi Cepat",
    href: "/dashboard/owner/kamar",
    icon: PlusCircle,
  },
  {
    id: "act-tambah-penghuni",
    title: "Daftarkan Penyewa Baru",
    subtitle: "Input profil penyewa dan nomor WhatsApp",
    category: "Aksi Cepat",
    href: "/dashboard/owner/penghuni",
    icon: PlusCircle,
  },
  {
    id: "act-buat-kontrak",
    title: "Buat Kontrak Sewa",
    subtitle: "Hubungkan penyewa dengan kamar dan tarif tagihan",
    category: "Aksi Cepat",
    href: "/dashboard/owner/kontrak",
    icon: PlusCircle,
  },
  {
    id: "act-catat-kas",
    title: "Catat Kas Keuangan",
    subtitle: "Input kas pemasukan atau pengeluaran operasional",
    category: "Aksi Cepat",
    href: "/dashboard/owner/keuangan",
    icon: PlusCircle,
  },
  {
    id: "act-lapor-keluhan",
    title: "Kelola Tiket Perbaikan",
    subtitle: "Tinjau keluhan kerusakan fasilitas unit",
    category: "Aksi Cepat",
    href: "/dashboard/owner/pemeliharaan",
    icon: PlusCircle,
  },
];

interface GlobalCommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function GlobalCommandPalette({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: GlobalCommandPaletteProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen || setInternalOpen;

  // Keyboard shortcut Ctrl+K / Cmd+K listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!isOpen);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setOpen]);

  // Filter items
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
        c.category.toLowerCase().includes(q)
    );
  }, [search]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  function navigateTo(href: string) {
    setOpen(false);
    setSearch("");
    router.push(href);
  }

  // Keyboard navigation within the dialog
  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      navigateTo(filtered[selectedIndex].href);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl overflow-hidden p-0 gap-0 border-slate-200/80 shadow-2xl">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-slate-100 px-4 py-3 bg-white">
          <Search className="size-4.5 text-slate-400 mr-3 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Ketik nama menu, fitur, atau aksi operasional..."
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Tidak ada menu atau aksi yang cocok dengan &quot;{search}&quot;
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.href)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition ${
                    isSelected
                      ? "bg-teal-50/80 text-teal-900 border border-teal-200/60"
                      : "text-slate-700 hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                        isSelected
                          ? "bg-teal-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="truncate">
                      <p className="font-semibold text-slate-900 truncate">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        item.category === "Aksi Cepat"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.category}
                    </span>
                    <ArrowRight
                      className={`size-3.5 transition ${
                        isSelected ? "text-teal-700 translate-x-0.5" : "text-slate-300"
                      }`}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/75 px-4 py-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-sans font-semibold text-slate-600">↑↓</kbd> Pilih
            </span>
            <span>
              <kbd className="font-sans font-semibold text-slate-600">↵</kbd> Buka
            </span>
          </div>
          <span className="font-medium text-teal-800">Kontrakin Command Center</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
