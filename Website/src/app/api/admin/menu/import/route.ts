import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncMenuFromCatalogBuffer } from "@/lib/menuImport";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role === "STAFF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing XLSX file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await syncMenuFromCatalogBuffer(buffer);

  return NextResponse.json({ ok: true, ...result });
}
