import Link from "next/link";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.05] mt-20">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid sm:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10">
          <div>
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              A IA que nunca te dá a resposta — ela te faz chegar lá.
            </p>
          </div>

          <FooterCol
            title="Produto"
            items={[
              { label: "Como funciona", href: "#metodo" },
              { label: "Desafios", href: "/onboarding" },
              { label: "Dashboard", href: "/dashboard" },
            ]}
          />
          <FooterCol
            title="Empresa"
            items={[
              { label: "Manifesto", href: "#precos" },
              { label: "Hackathon", href: "#" },
              { label: "Contato", href: "#" },
            ]}
          />
          <FooterCol
            title="Legal"
            items={[
              { label: "Privacidade", href: "#" },
              { label: "Termos", href: "#" },
            ]}
          />
        </div>

        <div className="mt-12 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground/70 font-mono">
          <div>© 2026 Socratic.dev · Hackathon Project</div>
          <div className="flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-mint animate-pulse" />
            online — powered by Claude
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/60 mb-3">
        {title}
      </div>
      <ul className="space-y-2.5">
        {items.map((it) => (
          <li key={it.label}>
            <Link
              href={it.href}
              className="text-sm text-foreground/80 hover:text-foreground transition-colors"
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
