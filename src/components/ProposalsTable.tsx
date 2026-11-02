import { Link } from "react-router-dom";

import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBRL, formatDate, formatDateOnly } from "@/lib/format";
import type { ProposalDetail } from "@/types/domain";

type Props = {
  items: ProposalDetail[] | undefined;
  emptyMessage: string;
};

export function ProposalsTable({ items, emptyMessage }: Props) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Banco</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead className="text-right">Financiado</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Próxima etapa</TableHead>
            <TableHead>Criada</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(items ?? []).map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <Link className="font-medium text-primary hover:underline" to={`/propostas/${p.id}`}>
                  #{p.id}
                </Link>
              </TableCell>
              <TableCell className="max-w-[220px] truncate">{p.client.name}</TableCell>
              <TableCell>{p.bank}</TableCell>
              <TableCell>
                <StatusBadge status={String(p.status)} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-right">{formatBRL(p.financed_amount)}</TableCell>
              <TableCell>{p.responsible.username}</TableCell>
              <TableCell className="whitespace-nowrap">{formatDateOnly(p.next_stage_date)}</TableCell>
              <TableCell className="whitespace-nowrap">{formatDate(p.created_at)}</TableCell>
            </TableRow>
          ))}
          {items && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
