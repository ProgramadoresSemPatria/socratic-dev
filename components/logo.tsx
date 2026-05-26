import { cn } from "@/lib/utils";
import Link from "next/link";

interface LogoProps {
  className?: string;
  asLink?: boolean;
  showText?: boolean;
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-7", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="oklch(0.78 0.17 165)" />
          <stop offset="55%" stopColor="oklch(0.68 0.22 285)" />
          <stop offset="100%" stopColor="oklch(0.6 0.25 295)" />
        </linearGradient>
      </defs>
      <path
        d="M16 2.5C8.5 2.5 2.5 8.5 2.5 16S8.5 29.5 16 29.5 29.5 23.5 29.5 16 23.5 2.5 16 2.5Zm0 5.5c4.4 0 8 3.6 8 8 0 1.3-.3 2.5-.9 3.6L18 14.5l-5.1 5.1L9 15.7c0-.4 0-.5 0 0 0-4.4 3.6-7.7 7-7.7Z"
        fill="url(#logo-grad)"
      />
      <circle cx="16" cy="16" r="2.6" fill="oklch(0.97 0.005 280)" />
    </svg>
  );
}

export function Logo({ className, asLink = true, showText = true }: LogoProps) {
  const content = (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      {showText && (
        <span className="font-heading font-semibold text-[17px] tracking-tight">
          Socratic<span className="text-muted-foreground">.dev</span>
        </span>
      )}
    </div>
  );
  if (asLink) {
    return (
      <Link href="/" className="group">
        {content}
      </Link>
    );
  }
  return content;
}
