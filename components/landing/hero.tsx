"use client";

import * as React from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Play } from "lucide-react";
import { Backdrop } from "@/components/backdrop";

export function Hero() {
  return (
    <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-32 overflow-hidden">
      <Backdrop variant="intense" />

      <div className="mx-auto max-w-6xl px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center gap-7"
        >
          {/* Pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-[12px] font-medium text-muted-foreground"
          >
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full rounded-full bg-mint opacity-75 animate-ping" />
              <span className="relative inline-flex size-1.5 rounded-full bg-mint" />
            </span>
            <span>
              Hackathon · AI para a jornada de quem está virando dev
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-semibold tracking-[-0.04em] leading-[0.95] max-w-5xl"
          >
            <span className="text-gradient-static">A IA que </span>
            <span className="font-serif italic font-normal text-gradient">
              nunca te dá
            </span>
            <br />
            <span className="text-gradient-static">a resposta.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed text-balance"
          >
            Um ambiente de código onde a IA age como um tech lead exigente —
            faz perguntas, dá hints graduais e força você a{" "}
            <span className="text-foreground">raciocinar de verdade</span>.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="flex flex-col sm:flex-row items-center gap-3 mt-2"
          >
            <Button
              size="xl"
              className="rounded-full pl-5 pr-4 h-12 sm:h-12 text-[15px] font-medium bg-foreground text-background border-transparent hover:bg-foreground/90 glow-iris group"
              render={<Link href="/onboarding" />}
            >
              <Sparkles className="size-4" />
              Comece um desafio agora
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="xl"
              variant="ghost"
              className="rounded-full px-5 h-12 text-[15px] font-medium gap-2 hover:bg-white/5"
              render={<Link href="#exemplo" />}
            >
              <Play className="size-3.5 fill-current opacity-80" />
              Ver como funciona
            </Button>
          </motion.div>

          {/* Social proof / spec line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.7 }}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-4 text-xs text-muted-foreground/70 font-mono"
          >
            <span className="flex items-center gap-1.5">
              <span className="size-1 rounded-full bg-mint" />
              powered by Claude
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1 rounded-full bg-iris" />
              método socrático
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1 rounded-full bg-ember" />
              zero hand-holding
            </span>
          </motion.div>
        </motion.div>

        {/* Floating product preview */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 sm:mt-28 relative"
        >
          <ProductPreview />
        </motion.div>
      </div>
    </section>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto max-w-5xl">
      {/* glow halo */}
      <div className="absolute -inset-x-16 -inset-y-12 -z-10 opacity-60">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[700px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.68 0.22 285 / 0.4), transparent 60%)",
          }}
        />
      </div>

      <div className="rounded-3xl border-gradient overflow-hidden shadow-2xl shadow-black/40 noise">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-red-500/60" />
            <span className="size-2.5 rounded-full bg-amber-400/60" />
            <span className="size-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <div className="flex-1 text-center text-[11px] font-mono text-muted-foreground/80">
            socratic.dev · desafio · api-padaria.ts
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_360px] min-h-[440px]">
          {/* Code area */}
          <div className="p-6 sm:p-7 font-mono text-[13px] leading-relaxed bg-[oklch(0.085_0.012_280)] relative overflow-hidden">
            <div className="absolute inset-0 grid-pattern opacity-30" />
            <div className="relative space-y-1.5">
              <div className="text-muted-foreground/60">// Cliente: Padaria do Zé</div>
              <div className="text-muted-foreground/60">// Mostrar produtos que vencem em 3 dias</div>
              <div className="h-2" />
              <div>
                <span className="text-[oklch(0.78_0.17_165)]">import</span>{" "}
                <span>{`{ db }`}</span>{" "}
                <span className="text-[oklch(0.78_0.17_165)]">from</span>{" "}
                <span className="text-[oklch(0.7_0.2_35)]">&apos;./db&apos;</span>
              </div>
              <div className="h-2" />
              <div>
                <span className="text-[oklch(0.68_0.22_285)]">export async function</span>{" "}
                <span className="text-[oklch(0.78_0.17_165)]">expiringProducts</span>
                <span>{`() {`}</span>
              </div>
              <div className="pl-6">
                <span className="text-muted-foreground/60">// como filtrar por data...?</span>
              </div>
              <div className="pl-6 relative">
                <span className="text-muted-foreground/40">const</span>{" "}
                <span>products =</span>{" "}
                <span className="text-foreground/80">await</span>{" "}
                <span className="text-[oklch(0.78_0.17_165)]">db</span>
                <span>.products.findAll()</span>
              </div>
              <div className="pl-6 flex items-center">
                <span className="text-foreground/30">|</span>
                <span className="ml-1 inline-block h-4 w-px bg-iris animate-caret-blink" />
              </div>
              <div className="text-muted-foreground/60">{`}`}</div>
            </div>
          </div>

          {/* Chat panel */}
          <div className="bg-white/[0.015] border-l border-white/[0.06] flex flex-col">
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
              <div className="size-7 rounded-full bg-gradient-to-br from-iris to-mint grid place-items-center text-[10px] font-bold text-background">
                S
              </div>
              <div className="text-[13px] font-medium">Tutor Socrático</div>
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                <span className="size-1 rounded-full bg-mint animate-pulse" />
                online
              </span>
            </div>
            <div className="flex-1 p-4 space-y-3 text-[13px]">
              <ChatBubble role="user">
                Como filtro só os produtos que vencem em 3 dias?
              </ChatBubble>
              <ChatBubble role="ai">
                Boa pergunta. Antes de codar — que estrutura de dados o{" "}
                <code className="text-iris">findAll()</code> te devolve?
              </ChatBubble>
              <ChatBubble role="user">um array de objetos</ChatBubble>
              <ChatBubble role="ai">
                Exato. E qual método de array filtra elementos por uma condição?
              </ChatBubble>

              <div className="pt-2 flex items-center gap-2">
                <div className="flex-1 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 flex items-center text-muted-foreground/60 text-[12px]">
                  Pense, depois pergunte...
                </div>
                <div className="size-9 rounded-xl bg-foreground/90 grid place-items-center">
                  <ArrowRight className="size-3.5 text-background" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  role,
  children,
}: {
  role: "user" | "ai";
  children: React.ReactNode;
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-foreground/10 px-3 py-2 text-foreground/90">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="flex">
      <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-gradient-to-br from-iris/10 via-violet/5 to-mint/5 border border-iris/15 px-3 py-2 text-foreground/95">
        {children}
      </div>
    </div>
  );
}
