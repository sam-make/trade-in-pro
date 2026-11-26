import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Ban, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { createEstimation } from "@/lib/workspace.functions";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  computePrice,
  resolveBasePrice,
  formatEuro,
  formatStorage,
  storageStep,
  type DeductionRule,
  type RuleCategory,
} from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/estimation")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Nouvelle estimation — Trade-In Pro" },
      { name: "description", content: "Estimez la reprise d'un iPhone en moins de deux minutes." },
      { property: "og:title", content: "Nouvelle estimation — Trade-In Pro" },
      { property: "og:description", content: "Diagnostic guidé et prix de reprise calculé instantanément." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EstimationPage,
});

interface Model {
  id: string;
  name: string;
  colors: string[];
  storages: number[];
  base_price: number;
}

function EstimationPage() {
  const navigate = useNavigate();
  const { data: workspace } = useWorkspace();
  const shopId = workspace?.shop.id;
  const save = useServerFn(createEstimation);

  const [modelId, setModelId] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [storage, setStorage] = useState<number | null>(null);
  const [imei, setImei] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const { data: models = [] } = useQuery({
    queryKey: ["models"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("device_models")
        .select("id, name, colors, storages, base_price")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data as Model[];
    },
  });

  const { data: rules = [] } = useQuery({
    queryKey: ["rules", shopId],
    enabled: Boolean(shopId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deduction_rules")
        .select("id, name, category, deduction, is_blocking, active, sort_order")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data as DeductionRule[];
    },
  });

  const { data: prices = [] } = useQuery({
    queryKey: ["shop-prices", shopId],
    enabled: Boolean(shopId),
    queryFn: async () => {
      const { data } = await supabase.from("shop_prices").select("model_id, color, storage_gb, base_price");
      return (data ?? []) as { model_id: string; color: string; storage_gb: number; base_price: number }[];
    },
  });

  const model = models.find((item) => item.id === modelId);

  const basePrice = useMemo(() => {
    if (!model || storage === null) return 0;
    const overrides = prices.filter((row) => row.model_id === model.id && row.storage_gb === storage);
    return resolveBasePrice(model.base_price, storage, color, overrides);
  }, [model, storage, color, prices]);

  const selectedRules = rules.filter((rule) => selected[rule.id]);
  const breakdown = computePrice(basePrice, selectedRules);
  const ready = Boolean(model && color && storage !== null);

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: rules.filter((rule) => rule.category === category),
  })).filter((group) => group.items.length > 0);

  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          modelId,
          color,
          storageGb: storage as number,
          imei: imei || null,
          ruleIds: selectedRules.map((rule) => rule.id),
          notes: null,
        },
      }),
    onSuccess: () => {
      toast.success("Estimation enregistrée.");
      navigate({ to: "/historique" });
    },
    onError: () => toast.error("Enregistrement impossible."),
  });

  function pickModel(id: string) {
    setModelId(id);
    setColor("");
    setStorage(null);
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 pb-24 lg:grid-cols-[1fr_340px] lg:pb-0">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink md:text-3xl">Nouvelle estimation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sélectionnez l'appareil puis parcourez le diagnostic. Le prix se met à jour instantanément.
          </p>
        </div>

        <section className="surface-card p-6">
          <h2 className="flex items-center gap-3 text-base font-semibold text-ink"><span className="grid size-7 place-items-center rounded-full bg-accent text-sm text-primary">1</span>Appareil</h2>
          <div className="mt-5 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="estimation-model">Modèle</Label>
              <select id="estimation-model" className="field-select" value={modelId} onChange={(event) => pickModel(event.target.value)}>
                <option value="">Choisir un iPhone</option>
                {models.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>

            {model && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="estimation-color">Couleur</Label>
                  <select id="estimation-color" className="field-select" value={color} onChange={(event) => setColor(event.target.value)}>
                    <option value="">Choisir une couleur</option>
                    {model.colors.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Stockage</Label>
                  <div className="flex flex-wrap gap-2">
                    {model.storages.map((item) => (
                      <Button
                        key={item}
                        type="button"
                        variant="outline"
                        aria-pressed={item === storage}
                        onClick={() => setStorage(item)}
                        className={cn(
                          "min-w-20 px-3.5 text-sm",
                          item === storage
                            ? "border-primary bg-accent text-accent-foreground"
                            : "border-border bg-surface text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {formatStorage(item)}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="max-w-xs space-y-2">
              <Label htmlFor="imei">IMEI (facultatif)</Label>
              <Input
                id="imei"
                value={imei}
                maxLength={20}
                onChange={(event) => setImei(event.target.value)}
                placeholder="35xxxxxxxxxxxxx"
              />
            </div>
          </div>
        </section>

        {grouped.map((group) => (
          <section key={group.category} className="surface-card p-6">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-ink">{CATEGORY_LABELS[group.category as RuleCategory]}</h2>
              {group.category === "blocage" && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="size-3" /> Bloque la reprise
                </Badge>
              )}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {group.items.map((rule) => (
                <label
                  key={rule.id}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-md border px-4 py-3 transition-colors",
                    selected[rule.id] ? "border-primary/50 bg-accent" : "border-border bg-surface",
                  )}
                >
                  <span className="text-sm text-foreground">{rule.name}</span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {rule.is_blocking ? "Blocage" : `−${formatEuro(Number(rule.deduction))}`}
                    </span>
                    <Switch
                      checked={Boolean(selected[rule.id])}
                      onCheckedChange={(value) =>
                        setSelected((prev) => ({ ...prev, [rule.id]: value }))
                      }
                    />
                  </span>
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>

      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="rounded-lg border border-border bg-accent/40 p-5 sm:p-6">
          <p className="text-sm text-muted-foreground">Prix de reprise proposé</p>
          <p
            className={cn(
              "mt-2 break-words font-[family-name:var(--font-display)] text-4xl font-semibold transition-all",
              breakdown.isBlocked ? "text-destructive" : "text-ink",
            )}
          >
            {breakdown.isBlocked ? "Bloqué" : formatEuro(breakdown.finalPrice)}
          </p>

          {breakdown.isBlocked && (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
              <Ban className="mt-0.5 size-3.5 shrink-0" />
              Reprise impossible : {breakdown.blocking.map((rule) => rule.name).join(", ")}.
            </p>
          )}

          <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Prix de base</dt>
              <dd className="font-medium text-ink">{formatEuro(breakdown.basePrice)}</dd>
            </div>
            {breakdown.applied
              .filter((rule) => Number(rule.deduction) > 0)
              .map((rule) => (
                <div key={rule.id} className="flex justify-between text-muted-foreground">
                  <dt className="truncate pr-3">{rule.name}</dt>
                  <dd>−{formatEuro(Number(rule.deduction))}</dd>
                </div>
              ))}
            <div className="flex justify-between border-t border-border pt-3">
              <dt className="text-muted-foreground">Total déductions</dt>
              <dd className="font-medium text-ink">−{formatEuro(breakdown.totalDeduction)}</dd>
            </div>
          </dl>

          <Button
            className="mt-6 w-full"
            size="lg"
            disabled={!ready || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            <Check className="size-4" />
            {mutation.isPending ? "Enregistrement…" : "Valider l'estimation"}
          </Button>
          {!ready && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Choisissez un modèle, une couleur et une capacité.
            </p>
          )}
        </div>
      </aside>
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 border-t border-border bg-accent px-4 py-3 lg:hidden">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Offre de reprise</p>
          <p className={cn("break-words text-xl font-semibold", breakdown.isBlocked ? "text-destructive" : "text-ink")}>{breakdown.isBlocked ? "Bloqué" : formatEuro(breakdown.finalPrice)}</p>
        </div>
        <Button disabled={!ready || mutation.isPending} onClick={() => mutation.mutate()}><Check />{mutation.isPending ? "Enregistrement…" : "Enregistrer"}</Button>
      </div>
    </div>
  );
}