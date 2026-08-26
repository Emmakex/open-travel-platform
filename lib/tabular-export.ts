import { strToU8, zipSync } from "fflate";

export type TabularValue = string | number | boolean | null | undefined;

export type TabularColumn<Row> = {
  key: string;
  label: string;
  width?: number;
  value: (row: Row) => TabularValue;
};

export type TabularExport<Row> = {
  sheetName: string;
  columns: TabularColumn<Row>[];
  rows: Row[];
};

export type ExportFormat = "csv" | "xlsx";

function cleanControlCharacters(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

/**
 * Spreadsheet applications can interpret CSV cells beginning with formula
 * control characters. Prefixing a literal apostrophe keeps exported user data
 * as text when a CSV is opened interactively.
 */
export function safeSpreadsheetText(value: string) {
  const clean = cleanControlCharacters(value);
  return /^[=+\-@\t\r]/.test(clean) ? `'${clean}` : clean;
}

function csvCell(value: TabularValue) {
  if (value === null || value === undefined) return "";
  const raw = typeof value === "string" ? safeSpreadsheetText(value) : String(value);
  return `"${raw.replace(/"/g, '""')}"`;
}

export function renderCsv<Row>(input: TabularExport<Row>) {
  const lines = [
    input.columns.map((column) => csvCell(column.label)).join(","),
    ...input.rows.map((row) => input.columns.map((column) => csvCell(column.value(row))).join(","))
  ];
  return Buffer.from(`\uFEFF${lines.join("\r\n")}\r\n`, "utf8");
}

function xmlEscape(value: string) {
  return cleanControlCharacters(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function columnName(index: number) {
  let value = index + 1;
  let output = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    output = String.fromCharCode(65 + remainder) + output;
    value = Math.floor((value - 1) / 26);
  }
  return output;
}

function xlsxCell(ref: string, value: TabularValue, style = 0) {
  if (value === null || value === undefined || value === "") return `<c r="${ref}" s="${style}"/>`;
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${ref}" s="${style}"><v>${value}</v></c>`;
  }
  if (typeof value === "boolean") {
    return `<c r="${ref}" t="b" s="${style}"><v>${value ? 1 : 0}</v></c>`;
  }
  const text = xmlEscape(safeSpreadsheetText(String(value)));
  return `<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${text}</t></is></c>`;
}

function safeSheetName(value: string) {
  const cleaned = value.replace(/[\\/*?:\[\]]/g, " ").trim().slice(0, 31);
  return cleaned || "Export";
}

function worksheetXml<Row>(input: TabularExport<Row>) {
  const columnWidths = input.columns.map((column, index) => {
    const width = Math.max(8, Math.min(60, column.width ?? Math.max(12, column.label.length + 2)));
    return `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`;
  }).join("");

  const header = `<row r="1">${input.columns.map((column, index) => xlsxCell(`${columnName(index)}1`, column.label, 1)).join("")}</row>`;
  const rows = input.rows.map((row, rowIndex) => {
    const excelRow = rowIndex + 2;
    const cells = input.columns.map((column, columnIndex) =>
      xlsxCell(`${columnName(columnIndex)}${excelRow}`, column.value(row))
    ).join("");
    return `<row r="${excelRow}">${cells}</row>`;
  }).join("");

  const lastColumn = columnName(Math.max(0, input.columns.length - 1));
  const lastRow = Math.max(1, input.rows.length + 1);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastColumn}${lastRow}"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>${columnWidths}</cols>
  <sheetData>${header}${rows}</sheetData>
  <autoFilter ref="A1:${lastColumn}${lastRow}"/>
</worksheet>`;
}

export function renderXlsx<Row>(input: TabularExport<Row>) {
  const sheetName = xmlEscape(safeSheetName(input.sheetName));
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),
    "xl/workbook.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="${sheetName}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),
    "xl/styles.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD9EAF7"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="1" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`),
    "xl/worksheets/sheet1.xml": strToU8(worksheetXml(input))
  };
  return Buffer.from(zipSync(files, { level: 6 }));
}

export function renderTabularExport<Row>(input: TabularExport<Row>, format: ExportFormat) {
  return format === "xlsx" ? renderXlsx(input) : renderCsv(input);
}

export function exportContentType(format: ExportFormat) {
  return format === "xlsx"
    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    : "text/csv; charset=utf-8";
}

export function safeExportFilename(base: string, format: ExportFormat) {
  const token = base.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "export";
  return `${token}.${format}`;
}
