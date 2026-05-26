"use client";

import { motion } from "motion/react";

const points = [
  "A IA mais poderosa do mundo te ensina a não pensar.",
  "Você decora soluções. Não internaliza padrões.",
  "Trava num bug? Cola no ChatGPT. Aprendeu? Nada.",
  "A gente acredita no contrário.",
];

export function Manifesto() {
  return (
    <section id="precos" className="relative py-32 sm:py-40 overflow-hidden">
      {/* Glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[800px] rounded-full blur-3xl opacity-30 -z-10"
        style={{
          background:
            "radial-gradient(circle, oklch(0.68 0.22 285 / 0.5), transparent 65%)",
        }}
      />

      <div className="mx-auto max-w-4xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] font-mono text-muted-foreground mb-8"
        >
          <span className="size-1 rounded-full bg-iris animate-pulse" />
          Manifesto
        </motion.div>

        <div className="space-y-3 sm:space-y-5">
          {points.map((p, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.15, duration: 0.7 }}
              className={
                i === points.length - 1
                  ? "font-heading text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-gradient pt-4 leading-tight"
                  : "font-heading text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-muted-foreground/60 leading-tight"
              }
            >
              {p}
            </motion.p>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="mt-16 font-serif italic text-xl sm:text-2xl text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed"
        >
          &ldquo;Eu sei que nada sei. E é exatamente isso que vai te tornar um
          dev de verdade.&rdquo;
          <div className="mt-4 text-xs font-mono not-italic text-muted-foreground/60">
            — Sócrates, 470 a.C. (mais ou menos)
          </div>
        </motion.div>
      </div>
    </section>
  );
}
