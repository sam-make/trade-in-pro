import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ownerAccess } from "@/lib/super-admin.functions";
import { useEffect, useState, type ReactNode } from "react";
import { recordShopPresence } from "@/lib/owner-analytics.functions";
import { AlertTriangle, Gauge, Home, Loader2, History, LogOut, Menu, MoreHorizontal, Settings, Sparkles, Store, Users, Wrench, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { PageTransition } from "@/components/motion";
import { cn } from "@/lib/utils";
import { ThemeControls } from "@/components/app/ThemeProvider";

const NAV = [
  { to: "/tableau-de-bord", label: "Tableau de bord", icon: Gauge },
  { to: "/reparations", label: "Réparations", icon: Wrench },
  { to: "/estimation", label: "Estimation", icon: Sparkles },
  { to: "/historique", label: "Historique", icon: History },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/administration", label: "Administration", icon: Settings, adminOnly: true },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: workspace, isLoading: workspaceLoading, isError: workspaceError, refetch } = useWorkspace();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);
  const ownerFn = useServerFn(ownerAccess);
  const owner = useQuery({ queryKey: ["owner-access"], queryFn: () => ownerFn(), retry: false });
  const presenceFn = useServerFn(recordShopPresence);
  const presenceShopId = workspace?.shop.id;
  useEffect(() => {
    if (!presenceShopId) return;
    const record = () => {
      if (document.visibilityState === "visible") void presenceFn().catch(() => undefined);
    };
    record();
    const interval = window.setInterval(record, 300_000);
    document.addEventListener("visibilitychange", record);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", record); };
  }, [presenceFn, presenceShopId]);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/connexion", replace: true });
  }

  // Admin link stays visible (as a loading placeholder) until the role is known,
  // so a slow or failed workspace load never silently hides it.
  const roleKnown = Boolean(workspace);
  const items = NAV.filter((item) => !("adminOnly" in item && item.adminOnly) || !roleKnown || workspace?.role === "admin");

  const nav = (
    <nav aria-label="Navigation de la boutique" className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? "page" : undefined}
            onClick={() => setOpen(false)}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-200",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
            {"adminOnly" in item && item.adminOnly && workspaceLoading && (
              <Loader2 className="ml-auto size-3.5 animate-spin text-muted-foreground" aria-label="Chargement du rôle" />
            )}
          </Link>
        );
      })}
      {owner.data === true && <Link to="/admin" onClick={() => setOpen(false)} className={cn("flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium", pathname === "/admin" ? "bg-accent text-primary" : "text-muted-foreground")}><Settings className="size-4" />Super Administration</Link>}
    </nav>
  );

  return (
    <div className="min-h-dvh w-full bg-background lg:p-5">
    <div className="flex min-h-dvh w-full bg-surface lg:min-h-[calc(100dvh-2.5rem)] lg:overflow-clip lg:rounded-2xl lg:border lg:border-border lg:shadow-[var(--shadow-panel)]">
      <aside className="sticky top-0 hidden h-[calc(100dvh-2.5rem)] w-60 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 lg:flex">
        <Link to="/tableau-de-bord" className="px-2">
          <Logo />
        </Link>
        <div className="mt-8 flex-1">{nav}</div>
        <div className="border-t border-border px-2 pt-5">
          <div className="flex items-center gap-3">
            <Store className="size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{workspace?.shop.name ?? "…"}</p>
              <p className="truncate text-xs text-muted-foreground">{workspace?.profile.full_name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start" onClick={handleSignOut}>
            <LogOut className="size-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-3">
            <Link to="/tableau-de-bord" className="lg:hidden"><Logo /></Link>
            <span className="hidden text-sm font-medium text-muted-foreground first-letter:uppercase lg:block">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </span>
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <ThemeControls />
            <span className="flex size-10 items-center justify-center rounded-full border border-border bg-accent text-sm font-semibold text-primary" title={workspace?.profile.full_name ?? undefined} aria-hidden>
              {(workspace?.profile.full_name ?? "?").trim().charAt(0).toUpperCase()}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((value) => !value)} aria-label={open ? "Fermer le menu" : "Menu"} aria-expanded={open} aria-controls="mobile-workshop-menu">
            {open ? <X /> : <Menu />}
          </Button>
        </header>

        {open && (
          <div id="mobile-workshop-menu" className="fixed inset-x-0 bottom-16 top-16 z-40 overflow-y-auto border-b border-border bg-surface px-4 py-5 lg:hidden">
            <p className="mb-4 border-b border-border pb-4 text-sm font-semibold text-ink">{workspace?.shop.name ?? "Chargement…"}</p>
            {nav}
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4"><span className="text-sm text-muted-foreground">Apparence</span><ThemeControls /></div>
            <Button variant="ghost" size="sm" className="mt-2 w-full justify-start" onClick={handleSignOut}>
              <LogOut className="size-4" />
              Déconnexion
            </Button>
          </div>
        )}

        {workspaceError && (
          <div role="alert" className="flex flex-wrap items-center gap-3 border-b border-destructive/30 bg-destructive/10 px-5 py-3 text-sm text-destructive lg:px-8">
            <AlertTriangle className="size-4" />
            <span className="flex-1">Impossible de charger votre boutique. Certaines rubriques peuvent être indisponibles.</span>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Réessayer
            </Button>
          </div>
        )}

        <main className="workshop-main min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <nav aria-label="Navigation mobile" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        {[
          { to: "/tableau-de-bord", label: "Accueil", icon: Home },
          { to: "/reparations", label: "Réparations", icon: Wrench },
          { to: "/estimation", label: "Estimation", icon: Sparkles },
        ].map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
          return <Link key={item.to} to={item.to} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium", active ? "text-primary" : "text-muted-foreground")}><item.icon className="size-5" />{item.label}</Link>;
        })}
        <Button variant="ghost" className={cn("min-h-16 flex-col gap-1 rounded-none text-[11px] font-medium", open || ["/clients", "/historique", "/administration", "/admin"].some((path) => pathname.startsWith(path)) ? "text-primary" : "text-muted-foreground")} onClick={() => setOpen((value) => !value)} aria-label="Plus de rubriques" aria-expanded={open} aria-controls="mobile-workshop-menu"><MoreHorizontal className="size-5" />Plus</Button>
      </nav>
    </div>
    </div>
  );
}