"use client";

import { cn } from "@/lib/utils";

interface BackdropProps {
  className?: string;
  variant?: "default" | "subtle" | "intense";
}

export function Backdrop({ className, variant = "default" }: BackdropProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden -z-10",
        className
      )}
      aria-hidden
    >
      {/* Grid */}
      <div className="absolute inset-0 grid-pattern opacity-[0.5] mask-fade-b" />

      {/* Aurora blobs */}
      <div
        className={cn(
          "absolute -top-40 left-1/2 -translate-x-1/2 size-[800px] rounded-full blur-3xl animate-aurora",
          variant === "subtle" && "opacity-30",
          variant === "default" && "opacity-50",
          variant === "intense" && "opacity-70"
        )}
        style={{
          background:
            "radial-gradient(circle at center, oklch(0.68 0.22 285 / 0.5), transparent 60%)",
        }}
      />
      <div
        className={cn(
          "absolute top-1/3 -right-40 size-[600px] rounded-full blur-3xl animate-aurora",
          variant === "subtle" && "opacity-20",
          variant === "default" && "opacity-40",
          variant === "intense" && "opacity-60"
        )}
        style={{
          background:
            "radial-gradient(circle at center, oklch(0.78 0.17 165 / 0.4), transparent 60%)",
          animationDelay: "-6s",
        }}
      />
      <div
        className={cn(
          "absolute bottom-0 -left-32 size-[500px] rounded-full blur-3xl animate-aurora",
          variant === "subtle" && "opacity-20",
          variant === "default" && "opacity-30",
          variant === "intense" && "opacity-50"
        )}
        style={{
          background:
            "radial-gradient(circle at center, oklch(0.6 0.25 295 / 0.35), transparent 60%)",
          animationDelay: "-12s",
        }}
      />
    </div>
  );
}
