"use client";

import { useTranslations } from "next-intl";
import { Download, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";

interface ExportButtonsProps {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  exportType?: string;
  from?: string;
  to?: string;
}

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const lines = [
    headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
    ...rows.map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadPdf(title: string, headers: string[], rows: (string | number)[][]) {
  const doc = new jsPDF({ orientation: rows.length > 8 ? "landscape" : "portrait" });
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(9);

  const colCount = headers.length;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const tableWidth = pageWidth - margin * 2;
  const colWidth = tableWidth / colCount;
  let y = 26;

  headers.forEach((header, i) => {
    doc.text(String(header), margin + i * colWidth, y);
  });
  y += 6;
  doc.line(margin, y - 2, pageWidth - margin, y - 2);

  for (const row of rows) {
    if (y > doc.internal.pageSize.getHeight() - 14) {
      doc.addPage();
      y = 20;
    }
    row.forEach((cell, i) => {
      const text = String(cell);
      const truncated = text.length > 28 ? `${text.slice(0, 25)}...` : text;
      doc.text(truncated, margin + i * colWidth, y);
    });
    y += 6;
  }

  doc.save(`${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

export function ExportButtons({
  title,
  headers,
  rows,
  exportType,
  from,
  to,
}: ExportButtonsProps) {
  const t = useTranslations("common");
  const filename = `${title.toLowerCase().replace(/\s+/g, "-")}.csv`;

  function handleCsvExport() {
    if (exportType && from && to) {
      const params = new URLSearchParams({ from, to });
      window.open(`/api/reports/export/${exportType}?${params}`, "_blank");
      return;
    }
    downloadCsv(filename, headers, rows);
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleCsvExport}>
        <Download className="mr-1.5 h-3.5 w-3.5" />
        {t("exportCsv")}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadPdf(title, headers, rows)}
      >
        <FileText className="mr-1.5 h-3.5 w-3.5" />
        {t("exportPdf")}
      </Button>
    </div>
  );
}
