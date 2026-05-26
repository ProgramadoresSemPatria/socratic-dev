"use client";

import { motion } from "motion/react";
import { Brain, Copy, GitBranch, Bug } from "lucide-react";

const pains = [
  {
    icon: Copy,
    title: "Tutorial Hell",
    desc: "Você copia código sem entender. Cinco cursos depois, ainda trava no básico.",
    accent: "from-iris/30 to-violet/10",
  },
  {
    icon: Brain,
    title: "Atrofia cognitiva",
    desc: "Copilot e ChatGPT entregam a resposta. Sua cabeça desaprende sintaxe e lógica.",
    accent: "from-mint/30 to-iris/10",
  },
  {
    icon: GitBranch,
    title: "Sem tech lead",
    desc: "Autodidata, sozinho, sem ninguém pra perguntar “por que isso e não aquilo?”",
    accent: "from-ember/30 to-iris/10",
  },
  {
    icon: Bug,
    title: "Debugging eterno",
    desc: "Dezenas de horas presas no mesmo erro. Sem aprender nada no caminho.",
    accent: "from-iris/30 to-mint/10",
  },
];

export function Problem() {
  return (
    <section id="problema" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-20 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="lg:sticky lg:top-32"
          >
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] font-mono text-muted-foreground mb-6">
              <span className="size-1 rounded-full bg-ember" />
              O elefante na sala
            </div>
            <h2 className="font-heading text-4xl sm:text-5xl font-semibold tracking-[-0.03em] leading-[1.05] text-balance">
              A IA está formando devs que{" "}
              <span className="font-serif italic font-normal text-gradient-iris">
                não sabem programar
              </span>
              .
            </h2>
            <p className="mt-5 text-muted-foreground text-[17px] leading-relaxed">
              Quem está começando hoje tem um problema que ninguém teve antes: a
              ferramenta mais poderosa da história da computação está
              ensinando a não pensar.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4">
            {pains.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
                className="group relative rounded-2xl glass p-6 hover:bg-white/[0.05] transition-colors overflow-hidden"
              >
                <div
                  className={`absolute -top-12 -right-12 size-32 rounded-full bg-gradient-to-br ${p.accent} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity`}
                />
                <div className="relative">
                  <div className="size-10 rounded-xl bg-white/[0.04] border border-white/[0.06] grid place-items-center mb-4">
                    <p.icon className="size-4.5 text-foreground/80" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold tracking-tight mb-1.5">
                    {p.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
