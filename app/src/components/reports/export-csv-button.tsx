"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/csv-export";

interface ExportCsvButtonProps {
  /** Pre-built CSV string — build it server-side with `toCsv(rows, columns)`.
   *  `columns` contain functions, which can't cross the Server→Client boundary,
   *  so only the resulting string is passed down here. */
  csv: string;
  filename: string;
  disabled?: boolean;
}

/** Small "Exporter CSV" button reused across report tables. */
export function ExportCsvButton({ csv, filename, disabled = false }: ExportCsvButtonProps) {
  return (
    <Button variant="ghost" size="sm" disabled={disabled} onClick={() => downloadCsv(filename, csv)}>
      <Download className="h-3.5 w-3.5" />
      Exporter CSV
    </Button>
  );
}
