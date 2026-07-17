import { NextResponse } from "next/server";
import { ActionError, getUserPerformanceStats } from "@/lib/actions/users";

function handleError(error: unknown) {
  if (error instanceof ActionError) {
    const status =
      error.code === "FORBIDDEN"
        ? 403
        : error.code === "NOT_FOUND"
          ? 404
          : 400;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }
  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const stats = await getUserPerformanceStats(
      id,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );

    return NextResponse.json({ stats });
  } catch (error) {
    return handleError(error);
  }
}
