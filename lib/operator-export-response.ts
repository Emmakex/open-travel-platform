import type { ExportFormat, TabularExport } from "@/lib/tabular-export";
import {
  exportContentType,
  renderTabularExport,
  safeExportFilename
} from "@/lib/tabular-export";

/**
 * The HTTP response boundary is intentionally row-shape agnostic. Each report
 * builder remains strongly typed; once a complete TabularExport reaches this
 * function, serialization only needs the table's own value callbacks.
 */
export function operatorExportResponse(input: {
  table: TabularExport<any>;
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
