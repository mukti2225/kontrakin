"use client";

import { type PointerEvent, type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

type Direction = "top" | "right" | "bottom" | "left";

interface DirectionalFloatCardProps {
  children: ReactNode;
  className?: string;
}

export default function DirectionalFloatCard({ children, className }: DirectionalFloatCardProps) {
  const [direction, setDirection] = useState<Direction | null>(null);

  function handlePointerEnter(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - (bounds.left + bounds.width / 2);
    const offsetY = event.clientY - (bounds.top + bounds.height / 2);

    if (Math.abs(offsetX) > Math.abs(offsetY)) {
      setDirection(offsetX > 0 ? "right" : "left");
    } else {
      setDirection(offsetY > 0 ? "bottom" : "top");
    }
  }

  return (
    <div className={cn(className)} data-hover-direction={direction ?? undefined} onPointerEnter={handlePointerEnter} onPointerLeave={() => setDirection(null)}>
      {children}
    </div>
  );
}
