"use client";

import React, { useId, useState } from "react";
import { Loader2, AlertCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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

// ─── 1. Form Field Wrapper ───────────────────────────────────────────────────

export interface FormFieldProps {
  id?: string;
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => React.ReactNode;
  className?: string;
}

export function FormField({
  id: explicitId,
  label,
  required = false,
  description,
  error,
  children,
  className,
}: FormFieldProps) {
  const generatedId = useId();
  const id = explicitId || generatedId;
  const errorId = `${id}-error`;
  const descId = `${id}-desc`;

  const ariaDescribedBy = [description ? descId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs font-semibold text-slate-700 flex items-center gap-1">
          <span>{label}</span>
          {required ? (
            <span className="text-rose-500 font-bold text-xs" title="Field Wajib Diisi">*</span>
          ) : (
            <span className="text-[11px] font-normal text-slate-400">(opsional)</span>
          )}
        </Label>
      </div>

      {children({
        id,
        "aria-invalid": !!error,
        "aria-describedby": ariaDescribedBy,
      })}

      {description && !error && (
        <p id={descId} className="text-[11px] text-slate-500 leading-relaxed">
          {description}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-xs text-rose-600 font-medium flex items-center gap-1.5 pt-0.5">
          <AlertCircle className="size-3.5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

// ─── 2. Currency Input (Rupiah) ──────────────────────────────────────────────

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: number | string;
  onChange: (value: number) => void;
  hasError?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  hasError = false,
  className,
  disabled,
  placeholder = "0",
  ...props
}: CurrencyInputProps) {
  const numericValue = typeof value === "number" ? value : Number(String(value).replace(/\D/g, "")) || 0;

  const displayString = numericValue > 0
    ? new Intl.NumberFormat("id-ID").format(numericValue)
    : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawDigits = e.target.value.replace(/\D/g, "");
    const parsed = Number(rawDigits) || 0;
    onChange(parsed);
  }

  return (
    <div className="relative rounded-xl shadow-xs">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <span className="text-xs font-bold text-slate-500">Rp</span>
      </div>
      <input
        type="text"
        inputMode="numeric"
        value={displayString}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-xl border bg-white py-2 pl-9 pr-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition disabled:opacity-50 disabled:bg-slate-50",
          hasError
            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-400/20 text-rose-900"
            : "border-slate-200 focus:border-teal-400 focus:ring-teal-400/20",
          className
        )}
        {...props}
      />
    </div>
  );
}

// ─── 3. Phone Input (Indonesian +62 Standard) ────────────────────────────────

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onChange: (cleanedPhone: string) => void;
  hasError?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  hasError = false,
  className,
  disabled,
  placeholder = "812 3456 7890",
  ...props
}: PhoneInputProps) {
  // Strip leading 62 or 0 for clean display inside input
  let displayValue = value || "";
  if (displayValue.startsWith("+62")) {
    displayValue = displayValue.slice(3).trim();
  } else if (displayValue.startsWith("62")) {
    displayValue = displayValue.slice(2).trim();
  } else if (displayValue.startsWith("0")) {
    displayValue = displayValue.slice(1).trim();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    // Store in normalized format without 0 or 62 prefix, e.g. "81234567890"
    let clean = raw;
    if (clean.startsWith("62")) clean = clean.slice(2);
    else if (clean.startsWith("0")) clean = clean.slice(1);
    onChange(clean);
  }

  return (
    <div className="relative flex rounded-xl shadow-xs">
      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 select-none">
        +62
      </span>
      <input
        type="tel"
        inputMode="tel"
        value={displayValue}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-r-xl border bg-white py-2 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition disabled:opacity-50 disabled:bg-slate-50",
          hasError
            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-400/20 text-rose-900"
            : "border-slate-200 focus:border-teal-400 focus:ring-teal-400/20",
          className
        )}
        {...props}
      />
    </div>
  );
}

// ─── 4. Form Section Header ──────────────────────────────────────────────────

export interface FormSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  icon,
  children,
  className,
}: FormSectionProps) {
  return (
    <div className={cn("space-y-4 rounded-2xl border border-slate-100 bg-slate-50/40 p-4 sm:p-5", className)}>
      <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
        {icon && (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-3 pt-1">{children}</div>
    </div>
  );
}

// ─── 5. Submit Button with Duplicate Prevention ──────────────────────────────

export interface SubmitButtonProps extends React.ComponentProps<typeof Button> {
  isPending?: boolean;
  loadingText?: string;
}

export function SubmitButton({
  isPending = false,
  loadingText = "Menyimpan...",
  children,
  disabled,
  className,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={isPending || disabled}
      className={cn(
        "rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs disabled:opacity-60",
        className
      )}
      {...props}
    >
      {isPending ? (
        <span className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          <span>{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </Button>
  );
}

// ─── 6. Unsaved Changes Alert Dialog (Dirty Form Guard) ──────────────────────

export interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDiscard: () => void;
  title?: string;
  description?: string;
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onConfirmDiscard,
  title = "Perubahan Belum Disimpan",
  description = "Anda memiliki perubahan yang belum disimpan pada formulir ini. Jika menutup sekarang, semua perubahan yang belum disimpan akan hilang.",
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md rounded-2xl">
        <AlertDialogHeader>
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-200">
            <AlertTriangle className="size-6" />
          </div>
          <AlertDialogTitle className="text-center">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-xs text-slate-500">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-2 mt-2">
          <AlertDialogCancel className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            Lanjut Mengedit
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmDiscard}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
          >
            Buang Perubahan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
