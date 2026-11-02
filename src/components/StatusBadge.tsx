import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { proposalStatusLabel } from "@/types/domain";

const STATUS_CLASSES: Record<string, string> = {
  FINALIZADO: "border-transparent bg-emerald-100 text-emerald-800",
  CANCELADO: "border-transparent bg-red-100 text-red-800",
  ANALISE_CREDITO: "border-transparent bg-blue-100 text-blue-800",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap", STATUS_CLASSES[status], className)}>
      {proposalStatusLabel(status)}
    </Badge>
  );
}
