import { Suspense } from "react";
import { format } from "date-fns";
import {
  getAllReportsData,
  getDateRangeFromPreset,
  parseDateRangeParams,
  type DateRangePreset,
} from "@/lib/actions/reports";
import { ReportsPageClient } from "@/components/admin/reports/reports-page-client";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminReportsPageProps {
  searchParams: Promise<{
    preset?: string;
    from?: string;
    to?: string;
  }>;
}

function isValidPreset(value?: string): value is DateRangePreset {
  return (
    value === "today" ||
    value === "yesterday" ||
    value === "last7Days" ||
    value === "thisMonth" ||
    value === "custom"
  );
}

async function ReportsContent({
  searchParams,
}: {
  searchParams: AdminReportsPageProps["searchParams"];
}) {
  const params = await searchParams;
  const preset = isValidPreset(params.preset) ? params.preset : "today";

  const range =
    preset === "custom" && params.from && params.to
      ? parseDateRangeParams(params.from, params.to)
      : getDateRangeFromPreset(preset);

  const data = await getAllReportsData(range);

  return (
    <ReportsPageClient
      data={data}
      from={format(range.from, "yyyy-MM-dd")}
      to={format(range.to, "yyyy-MM-dd")}
      preset={preset}
    />
  );
}

export default function AdminReportsPage({
  searchParams,
}: AdminReportsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <ReportsContent searchParams={searchParams} />
    </Suspense>
  );
}
