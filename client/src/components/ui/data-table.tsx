import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TD, TH, THead, TRow } from "@/components/ui/table";

interface Column<T> {
  key: string;
  title: string;
  render: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  loading: boolean;
  data: T[];
  columns: Column<T>[];
  emptyTitle: string;
  emptyDescription: string;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const DataTable = <T,>({
  loading,
  data,
  columns,
  emptyTitle,
  emptyDescription,
  page,
  totalPages,
  onPageChange,
}: DataTableProps<T>) => {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!data.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-4">
      <Table>
        <THead>
          <TRow>
            {columns.map((column) => (
              <TH key={column.key}>{column.title}</TH>
            ))}
          </TRow>
        </THead>
        <tbody>
          {data.map((item, index) => (
            <TRow key={index} className={index % 2 === 0 ? "bg-background" : "bg-muted/40"}>
              {columns.map((column) => (
                <TD key={column.key}>{column.render(item)}</TD>
              ))}
            </TRow>
          ))}
        </tbody>
      </Table>

      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages || 1}
        </p>
        <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
