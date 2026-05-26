"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Sparkles,
  TrendingUp,
  Flame,
  Trophy,
  Target,
  ArrowRight,
  ChevronRight,
  Brain,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Backdrop } from "@/components/backdrop";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { cn } from "@/lib/utils";

const independenceData = [
  { day: "Seg", value: 62 },
  { day: "Ter", value: 68 },
  { day: "Qua", value: 71 },
  { day: "Qui", value: 79 },
  { day: "Sex", value: 84 },
  { day: "Sab", value: 88 },
  { day: "Dom", value: 92 },
];

const conceptsToReinforce = [
  { name: "Async/await", mastery: 35, lastSeen: "2 dias" },
  { name: "Date manipulation", mastery: 52, lastSeen: "hoje" },
  { name: "Error handling", mastery: 41, lastSeen: "4 dias" },
  { name: "SQL básico", mastery: 28, lastSeen: "5 dias" },
];

const completedChallenges = [
  {
    title: "API de controle de estoque",
    client: "Padaria do Zé",
    stack: "TypeScript",
    score: 92,
    hints: 2,
    time: "23min",
    date: "Hoje",
  },
  {
    title: "Auth com JWT do zero",
    client: "Clínica Vitalis",
    stack: "Node.js",
    score: 78,
    hints: 5,
    time: "47min",
    date: "Ontem",
  },
  {
    title: "Carrinho de e-commerce",
    client: "Moda Aurora",
    stack: "React",
    score: 65,
    hints: 9,
    time: "1h 12min",
    date: "3 dias",
  },
];

