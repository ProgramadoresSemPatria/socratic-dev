"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Backdrop } from "@/components/backdrop";
import { cn } from "@/lib/utils";

const stacks = [
  { id: "js", name: "JavaScript", desc: "Web, Node, full-stack", icon: "JS", gradient: "from-amber-400/30 to-orange-500/20" },
  { id: "ts", name: "TypeScript", desc: "Type safety, tooling moderno", icon: "TS", gradient: "from-blue-500/30 to-iris/20" },
  { id: "py", name: "Python", desc: "Backend, dados, scripts", icon: "PY", gradient: "from-mint/30 to-blue-400/20" },
  { id: "react", name: "React", desc: "Componentes, hooks, estado", icon: "RX", gradient: "from-cyan-400/30 to-iris/20" },
];

const levels = [
  {
    id: "starter",
    name: "Iniciante",
    tag: "Comecei agora",
    desc: "Variáveis, condicionais, loops, arrays. Sem traumas.",
    intensity: 1,
  },
  {
    id: "junior",
    name: "Júnior",
    tag: "Já fiz alguns projetos",
    desc: "Funções, objetos, fetch, async/await. Confortável com docs.",
    intensity: 2,
  },
  {
    id: "mid",
    name: "Intermediário",
    tag: "Quero crescer",
    desc: "Padrões, arquitetura, performance. Code review mais duro.",
    intensity: 3,
  },
];

const styles = [
  { id: "strict", name: "Tech lead implacável", desc: "Pergunta tudo. Não aceita 'porque sim'.", emoji: "⚡" },
  { id: "kind", name: "Mentor paciente", desc: "Guia firme, mas com carinho. Hint extra.", emoji: "🌱" },
  { id: "rubber", name: "Pato de borracha", desc: "Quase só ouve. Você fala — e descobre.", emoji: "🦆" },
];

type Step = 0 | 1 | 2 | 3;

