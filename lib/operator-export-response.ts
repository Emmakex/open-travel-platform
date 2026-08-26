import type { ExportFormat, TabularExport } from "@/lib/tabular-export";
import {
  exportContentType,
  renderTabularExport,
  safeExportFilename
} from "@/lib/tabular-export";

export function parseExportFormat(value: string | null): ExportFormat | null {
  if (!value || value === "csv") return "csv";
  if (value === "xlsx") return "xlsx";
  return null;
}

export function operatorExportResponse<Row>(input: {
  table: TabularExport<Row>;
  format: ExportFormat;
  filename: string;
}) {
  const bytes = renderTabularExport(input.table, input.format);
  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": exportContentType(input.format),
      "Content-Disposition": `attachment; filename="${safeExportFilename(input.filename, input.format)}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