export default function DashboardPage() {
  return (
    <div className="relative flex-1 flex flex-col">
      <Navbar />
      <Backdrop variant="subtle" />

      <main className="flex-1 pt-28 pb-20">
        <div className="mx-auto max-w-6xl px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10"
          >
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70 mb-2">
                Bem-vindo de volta
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl font-semibold tracking-[-0.03em] leading-tight">
                Você está{" "}
                <span className="font-serif italic font-normal text-gradient">
                  92% independente
                </span>
                .
              </h1>
              <p className="mt-2 text-muted-foreground text-lg">
                Hoje você resolveu sem cola. Sócrates aprovaria.
              </p>
            </div>
            <Button
              size="lg"
              className="rounded-full pl-4 pr-3 h-11 text-[14px] bg-foreground text-background border-transparent hover:bg-foreground/90 glow-iris self-start md:self-auto group"
              render={<Link href="/onboarding" />}
            >
              <Sparkles className="size-4" />
              Novo desafio
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </motion.div>

          {/* Top stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <StatCard
              i={0}
              icon={Trophy}
              label="Streak"
              value="7"
              hint="dias seguidos"
              accent="ember"
            />
            <StatCard
              i={1}
              icon={Target}
              label="Desafios"
              value="14"
              hint="concluídos"
              accent="iris"
            />
            <StatCard
              i={2}
              icon={Lightbulb}
              label="Hints/desafio"
              value="3.2"
              hint="-58% vs início"
              accent="mint"
            />
            <StatCard
              i={3}
              icon={Brain}
              label="Conceitos"
              value="22"
              hint="dominados"
              accent="iris"
            />
          </div>

          {/* Charts row */}
          <div className="grid lg:grid-cols-[1.6fr_1fr] gap-3 mb-8">
            <IndependenceChart />
            <IndependenceRing />
          </div>

          {/* Concepts + recent challenges */}
          <div className="grid lg:grid-cols-2 gap-3">
            <ConceptsToReinforce />
            <RecentChallenges />
          </div>

          {/* Manifesto reminder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mt-12 rounded-3xl border-gradient noise px-8 py-10 text-center relative overflow-hidden"
          >
            <div
              className="absolute -top-32 left-1/2 -translate-x-1/2 size-[400px] rounded-full blur-3xl opacity-40 -z-10"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.68 0.22 285 / 0.5), transparent 60%)",
              }}
            />
            <div className="font-serif italic text-2xl sm:text-3xl text-foreground/90 leading-relaxed max-w-xl mx-auto">
              &ldquo;O que sai da sua cabeça vale mil vezes mais que o que sai
              da minha.&rdquo;
            </div>
            <div className="mt-3 text-xs font-mono text-muted-foreground/60">
              — Tutor Socrático, agora há pouco
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  i,
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  i: number;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  accent?: "iris" | "mint" | "ember";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06, duration: 0.5 }}
      className="rounded-2xl glass p-5 relative overflow-hidden group"
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={cn(
            "size-9 rounded-xl border grid place-items-center",
            accent === "iris" && "bg-iris/10 border-iris/20",
            accent === "mint" && "bg-mint/10 border-mint/20",
            accent === "ember" && "bg-ember/10 border-ember/20"
          )}
        >
          <Icon
            className={cn(
              "size-4",
              accent === "iris" && "text-iris",
              accent === "mint" && "text-mint",
              accent === "ember" && "text-ember"
            )}
          />
        </div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
          {label}
        </div>
      </div>
      <div className="font-heading text-3xl font-semibold tabular-nums tracking-tight">
        {value}
      </div>
      <div className="mt-1 text-[12px] text-muted-foreground">{hint}</div>
    </motion.div>
  );
}

function IndependenceChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="rounded-2xl glass p-6"
    >
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70">
            Sua jornada
          </div>
          <h3 className="font-heading text-xl font-semibold tracking-tight mt-1">
            Independência ao longo da semana
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-mint text-[12px] font-medium">
          <TrendingUp className="size-3.5" />
          +30 pts
        </div>
      </div>
      <div className="h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={independenceData}
            margin={{ top: 10, right: 8, left: -24, bottom: 0 }}
          >
            <defs>
              <linearGradient id="indep" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.68 0.22 285)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="oklch(0.68 0.22 285)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "oklch(0.65 0.02 280)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "oklch(0.65 0.02 280)" }}
              domain={[0, 100]}
            />
            <Tooltip
              cursor={{ stroke: "oklch(1 0 0 / 0.1)", strokeDasharray: "4 4" }}
              contentStyle={{
                background: "oklch(0.12 0.012 280 / 0.9)",
                border: "1px solid oklch(1 0 0 / 0.08)",
                borderRadius: 12,
                fontSize: 12,
                backdropFilter: "blur(12px)",
              }}
              labelStyle={{ color: "oklch(0.65 0.02 280)" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="oklch(0.68 0.22 285)"
              strokeWidth={2.5}
              fill="url(#indep)"
              activeDot={{ r: 5, fill: "oklch(0.78 0.17 165)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

function IndependenceRing() {
  const data = [{ name: "indep", value: 92, fill: "oklch(0.68 0.22 285)" }];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="rounded-2xl glass p-6 flex flex-col"
    >
      <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70">
        Score atual
      </div>
      <h3 className="font-heading text-xl font-semibold tracking-tight mt-1">
        Independência total
      </h3>
      <div className="flex-1 relative grid place-items-center min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              background={{ fill: "oklch(1 0 0 / 0.04)" }}
              dataKey="value"
              cornerRadius={20}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="text-center">
            <div className="font-heading text-5xl font-semibold tabular-nums text-gradient-iris">
              92%
            </div>
            <div className="text-[11px] font-mono text-muted-foreground/70 mt-1">
              top 8% dos devs
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ConceptsToReinforce() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="rounded-2xl glass p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70">
            Conceitos a reforçar
          </div>
          <h3 className="font-heading text-xl font-semibold tracking-tight mt-1">
            Onde você ainda tropeça
          </h3>
        </div>
      </div>
      <div className="space-y-3">
        {conceptsToReinforce.map((c, i) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 hover:bg-white/[0.04] transition-colors group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-[14px] font-medium">{c.name}</div>
              <div className="text-[11px] font-mono text-muted-foreground/70">
                visto {c.lastSeen}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${c.mastery}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.06 }}
                  className={cn(
                    "h-full rounded-full",
                    c.mastery < 40
                      ? "bg-gradient-to-r from-ember to-destructive"
                      : c.mastery < 70
                      ? "bg-gradient-to-r from-warning to-ember"
                      : "bg-gradient-to-r from-iris to-mint"
                  )}
                />
              </div>
              <div className="text-[11px] font-mono tabular-nums text-muted-foreground/80 w-8 text-right">
                {c.mastery}%
              </div>
              <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function RecentChallenges() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1, duration: 0.6 }}
      className="rounded-2xl glass p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70">
            Histórico
          </div>
          <h3 className="font-heading text-xl font-semibold tracking-tight mt-1">
            Desafios recentes
          </h3>
        </div>
        <Link href="#" className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
          ver tudo →
        </Link>
      </div>
      <div className="space-y-2">
        {completedChallenges.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3.5 hover:bg-white/[0.04] transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-lg bg-gradient-to-br from-iris/15 to-mint/10 border border-iris/15 grid place-items-center shrink-0">
                <CheckCircle2 className="size-4 text-mint" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-[14px] truncate">{c.title}</div>
                  <div className="font-mono text-[11px] text-muted-foreground/70 shrink-0">
                    {c.date}
                  </div>
                </div>
                <div className="text-[12px] text-muted-foreground mt-0.5">{c.client}</div>
                <div className="mt-2 flex items-center gap-3 text-[11px] font-mono">
                  <span className="rounded-full bg-white/[0.04] border border-white/[0.06] px-2 py-0.5">
                    {c.stack}
                  </span>
                  <span className="text-muted-foreground/70">{c.time}</span>
                  <span className="text-muted-foreground/70">· {c.hints} hints</span>
                  <span
                    className={cn(
                      "ml-auto font-semibold",
                      c.score >= 85
                        ? "text-mint"
                        : c.score >= 70
                        ? "text-warning-foreground"
                        : "text-ember"
                    )}
                  >
                    {c.score}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
