"use client";

import { motion } from "motion/react";
import { Lightbulb, MessageCircleQuestion, ScrollText, TrendingUp } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: ScrollText,
    title: "Desafio realista",
    desc: "A IA gera um briefing de cliente fictício — escopo, restrições, dor. Não é mais um exercício de algoritmo.",
  },
  {
    n: "02",
    icon: MessageCircleQuestion,
    title: "Perguntas, não respostas",
    desc: "Travou? O tutor pergunta: 'que estrutura de dados resolve isso?'. Você responde. Ele aprofunda.",
  },
  {
    n: "03",
    icon: Lightbulb,
    title: "Hints graduais",
    desc: "Três níveis de pista — do vago ao quase direto. Você decide o quanto de ajuda quer. E paga em pontos de independência.",
  },
  {
    n: "04",
    icon: TrendingUp,
    title: "Review socrático",
    desc: "Submeteu? A IA não corrige. Pergunta: 'por que var e não const?'. Você aprende defendendo a sua escolha.",
  },
];

export function Method() {
  return (
    <section id="metodo" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] font-mono text-muted-foreground mb-6">
            <span className="size-1 rounded-full bg-iris" />O método
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.035em] leading-[1.02] text-balance">
            Sócrates, mas com uma{" "}
            <span className="font-serif italic font-normal text-gradient">
              tela de código
            </span>
            .
          </h2>
          <p className="mt-5 text-muted-foreground text-lg leading-relaxed text-balance">
            2.400 anos atrás, ele formava pensadores fazendo perguntas. A gente
            atualizou a interface.
          </p>
        </motion.div>

        <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="relative group"
            >
              <div className="rounded-3xl glass p-6 h-full hover:bg-white/[0.05] transition-colors relative overflow-hidden">
                <div className="absolute top-5 right-5 font-mono text-[11px] text-muted-foreground/50">
                  {s.n}
                </div>
                <div className="size-11 rounded-2xl bg-gradient-to-br from-iris/20 to-mint/10 border border-iris/20 grid place-items-center mb-5">
                  <s.icon className="size-5 text-foreground/90" />
                </div>
                <h3 className="font-heading text-[19px] font-semibold tracking-tight mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 text-muted-foreground/30 text-xl">
                  →
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
