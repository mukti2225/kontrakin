import { Bell, Search } from "lucide-react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SiteHeaderProps {
  title: string;
  subtitle?: string;
}

export function SiteHeader({ title, subtitle }: SiteHeaderProps) {
  return (
    <header className="flex items-center sticky top-0 justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 z-20">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-5" />
        <div>
          <h1 className="text-lg font-semibold leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>

      <div className="hidden flex-1 max-w-sm items-center gap-3 sm:flex">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input placeholder="Cari kamar atau penghuni" className="pl-8" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-slate-200 text-xs text-slate-700">RD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
