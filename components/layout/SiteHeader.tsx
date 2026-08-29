import { Bell, Mail, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function SiteHeader() {
  const user = await getCurrentUser();

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "??";

  const roleLabel: Record<string, string> = {
    owner: "Pemilik Kos",
    tenant: "Penghuni",
    admin: "Super Admin",
  };
  const role = roleLabel[user?.role ?? ""] ?? "Pengguna";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-100 bg-white px-4 py-3 sm:px-6">
      {/* Left: sidebar trigger + search */}
      <div className="flex flex-1 items-center gap-3">
        <SidebarTrigger className="shrink-0 rounded-lg text-slate-500 transition-colors hover:bg-teal-50 hover:text-teal-700" />

        {/* Search bar */}
        <div className="relative hidden max-w-sm flex-1 md:flex items-center">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kamar, penyewa, atau tagihan..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-14 text-sm text-slate-700 placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition"
          />
          <kbd className="pointer-events-none absolute right-3 hidden select-none rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500 sm:inline-flex items-center gap-0.5">
            <span>⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Right: mail, bell, avatar */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Mail */}
        <button
          aria-label="Pesan"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <Mail className="h-4.5 w-4.5" />
        </button>

        {/* Bell with badge */}
        <button
          aria-label="Notifikasi"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-slate-200" />

        {/* User profile */}
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 ring-2 ring-teal-500/20">
            <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-xs font-bold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-semibold leading-tight text-slate-800">
              {user?.name ?? "Pengguna"}
            </p>
            <p className="text-[10px] leading-tight text-slate-500">{role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
