import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { ThemeControls } from "@/components/app/ThemeProvider";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export function Missing({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-warning/15 px-1.5 py-0.5 font-medium text-foreground">
      À compléter : {children}
    </span>
  );
}

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link to="/" aria-label="Retour à l’accueil">
            <Logo />
          </Link>
          <ThemeControls />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-6"><Link to="/"><ArrowLeft />Accueil</Link></Button>
        <p className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
          Document préparatoire : les mentions signalées « À compléter » doivent être renseignées et
          validées avant toute mise en ligne commerciale. Ce document n’a pas encore été validé par un professionnel du droit.
        </p>
        <h1 className="mt-8 text-3xl font-semibold text-ink">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Dernière mise à jour : {updated}</p>
        {children}
      </main>
    </div>
  );
}
