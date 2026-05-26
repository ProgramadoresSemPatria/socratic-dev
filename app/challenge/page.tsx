"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Send,
  Lightbulb,
  PlayCircle,
  GitPullRequestArrow,
  Clock,
  Brain,
  Building,
  X,
  Loader2,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
      <Loader2 className="size-4 animate-spin mr-2" /> Carregando editor...
    </div>
  ),
});

const initialCode = `// Cliente: Padaria do Zé
// "Quero ver os produtos que vencem em 3 dias."

import { db } from './db'

export async function expiringProducts() {
  const products = await db.products.findAll()
  // como filtrar por data?

}
`;

type ChatMsg = { role: "user" | "ai"; text: string; hintLevel?: 1 | 2 | 3 };

const initialChat: ChatMsg[] = [
  {
    role: "ai",
    text:
      "Olá. Antes de começar, leia o briefing à esquerda com calma. Que estrutura de dados o `findAll()` provavelmente devolve?",
  },
];

export default function ChallengePage() {
  const [code, setCode] = React.useState(initialCode);
  const [messages, setMessages] = React.useState<ChatMsg[]>(initialChat);
  const [input, setInput] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const [independence, setIndependence] = React.useState(92);
  const [hintsUsed, setHintsUsed] = React.useState(0);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  const aiQuestionBank: ChatMsg[] = [
    { role: "ai", text: "Interessante. E qual método de array filtra elementos com base numa condição? Pense em três opções e me diz qual encaixa." },
    { role: "ai", text: "Boa. Agora, como você compara duas datas em JavaScript? Não preciso do código — me explica a lógica." },
    { role: "ai", text: "Hmm. Se eu pegar `hoje` e somar 3 dias, como represento isso? O que `Date` te oferece?" },
    { role: "ai", text: "Você quase chegou. Releia seu código: a condição dentro do filter retorna true ou false? Mostra a expressão." },
  ];

  function sendUser() {
    if (!input.trim() || thinking) return;
    const text = input.trim();
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      const next = aiQuestionBank[Math.min(messages.filter(m => m.role === "user").length, aiQuestionBank.length - 1)];
      setMessages((m) => [...m, next]);
      setThinking(false);
    }, 1100);
  }

  function askHint(level: 1 | 2 | 3) {
    if (thinking) return;
    setThinking(true);
    setHintsUsed((h) => h + 1);
    setIndependence((i) => Math.max(0, i - level * 4));
    const hints: Record<number, string> = {
      1: "Hint nível 1 — Pense em métodos imutáveis de Array que retornam um subconjunto.",
      2: "Hint nível 2 — `Array.prototype.filter()` recebe uma callback que retorna boolean. Você precisa comparar a propriedade `expiresAt` de cada produto com uma data futura.",
      3: "Hint nível 3 — A condição é algo como `new Date(p.expiresAt) - Date.now() <= 3 * 24 * 60 * 60 * 1000`. Mas tente entender por que isso funciona antes de digitar.",
    };
    setTimeout(() => {
      setMessages((m) => [...m, { role: "ai", text: hints[level], hintLevel: level }]);
      setThinking(false);
    }, 700);
  }

  function submitReview() {
    setReviewOpen(true);
  }

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="relative flex-1 flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between h-14 px-4 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl z-30 shrink-0">
        <div className="flex items-center gap-4">
          <Logo />
          <div className="hidden sm:flex items-center gap-2 text-[12px] text-muted-foreground/80 font-mono pl-4 border-l border-white/[0.06]">
            <Building className="size-3.5" />
            Padaria do Zé · API de estoque
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 px-3 h-8 rounded-full glass text-[12px] font-mono">
            <Clock className="size-3.5 opacity-70" />
            <span>{minutes}:{seconds}</span>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 h-8 rounded-full glass text-[12px]">
            <Brain className="size-3.5 opacity-70" />
            <span className="text-muted-foreground">Independência:</span>
            <span
              className={cn(
                "font-semibold tabular-nums",
                independence > 70 ? "text-mint" : independence > 40 ? "text-warning-foreground" : "text-destructive-foreground"
              )}
            >
              {independence}%
            </span>
          </div>
          <Button
            size="sm"
            className="rounded-full pl-3 pr-3 h-8 bg-foreground text-background border-transparent hover:bg-foreground/90 gap-1.5"
            onClick={submitReview}
          >
            <GitPullRequestArrow className="size-3.5" />
            Submeter
          </Button>
        </div>
      </header>

      {/* Workspace */}
      <div className="flex-1 grid lg:grid-cols-[360px_1fr_400px] min-h-0">
        {/* Briefing panel */}
        <aside className="border-r border-white/[0.06] bg-card/30 overflow-y-auto">
          <BriefingPanel />
        </aside>

        {/* Editor */}
        <section className="flex flex-col min-h-0 relative">
          <div className="flex items-center justify-between h-10 px-4 border-b border-white/[0.06] bg-white/[0.015]">
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground/80 font-mono">
              <Code2Tag />
              <span>api-padaria.ts</span>
              <span className="size-1 rounded-full bg-amber-400/70 ml-1" />
              <span className="text-[11px] text-amber-400/70">unsaved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button size="xs" variant="ghost" className="rounded-md gap-1.5 text-muted-foreground hover:text-foreground">
                <PlayCircle className="size-3.5" /> Rodar
              </Button>
            </div>
          </div>
          <div className="flex-1 min-h-0 relative">
            <MonacoEditor
              height="100%"
              defaultLanguage="typescript"
              value={code}
              onChange={(v) => setCode(v ?? "")}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "var(--font-mono)",
                fontLigatures: true,
                minimap: { enabled: false },
                padding: { top: 20, bottom: 20 },
                scrollBeyondLastLine: false,
                lineNumbersMinChars: 3,
                renderLineHighlight: "none",
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                smoothScrolling: true,
                tabSize: 2,
              }}
            />
          </div>
        </section>

        {/* Chat */}
        <aside className="border-l border-white/[0.06] bg-card/30 flex flex-col min-h-0">
          <ChatPanel
            messages={messages}
            scrollRef={scrollRef}
            thinking={thinking}
            input={input}
            setInput={setInput}
            sendUser={sendUser}
            askHint={askHint}
            hintsUsed={hintsUsed}
          />
        </aside>
      </div>

      <AnimatePresence>
        {reviewOpen && (
          <ReviewModal
            independence={independence}
            hintsUsed={hintsUsed}
            onClose={() => setReviewOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Code2Tag() {
  return (
    <span className="size-4 rounded bg-iris/20 border border-iris/30 text-[8px] font-bold grid place-items-center text-iris">
      TS
    </span>
  );
}

function BriefingPanel() {
  return (
    <div className="p-6">
      <div className="inline-flex items-center gap-2 rounded-full glass px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 mb-5">
        <Building className="size-3" />
        Briefing do cliente
      </div>

      <h2 className="font-heading text-2xl font-semibold tracking-tight leading-tight mb-3">
        API de controle de estoque para a Padaria do Zé
      </h2>

      <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground/70 mb-6">
        <span className="rounded-full bg-white/[0.04] border border-white/[0.06] px-2 py-0.5">TypeScript</span>
        <span className="rounded-full bg-white/[0.04] border border-white/[0.06] px-2 py-0.5">Júnior</span>
        <span className="rounded-full bg-mint/10 border border-mint/20 px-2 py-0.5 text-mint">~25min</span>
      </div>

      <div className="space-y-4 text-sm leading-relaxed">
        <p className="text-foreground/90">
          Seu Zé tem uma padaria de bairro. Hoje, joga pão fora todo dia porque
          esquece o que está perto do vencimento.
        </p>
        <p className="text-muted-foreground">
          Ele te pediu uma função que retorne os produtos que{" "}
          <span className="text-foreground">vencem em até 3 dias</span> a partir
          de hoje. Só isso. Sem frontend, sem nada chique.
        </p>

        <div className="mt-6">
          <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70 mb-2">
            Restrições
          </div>
          <ul className="space-y-1.5 text-[13px] text-foreground/90">
            <Constraint>Use SQLite (já configurado no `./db`)</Constraint>
            <Constraint>Função deve ser pura — sem efeitos colaterais</Constraint>
            <Constraint>Retorne o array vazio se não houver itens</Constraint>
            <Constraint>Não importe libs de data (use só Date)</Constraint>
          </ul>
        </div>

        <div className="mt-6">
          <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70 mb-2">
            Modelo
          </div>
          <pre className="rounded-xl bg-code border border-white/[0.06] p-3 text-[12px] leading-relaxed font-mono text-foreground/90 overflow-x-auto">
{`type Product = {
  id: string
  name: string
  expiresAt: string  // ISO date
  quantity: number
}`}
          </pre>
        </div>

        <div className="mt-6 rounded-xl border border-iris/20 bg-iris/5 p-4">
          <div className="flex items-center gap-2 text-iris text-[11px] font-mono uppercase tracking-wider mb-1.5">
            <Sparkles className="size-3.5" />
            Regra da casa
          </div>
          <p className="text-[13px] text-foreground/85 leading-relaxed">
            O tutor não vai te dar a resposta. Ele faz perguntas. Se você quiser
            um hint direto, pague em pontos de independência.
          </p>
        </div>
      </div>
    </div>
  );
}

function Constraint({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <CheckCircle2 className="size-4 text-mint shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  );
}

function ChatPanel({
  messages,
  scrollRef,
  thinking,
  input,
  setInput,
  sendUser,
  askHint,
  hintsUsed,
}: {
  messages: ChatMsg[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  thinking: boolean;
  input: string;
  setInput: (v: string) => void;
  sendUser: () => void;
  askHint: (level: 1 | 2 | 3) => void;
  hintsUsed: number;
}) {
  return (
    <>
      <div className="flex items-center justify-between h-10 px-4 border-b border-white/[0.06] bg-white/[0.015]">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-gradient-to-br from-iris to-mint grid place-items-center text-[9px] font-bold text-background">
            S
          </div>
          <div className="text-[12px] font-medium">Tutor Socrático</div>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground/70">
          {hintsUsed} hint{hintsUsed === 1 ? "" : "s"} usado{hintsUsed === 1 ? "" : "s"}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 text-[13.5px]">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {m.role === "user" ? (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-foreground/10 px-3.5 py-2 text-foreground/95">
                  {m.text}
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="size-6 shrink-0 rounded-full bg-gradient-to-br from-iris to-mint grid place-items-center text-[9px] font-bold text-background">
                  S
                </div>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl rounded-bl-md px-3.5 py-2 leading-relaxed",
                    m.hintLevel
                      ? "bg-warning/10 border border-warning/20 text-foreground/95"
                      : "bg-gradient-to-br from-iris/10 via-violet/5 to-mint/5 border border-iris/15 text-foreground/95"
                  )}
                >
                  {m.hintLevel && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-warning-foreground mb-1">
                      <Lightbulb className="size-3" />
                      Hint nível {m.hintLevel}
                    </div>
                  )}
                  <FormattedText text={m.text} />
                </div>
              </div>
            )}
          </motion.div>
        ))}

        {thinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2"
          >
            <div className="size-6 shrink-0 rounded-full bg-gradient-to-br from-iris to-mint grid place-items-center text-[9px] font-bold text-background">
              S
            </div>
            <div className="rounded-2xl rounded-bl-md bg-iris/10 border border-iris/15 px-3.5 py-2 flex gap-1">
              <span className="size-1.5 rounded-full bg-iris animate-bounce" />
              <span className="size-1.5 rounded-full bg-iris animate-bounce [animation-delay:0.15s]" />
              <span className="size-1.5 rounded-full bg-iris animate-bounce [animation-delay:0.3s]" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Hint shelf */}
      <div className="px-3 pt-2 pb-1 border-t border-white/[0.04]">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 mb-1.5">
          Preciso de uma pista
        </div>
        <div className="flex gap-1.5">
          <HintBtn level={1} onClick={() => askHint(1)}>Vago</HintBtn>
          <HintBtn level={2} onClick={() => askHint(2)}>Médio</HintBtn>
          <HintBtn level={3} onClick={() => askHint(3)}>Quase direto</HintBtn>
        </div>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex gap-2 items-end">
          <div className="flex-1 rounded-xl bg-white/[0.03] border border-white/[0.08] focus-within:border-iris/40 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendUser();
                }
              }}
              placeholder="Pense primeiro. Depois pergunte..."
              rows={2}
              className="w-full bg-transparent text-[13.5px] resize-none outline-none px-3 py-2.5 placeholder:text-muted-foreground/50"
            />
          </div>
          <button
            onClick={sendUser}
            disabled={!input.trim() || thinking}
            className="size-10 rounded-xl bg-foreground text-background grid place-items-center disabled:opacity-40 hover:bg-foreground/90 transition-colors shrink-0"
          >
            <Send className="size-3.5" />
          </button>
        </div>
        <div className="mt-2 text-[10px] font-mono text-muted-foreground/50 px-1">
          enter para enviar · shift+enter quebra linha
        </div>
      </div>
    </>
  );
}

