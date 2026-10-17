"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function TableSkeleton({
  rows = 5,
  columns = 5,
  className = "",
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={`w-full space-y-3 ${className}`}>
      {/* Table Header Skeleton */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={`th-${i}`}
            className={`h-4 ${i === 0 ? "w-32" : i === columns - 1 ? "w-16" : "w-24"}`}
          />
        ))}
      </div>

      {/* Table Rows Skeleton */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`tr-${rowIndex}`}
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-3 bg-white/50"
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`td-${rowIndex}-${colIndex}`}
                className={`h-4 ${
                  colIndex === 0
                    ? "w-28 sm:w-36"
                    : colIndex === 1
                    ? "w-20"
                    : colIndex === columns - 1
                    ? "w-12"
                    : "w-24"
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({
  count = 4,
  columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
}: {
  count?: number;
  columns?: string;
}) {
  return (
    <div className={`grid gap-4 ${columns}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={`card-${i}`} className="border-slate-200/80 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="size-8 rounded-xl" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DetailDrawerSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-2xl shrink-0" />
        <div className="space-y-2 w-full">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3.5 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-9 rounded-xl" />
        <Skeleton className="h-9 rounded-xl" />
        <Skeleton className="h-9 rounded-xl" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    </div>
  );
}
