"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ExportMenuButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/menu/export");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Export failed");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "casafenicia-products.xlsx";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al exportar la carta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="btn-outline inline-flex items-center gap-2 self-start"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      Exportar productos (XLSX)
    </button>
  );
}