export default function OnboardingPage() {
  const [step, setStep] = React.useState<Step>(0);
  const [stack, setStack] = React.useState<string | null>(null);
  const [level, setLevel] = React.useState<string | null>(null);
  const [style, setStyle] = React.useState<string | null>(null);

  const canNext =
    (step === 0 && stack) ||
    (step === 1 && level) ||
    (step === 2 && style) ||
    step === 3;

  return (
    <div className="relative flex-1 flex flex-col">
      <Navbar />
      <Backdrop variant="subtle" />

      <main className="flex-1 flex flex-col pt-28 pb-16">
        <div className="mx-auto w-full max-w-3xl px-4 flex-1 flex flex-col">
          {/* Stepper */}
          <div className="flex items-center gap-2 mb-12">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex-1">
                <div
                  className={cn(
                    "h-1 rounded-full transition-all duration-500",
                    step >= i ? "bg-gradient-to-r from-iris to-mint" : "bg-white/[0.06]"
                  )}
                />
                <div className="mt-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
                  {["Stack", "Nível", "Estilo", "Pronto"][i]}
                </div>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <StepShell
                key="stack"
                eyebrow="01 · Stack"
                title="Em qual linguagem você quer apanhar hoje?"
                subtitle="A IA gera desafios realistas no idioma da sua escolha."
              >
                <div className="grid sm:grid-cols-2 gap-3">
                  {stacks.map((s, i) => (
                    <Tile
                      key={s.id}
                      i={i}
                      selected={stack === s.id}
                      onClick={() => setStack(s.id)}
                    >
                      <div className={cn("size-12 rounded-2xl bg-gradient-to-br border border-white/10 grid place-items-center font-mono font-bold text-sm", s.gradient)}>
                        {s.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-heading font-semibold text-lg tracking-tight">{s.name}</div>
                        <div className="text-sm text-muted-foreground">{s.desc}</div>
                      </div>
                    </Tile>
                  ))}
                </div>
              </StepShell>
            )}

            {step === 1 && (
              <StepShell
                key="level"
                eyebrow="02 · Nível"
                title="Honestidade radical: onde você está?"
                subtitle="Não tem premiação por mentir. Quanto mais real, melhor o desafio."
              >
                <div className="space-y-3">
                  {levels.map((l, i) => (
                    <Tile
                      key={l.id}
                      i={i}
                      selected={level === l.id}
                      onClick={() => setLevel(l.id)}
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 3 }).map((_, idx) => (
                            <span
                              key={idx}
                              className={cn(
                                "h-2 w-6 rounded-full",
                                idx < l.intensity
                                  ? "bg-gradient-to-r from-iris to-mint"
                                  : "bg-white/[0.08]"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-heading font-semibold text-lg tracking-tight">{l.name}</div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 rounded-full bg-white/[0.04] px-2 py-0.5">
                            {l.tag}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">{l.desc}</div>
                      </div>
                    </Tile>
                  ))}
                </div>
              </StepShell>
            )}

            {step === 2 && (
              <StepShell
                key="style"
                eyebrow="03 · Estilo do tutor"
                title="Quem você quer do outro lado?"
                subtitle="Você sempre pode trocar depois. Mas a vibe inicial muda tudo."
              >
                <div className="space-y-3">
                  {styles.map((s, i) => (
                    <Tile
                      key={s.id}
                      i={i}
                      selected={style === s.id}
                      onClick={() => setStyle(s.id)}
                    >
                      <div className="size-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] grid place-items-center text-2xl">
                        {s.emoji}
                      </div>
                      <div className="flex-1">
                        <div className="font-heading font-semibold text-lg tracking-tight">{s.name}</div>
                        <div className="text-sm text-muted-foreground">{s.desc}</div>
                      </div>
                    </Tile>
                  ))}
                </div>
              </StepShell>
            )}

            {step === 3 && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] font-mono text-muted-foreground mb-6">
                  <span className="size-1 rounded-full bg-mint animate-pulse" />
                  Tudo pronto
                </div>
                <h1 className="font-heading text-5xl sm:text-6xl font-semibold tracking-[-0.035em] leading-tight mb-6">
                  Hora de{" "}
                  <span className="font-serif italic font-normal text-gradient">
                    pensar
                  </span>
                  .
                </h1>
                <p className="text-lg text-muted-foreground max-w-md mx-auto mb-10">
                  Vou gerar um desafio real, com cliente fictício e tudo. Sem
                  resposta pronta. Sem cópia.
                </p>
                <div className="grid sm:grid-cols-3 gap-3 max-w-xl mx-auto mb-10">
                  <SummaryItem label="Stack" value={stacks.find((s) => s.id === stack)?.name ?? "-"} />
                  <SummaryItem label="Nível" value={levels.find((l) => l.id === level)?.name ?? "-"} />
                  <SummaryItem label="Tutor" value={styles.find((s) => s.id === style)?.name ?? "-"} />
                </div>
                <Button
                  size="xl"
                  className="rounded-full pl-5 pr-4 h-12 text-[15px] bg-foreground text-background border-transparent hover:bg-foreground/90 glow-iris group"
                  render={<Link href="/challenge" />}
                >
                  <Sparkles className="size-4" />
                  Gerar meu desafio
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {step < 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-12 flex items-center justify-between"
            >
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setStep((s) => (Math.max(0, s - 1) as Step))}
                disabled={step === 0}
                className="rounded-full"
              >
                <ArrowLeft className="size-4" /> Voltar
              </Button>
              <Button
                size="lg"
                disabled={!canNext}
                onClick={() => setStep((s) => (Math.min(3, s + 1) as Step))}
                className="rounded-full pl-4 pr-3 bg-foreground text-background border-transparent hover:bg-foreground/90 disabled:opacity-40"
              >
                Continuar <ArrowRight className="size-4" />
              </Button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

function StepShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-8">
        <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70 mb-3">
          {eyebrow}
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-[-0.03em] leading-tight">
          {title}
        </h1>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </motion.div>
  );
}

function Tile({
  i,
  selected,
  onClick,
  children,
}: {
  i: number;
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06, duration: 0.4 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "w-full text-left flex items-center gap-4 rounded-2xl glass p-5 transition-all",
        selected
          ? "bg-white/[0.06] border-iris/40 ring-2 ring-iris/30"
          : "hover:bg-white/[0.04]"
      )}
    >
      {children}
      <div
        className={cn(
          "size-6 rounded-full border grid place-items-center transition-all",
          selected
            ? "bg-iris border-iris"
            : "border-white/[0.12] bg-white/[0.02]"
        )}
      >
        {selected && <Check className="size-3.5 text-background" />}
      </div>
    </motion.button>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl glass p-4">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 mb-1">
        {label}
      </div>
      <div className="font-heading font-semibold text-base tracking-tight">{value}</div>
    </div>
  );
}
