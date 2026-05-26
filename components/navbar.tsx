"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => {
    setScrolled(v > 24);
  });

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-500",
        scrolled ? "py-2" : "py-4"
      )}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div
          className={cn(
            "flex items-center justify-between rounded-2xl px-4 sm:px-5 transition-all duration-500",
            scrolled
              ? "h-12 glass-strong shadow-lg shadow-black/20"
              : "h-14 bg-transparent"
          )}
        >
          <Logo />

          <nav className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
            <Link
              href="#problema"
              className="px-3 py-1.5 hover:text-foreground transition-colors rounded-md"
            >
              Problema
            </Link>
            <Link
              href="#metodo"
              className="px-3 py-1.5 hover:text-foreground transition-colors rounded-md"
            >
              Método
            </Link>
            <Link
              href="#exemplo"
              className="px-3 py-1.5 hover:text-foreground transition-colors rounded-md"
            >
              Demo
            </Link>
            <Link
              href="#precos"
              className="px-3 py-1.5 hover:text-foreground transition-colors rounded-md"
            >
              Manifesto
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Entrar
            </Link>
            <Button
              size="sm"
              className="rounded-full pl-3 pr-2.5 h-8 sm:h-9 text-[13px] gap-1.5 bg-foreground text-background border-transparent hover:bg-foreground/90"
              render={<Link href="/onboarding" />}
            >
              <Sparkles className="size-3.5" />
              Começar
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