function HintBtn({
  level,
  onClick,
  children,
}: {
  level: 1 | 2 | 3;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const cost = level * 4;
  return (
    <button
      onClick={onClick}
      className="group flex-1 rounded-lg bg-white/[0.025] border border-white/[0.05] hover:border-warning/30 hover:bg-warning/5 transition-all px-2.5 py-1.5 text-left"
    >
      <div className="flex items-center gap-1 text-[11px] font-medium">
        <Lightbulb className="size-3 text-warning" />
        {children}
      </div>
      <div className="text-[9px] font-mono text-muted-foreground/60 mt-0.5">
        -{cost} pts indep.
      </div>
    </button>
  );
}

function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("`") ? (
          <code key={i} className="text-iris font-mono text-[12.5px] bg-iris/5 px-1 py-0.5 rounded">
            {p.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

function ReviewModal({
  independence,
  hintsUsed,
  onClose,
}: {
  independence: number;
  hintsUsed: number;
  onClose: () => void;
}) {
  const questions = [
    {
      q: "Você usou `findAll()` e depois filtrou em memória. Em prod, com 100k produtos, isso escala?",
      hint: "Pense em como o SQL faria isso direto no banco.",
    },
    {
      q: "Sua condição compara datas com `>`. Para datas ISO string, isso é confiável? Em todos os fusos?",
      hint: "Tente com `2026-01-01T23:00:00Z` vs `2026-01-02T01:00:00-03:00`.",
    },
    {
      q: "Você retornou todos os campos do produto. O cliente disse que precisa de quais?",
      hint: "Releia o briefing. Menos é mais.",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xl grid place-items-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-2xl w-full rounded-3xl border-gradient noise overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="size-8 rounded-full bg-white/[0.05] border border-white/[0.08] grid place-items-center hover:bg-white/[0.1] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-8 pt-10 pb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-iris/10 border border-iris/20 px-3 py-1 text-[11px] font-mono text-iris mb-5">
            <GitPullRequestArrow className="size-3" />
            Code Review Socrático
          </div>
          <h2 className="font-heading text-3xl font-semibold tracking-[-0.02em] leading-tight mb-2">
            Você submeteu. Agora vamos{" "}
            <span className="font-serif italic font-normal text-gradient">
              defender
            </span>
            .
          </h2>
          <p className="text-muted-foreground">
            Três perguntas. Pra cada uma, escreva sua resposta antes de virar a
            pista.
          </p>
        </div>

        <div className="px-8 pb-6 space-y-3">
          {questions.map((q, i) => (
            <ReviewQuestion key={i} index={i + 1} {...q} />
          ))}
        </div>

        <div className="px-8 py-6 border-t border-white/[0.06] bg-white/[0.015]">
          <div className="grid grid-cols-3 gap-3 mb-5">
            <Metric label="Independência" value={`${independence}%`} accent="mint" />
            <Metric label="Hints usados" value={String(hintsUsed)} />
            <Metric label="Conceitos novos" value="filter · Date" accent="iris" />
          </div>
          <div className="flex gap-2">
            <Button
              size="lg"
              variant="ghost"
              onClick={onClose}
              className="rounded-full flex-1"
            >
              Revisar de novo
            </Button>
            <Button
              size="lg"
              className="rounded-full flex-1 bg-foreground text-background border-transparent hover:bg-foreground/90"
              render={<Link href="/dashboard" />}
            >
              Ver progresso <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ReviewQuestion({
  index,
  q,
  hint,
}: {
  index: number;
  q: string;
  hint: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-2xl glass p-4">
      <div className="flex gap-3">
        <div className="size-6 shrink-0 rounded-full bg-white/[0.04] border border-white/[0.08] grid place-items-center text-[11px] font-mono text-muted-foreground">
          {index}
        </div>
        <div className="flex-1">
          <p className="text-[14px] text-foreground/95 leading-relaxed">
            <FormattedText text={q} />
          </p>
          <button
            onClick={() => setOpen((v) => !v)}
            className="mt-2 text-[11px] font-mono text-iris/80 hover:text-iris transition-colors"
          >
            {open ? "esconder dica" : "preciso de uma dica →"}
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 text-[13px] text-muted-foreground italic">
                  <FormattedText text={hint} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "mint" | "iris";
}) {
  return (
    <div className="rounded-xl bg-white/[0.025] border border-white/[0.05] p-3">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 mb-1">
        {label}
      </div>
      <div
        className={cn(
          "font-heading font-semibold text-lg tabular-nums",
          accent === "mint" && "text-mint",
          accent === "iris" && "text-iris"
        )}
      >
        {value}
      </div>
    </div>
  );
}
