import { Bell, Search } from "lucide-react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getCurrentUser } from "@/lib/auth/get-current-user";

interface SiteHeaderProps {
  subtitle?: string;
}

export async function SiteHeader({ subtitle }: SiteHeaderProps) {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-100 bg-white px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="rounded-lg text-slate-500 transition-colors duration-300 ease-out hover:bg-teal-50 hover:text-teal-700" />
        <Separator orientation="vertical" className="h-full bg-slate-200" />
        <div>
          <h1 className="text-lg font-semibold leading-tight text-slate-900">Hai, {user?.name}</h1>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative rounded-full text-slate-500 transition-colors duration-300 ease-out hover:bg-teal-50 hover:text-teal-700">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-yellow-400 ring-2 ring-white" />
        </Button>
        <Separator orientation="vertical" className="h-6 bg-slate-200" />
        <Avatar className="h-8 w-8 ring-2 ring-teal-500/20">
          <AvatarFallback className="bg-linear-to-br from-teal-500 to-teal-700 text-xs font-semibold text-white">RD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
