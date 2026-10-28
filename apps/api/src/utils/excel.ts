import type { Response } from "express";
import ExcelJS from "exceljs";

// Hard cap on rows in one admin export — keeps a single request from
// building an unbounded workbook in memory. Narrow the filters to go beyond it.
export const EXPORT_ROW_LIMIT = 10_000;

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export interface SheetColumn<T> {
  header: string;
  width?: number;
  // "date" cells are written as real Excel dates (sortable/filterable), "money"
  // as numbers with a ₹ format, everything else as-is.
  format?: "date" | "money";
  value: (row: T) => string | number | Date | null | undefined;
}

export function addSheet<T>(
  workbook: ExcelJS.Workbook,
  name: string,
  columns: SheetColumn<T>[],
  rows: T[]
): void {
  const sheet = workbook.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = columns.map((c, i) => ({
    header: c.header,
    key: String(i),
    width: c.width ?? Math.max(12, c.header.length + 2),
    style:
      c.format === "date"
        ? { numFmt: "dd-mmm-yyyy hh:mm" }
        : c.format === "money"
          ? { numFmt: '"₹"#,##0.00' }
          : {},
  }));
  for (const row of rows) {
    sheet.addRow(
      columns.map((c) => {
        const v = c.value(row);
        // Excel dates have no timezone — shift to IST wall-clock time so the
        // sheet reads the same as the admin panel does in India.
        return v instanceof Date ? new Date(v.getTime() + IST_OFFSET_MS) : (v ?? "");
      })
    );
  }
  sheet.getRow(1).font = { bold: true };
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
}

export async function sendWorkbook(
  res: Response,
  workbook: ExcelJS.Workbook,
  baseName: string
): Promise<void> {
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=${baseName}-${stamp}.xlsx`);
  // The admin app reads the filename off this header; CORS hides it otherwise.
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
  await workbook.xlsx.write(res);
  res.end();
}

// Admin date filters are calendar days in India time ("2026-10-01" means the
// whole IST day), not UTC midnights.
export function istDateRange(from?: string, to?: string): Record<string, Date> | undefined {
  const range: Record<string, Date> = {};
  if (from) range.$gte = new Date(`${from}T00:00:00.000+05:30`);
  if (to) range.$lte = new Date(`${to}T23:59:59.999+05:30`);
  return Object.keys(range).length ? range : undefined;
}
