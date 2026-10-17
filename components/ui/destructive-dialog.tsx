"use client";

import React from "react";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";

export interface DestructiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  entityName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
}

export function DestructiveDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  entityName,
  confirmLabel = "Hapus Permanen",
  cancelLabel = "Batal",
  isPending = false,
}: DestructiveDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md rounded-2xl">
        <AlertDialogHeader>
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-200">
            <Trash2 className="size-6" />
          </div>
          <AlertDialogTitle className="text-center text-slate-900">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-xs text-slate-500 leading-relaxed">
            {entityName && (
              <span className="block font-semibold text-slate-800 text-sm mb-1">
                {entityName}
              </span>
            )}
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-center text-[11px] text-rose-700 font-medium">
          ⚠️ Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
        </div>

        <AlertDialogFooter className="sm:justify-center gap-2 mt-2">
          <AlertDialogCancel
            disabled={isPending}
            className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <Button
            type="button"
            disabled={isPending}
            onClick={async () => {
              await onConfirm();
            }}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
          >
            {isPending ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Memproses...</span>
              </span>
            ) : (
              confirmLabel
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
