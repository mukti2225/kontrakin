"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Building2,
  Bed,
  Users,
  FileText,
  Receipt,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface OnboardingStepItem {
  id: string;
  stepNumber: number;
  title: string;
  shortDesc: string;
  detailHelp: string;
  done: boolean;
  href: string;
  actionText: string;
  estimatedMinutes: string;
  icon: "building" | "bed" | "users" | "fileText" | "receipt";
}

interface OnboardingWizardProps {
  steps: OnboardingStepItem[];
  organizationName?: string;
}

export function OnboardingWizard({ steps, organizationName }: OnboardingWizardProps) {
  const [selectedHelpStep, setSelectedHelpStep] = useState<OnboardingStepItem | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const completedCount = steps.filter((s) => s.done).length;
  const totalCount = steps.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllComplete = completedCount === totalCount;

  const renderIcon = (type: OnboardingStepItem["icon"], isDone: boolean) => {
    const iconClass = "size-4.5";
    switch (type) {
      case "building":
        return <Building2 className={iconClass} />;
      case "bed":
        return <Bed className={iconClass} />;
      case "users":
        return <Users className={iconClass} />;
      case "fileText":
        return <FileText className={iconClass} />;
      case "receipt":
        return <Receipt className={iconClass} />;
      default:
        return <Sparkles className={iconClass} />;
    }
  };

  return (
    <>
      <section className="mb-6 overflow-hidden rounded-2xl border border-emerald-200/90 bg-linear-to-br from-emerald-50/70 via-white to-white p-5 shadow-xs transition-all">
        {/* Header bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-emerald-100/90 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Panduan Setup Awal Operasional Portofolio
                </h2>
                <span className="hidden rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 sm:inline-block">
                  {organizationName || "Organisasi Aktif"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Alur langkah mula: Daftarkan Properti → Tambah Kamar → Registrasi Penyewa → Buat Kontrak → Terbitkan Invoice Perdana.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800">
                  {completedCount} dari {totalCount} Langkah ({progressPct}%)
                </span>
              </div>
              <div className="mt-1.5 h-2 w-32 rounded-full bg-slate-200/80 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-500 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? "Sembunyikan checklist" : "Buka checklist"}
              className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
            >
              {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Steps Grid */}
        {isExpanded && (
          <div className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {steps.map((step) => {
                return (
                  <div
                    key={step.id}
                    className={`group relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 ${
                      step.done
                        ? "border-emerald-200 bg-emerald-50/40 text-slate-700"
                        : "border-slate-200/90 bg-white shadow-2xs hover:border-emerald-300 hover:shadow-xs"
                    }`}
                  >
                    <div>
                      {/* Top icon & status badge */}
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex size-8 items-center justify-center rounded-lg ${
                            step.done
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700"
                          } transition-colors`}
                        >
                          {renderIcon(step.icon, step.done)}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedHelpStep(step)}
                            className="text-slate-400 hover:text-emerald-700 transition"
                            title="Panduan detail langkah ini"
                          >
                            <HelpCircle className="size-3.5" />
                          </button>
                          {step.done ? (
                            <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="flex size-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                              {step.stepNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="mt-3">
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 leading-snug">
                            {step.title}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                          {step.shortDesc}
                        </p>
                      </div>
                    </div>

                    {/* Footer action */}
                    <div className="mt-4 pt-2 border-t border-slate-100/60">
                      {!step.done ? (
                        <Link
                          href={step.href}
                          className="inline-flex w-full items-center justify-between rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 active:scale-[0.98]"
                        >
                          <span>{step.actionText}</span>
                          <ArrowRight className="size-3.5" />
                        </Link>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] font-medium text-emerald-700">
                          <span className="inline-flex items-center gap-1">
                            <Check className="size-3 text-emerald-600" /> Selesai
                          </span>
                          <Link
                            href={step.href}
                            className="text-[10px] text-slate-400 hover:text-emerald-700 underline transition"
                          >
                            Lihat Data
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Contextual Guidance Footer */}
            <div className="mt-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-emerald-100/50 px-3.5 py-2 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-700 shrink-0" />
                <span>
                  <strong>Tip Operasional:</strong> Setelah langkah 1–4 selesai, tagihan bulanan dapat diterbitkan secara otomatis setiap siklus jatuh tempo sewa.
                </span>
              </div>
              <Link
                href="/dashboard/owner/pengaturan"
                className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:underline shrink-0"
              >
                <span>Pengaturan Profil Bisnis</span>
                <ExternalLink className="size-3" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Contextual Help Modal */}
      <Dialog open={!!selectedHelpStep} onOpenChange={(open) => !open && setSelectedHelpStep(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <HelpCircle className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Panduan: {selectedHelpStep?.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Estimasi pengerjaan: {selectedHelpStep?.estimatedMinutes || "1-2 menit"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-xs text-slate-700 leading-relaxed">
              {selectedHelpStep?.detailHelp}
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">Manfaat otomatisasi langkah ini:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-500">
                <li>Data terisolasi aman dalam organisasi Anda secara multi-tenant.</li>
                <li>Mencegah kesalahan manual dan duplikasi pencatatan buku kas.</li>
                <li>Dapat langsung diekspor ke laporan CSV atau dikirimkan via WhatsApp.</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <button
              onClick={() => setSelectedHelpStep(null)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Tutup
            </button>
            {selectedHelpStep && (
              <Link
                href={selectedHelpStep.href}
                onClick={() => setSelectedHelpStep(null)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
              >
                <span>Buka Formulir {selectedHelpStep.actionText}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
