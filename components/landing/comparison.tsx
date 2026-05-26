"use client";

import { motion } from "motion/react";
import { Check, X } from "lucide-react";

const rows = [
  {
    feature: "Te dá o código pronto",
    others: true,
    us: false,
  },
  {
    feature: "Te força a raciocinar",
    others: false,
    us: true,
  },
  {
    feature: "Mede sua independência",
    others: false,
    us: true,
  },
  {
    feature: "Hints escaláveis (3 níveis)",
    others: false,
    us: true,
  },
  {
    feature: "Code review com perguntas",
    others: false,
    us: true,
  },
  {
    feature: "Desafios com briefing de cliente",
    others: false,
    us: true,
  },
];

export function Comparison() {
  return (
    <section id="exemplo" className="relative py-28 sm:py-36 overflow-hidden">
      <div className="mx-auto max-w-5xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] font-mono text-muted-foreground mb-6">
            <span className="size-1 rounded-full bg-mint" />
            Não somos mais um wrapper de GPT
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl font-semibold tracking-[-0.035em] leading-[1.02] text-balance">
            O oposto de tudo que{" "}
            <span className="font-serif italic font-normal text-gradient-iris">
              já existe
            </span>
            .
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="rounded-3xl border-gradient overflow-hidden noise"
        >
          <div className="grid grid-cols-3 bg-white/[0.02] border-b border-white/[0.06]">
            <div className="px-6 py-5 text-[13px] font-mono text-muted-foreground/70">
              critério
            </div>
            <div className="px-6 py-5 text-center text-[13px] font-medium text-muted-foreground">
              Copilot · ChatGPT · Cursor
            </div>
            <div className="px-6 py-5 text-center text-[13px] font-medium">
              <span className="text-gradient-iris">Socratic.dev</span>
            </div>
          </div>

          {rows.map((r, i) => (
            <motion.div
              key={r.feature}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="grid grid-cols-3 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.015] transition-colors"
            >
              <div className="px-6 py-4 text-[14px] text-foreground/90 font-medium">
                {r.feature}
              </div>
              <div className="px-6 py-4 grid place-items-center">
                {r.others ? (
                  <div className="size-7 rounded-full bg-red-500/10 border border-red-500/20 grid place-items-center">
                    <X className="size-3.5 text-red-400/80" />
                  </div>
                ) : (
                  <div className="size-7 rounded-full bg-white/[0.03] border border-white/[0.06] grid place-items-center">
                    <X className="size-3.5 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="px-6 py-4 grid place-items-center">
                {r.us ? (
                  <div className="size-7 rounded-full bg-mint/15 border border-mint/30 grid place-items-center">
                    <Check className="size-3.5 text-mint" />
                  </div>
                ) : (
                  <div className="size-7 rounded-full bg-white/[0.03] border border-white/[0.06] grid place-items-center">
                    <X className="size-3.5 text-muted-foreground/40" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
