import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, AlertTriangle, AlertCircle, HelpCircle } from "lucide-react";

export type StatusVariant = "emerald" | "amber" | "rose" | "slate" | "blue";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant;
  icon?: "check" | "clock" | "alert" | "none";
  dot?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<StatusVariant, string> = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  amber: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  rose: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
  slate: "bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  blue: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
};

const dotStyles: Record<StatusVariant, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  slate: "bg-slate-400",
  blue: "bg-blue-500",
};

export function StatusBadge({
  variant = "slate",
  icon = "none",
  dot = false,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("size-1.5 shrink-0 rounded-full", dotStyles[variant])} />}
      {icon === "check" && <CheckCircle2 className="size-3 shrink-0" />}
      {icon === "clock" && <Clock className="size-3 shrink-0" />}
      {icon === "alert" && <AlertTriangle className="size-3 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}

/**
 * Helper function to map common rental domain statuses to standardized tokens.
 */
export function getDomainStatusVariant(status: string): StatusVariant {
  const s = status.toLowerCase().trim();
  switch (s) {
    // Emerald: Active, Paid, Completed, Occupied, Delivered
    case "aktif":
    case "active":
    case "lunas":
    case "paid":
    case "selesai":
    case "completed":
    case "terisi":
    case "occupied":
    case "delivered":
    case "sent":
      return "emerald";

    // Amber: Pending, In Progress, Expiring Soon, Partial, Medium
    case "diproses":
    case "in_progress":
    case "sebagian":
    case "partial":
    case "segera_berakhir":
    case "sedang":
    case "medium":
    case "perlu_pantau":
    case "maintenance":
    case "perbaikan":
      return "amber";

    // Rose: Overdue, High Urgency, Critical, Emergency, Waiting
    case "tertunggak":
    case "overdue":
    case "menunggu":
    case "pending":
    case "tinggi":
    case "high":
    case "darurat":
    case "emergency":
    case "kritis":
      return "rose";

    // Slate: Empty, Terminated, Inactive, Draft, Low, Archived
    case "kosong":
    case "vacant":
    case "berhenti":
    case "terminated":
    case "nonaktif":
    case "inactive":
    case "draf":
    case "draft":
    case "rendah":
    case "low":
    case "archived":
      return "slate";

    default:
      return "blue";
  }
}
