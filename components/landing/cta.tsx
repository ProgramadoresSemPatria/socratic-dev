"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTA() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="relative rounded-[2rem] overflow-hidden border border-white/[0.08] noise"
        >
          {/* gradient bg */}
          <div className="absolute inset-0 -z-10">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.18 0.05 285) 0%, oklch(0.12 0.012 280) 60%, oklch(0.15 0.05 165) 100%)",
              }}
            />
            <div className="absolute inset-0 grid-pattern opacity-50" />
            <div
              className="absolute -top-32 left-1/4 size-[400px] rounded-full blur-3xl opacity-50"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.68 0.22 285 / 0.7), transparent 60%)",
              }}
            />
            <div
              className="absolute -bottom-32 right-1/4 size-[400px] rounded-full blur-3xl opacity-40"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.78 0.17 165 / 0.6), transparent 60%)",
              }}
            />
          </div>

          <div className="px-6 sm:px-16 py-16 sm:py-24 text-center">
            <h2 className="font-heading text-4xl sm:text-6xl font-semibold tracking-[-0.035em] leading-[1.02] text-balance">
              Programe como se{" "}
              <span className="font-serif italic font-normal text-gradient">
                a IA não existisse
              </span>
              .
              <br />
              Aprenda como se ela{" "}
              <span className="font-serif italic font-normal text-gradient">
                fosse seu mentor
              </span>
              .
            </h2>
            <p className="mt-6 text-muted-foreground text-lg max-w-xl mx-auto">
              Comece um desafio em 30 segundos. Sem cartão, sem onboarding
              chato.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="xl"
                className="rounded-full pl-5 pr-4 h-12 text-[15px] bg-foreground text-background border-transparent hover:bg-foreground/90 glow-iris group"
                render={<Link href="/onboarding" />}
              >
                <Sparkles className="size-4" />
                Quero ser desafiado
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="xl"
                variant="ghost"
                className="rounded-full px-5 h-12 text-[15px]"
                render={<Link href="/dashboard" />}
              >
                Ver dashboard de demo
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
