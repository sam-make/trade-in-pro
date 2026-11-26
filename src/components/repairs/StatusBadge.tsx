import { STATUS_LABELS, type RepairStatus } from "@/lib/repairs";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: RepairStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold",
        status === "annule" ? "bg-destructive/10 text-destructive"
          : status === "termine" || status === "restitue" ? "bg-success/15 text-success"
          : status === "attente_piece" || status === "attente_validation" ? "bg-warning/20 text-warning-foreground"
          : "bg-accent text-primary",
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}
