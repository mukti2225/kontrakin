"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  X,
} from "lucide-react";

// ─── 1. Pagination Controls ──────────────────────────────────────────────────

export interface DataTablePaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}

export function DataTablePagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  itemLabel = "data",
}: DataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-white text-xs text-slate-600 rounded-b-2xl">
      {/* Items count summary */}
      <div className="flex items-center gap-2">
        <span>
          Menampilkan <span className="font-semibold text-slate-900">{startItem}</span> -{" "}
          <span className="font-semibold text-slate-900">{endItem}</span> dari{" "}
          <span className="font-semibold text-slate-900">{totalItems}</span> {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-3 pl-3 border-l border-slate-200">
            <span className="text-slate-400">Baris:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-700 outline-none focus:border-teal-500"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="size-7 rounded-lg border-slate-200 text-slate-600 disabled:opacity-40"
          title="Halaman Pertama"
        >
          <ChevronsLeft className="size-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="size-7 rounded-lg border-slate-200 text-slate-600 disabled:opacity-40"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft className="size-3.5" />
        </Button>

        <span className="px-2.5 py-1 text-xs font-semibold text-slate-800">
          Hal {currentPage} dari {totalPages}
        </span>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="size-7 rounded-lg border-slate-200 text-slate-600 disabled:opacity-40"
          title="Halaman Berikutnya"
        >
          <ChevronRight className="size-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="size-7 rounded-lg border-slate-200 text-slate-600 disabled:opacity-40"
          title="Halaman Terakhir"
        >
          <ChevronsRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── 2. Column Visibility Dropdown ───────────────────────────────────────────

export interface ColumnDefinition {
  key: string;
  label: string;
  visible: boolean;
}

export interface ColumnVisibilityToggleProps {
  columns: ColumnDefinition[];
  onToggle: (key: string) => void;
  onReset?: () => void;
}

export function ColumnVisibilityToggle({
  columns,
  onToggle,
  onReset,
}: ColumnVisibilityToggleProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 gap-1.5"
          >
            <SlidersHorizontal className="size-3.5 text-slate-500" />
            Kolom
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 text-xs shadow-md">
        <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Atur Tampilan Kolom
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((col) => (
          <DropdownMenuCheckboxItem
            key={col.key}
            checked={col.visible}
            onCheckedChange={() => onToggle(col.key)}
            className="rounded-lg text-xs font-medium cursor-pointer"
          >
            {col.label}
          </DropdownMenuCheckboxItem>
        ))}
        {onReset && (
          <>
            <DropdownMenuSeparator />
            <button
              onClick={onReset}
              className="w-full text-left px-2 py-1.5 text-xs text-teal-600 hover:bg-teal-50 rounded-lg font-semibold transition"
            >
              Reset ke Default
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── 3. Bulk Action Bar ──────────────────────────────────────────────────────

export interface BulkActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "outline" | "destructive";
}

export interface BulkActionBarProps {
  selectedCount: number;
  totalFilteredCount: number;
  onClearSelection: () => void;
  onSelectAllFiltered?: () => void;
  actions: BulkActionItem[];
  itemLabel?: string;
}

export function BulkActionBar({
  selectedCount,
  totalFilteredCount,
  onClearSelection,
  onSelectAllFiltered,
  actions,
  itemLabel = "data",
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-teal-50/95 p-3 shadow-md backdrop-blur-xs transition-all animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
          {selectedCount}
        </span>
        <span className="text-xs font-bold text-teal-950">
          {selectedCount} {itemLabel} dipilih
        </span>
        {onSelectAllFiltered && selectedCount < totalFilteredCount && (
          <button
            onClick={onSelectAllFiltered}
            className="ml-2 text-xs font-semibold text-teal-700 underline hover:text-teal-900"
          >
            Pilih semua ({totalFilteredCount})
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {actions.map((act, idx) => (
          <Button
            key={idx}
            size="sm"
            onClick={act.onClick}
            variant={act.variant === "destructive" ? "destructive" : act.variant === "outline" ? "outline" : "default"}
            className={`h-8 rounded-xl text-xs font-semibold gap-1.5 ${
              act.variant === "destructive"
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : act.variant === "outline"
                ? "border-teal-300 bg-white text-teal-900 hover:bg-teal-100/50"
                : "bg-teal-600 hover:bg-teal-700 text-white"
            }`}
          >
            {act.icon}
            {act.label}
          </Button>
        ))}

        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
          className="h-8 rounded-xl text-xs text-slate-500 hover:bg-teal-100 hover:text-slate-800"
          title="Batalkan Pilihan"
        >
          <X className="size-3.5 mr-1" />
          Batal
        </Button>
      </div>
    </div>
  );
}
