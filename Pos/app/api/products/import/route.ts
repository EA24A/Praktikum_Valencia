import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  importProductsFromExcel,
  previewProductImport,
} from "@/lib/actions/product-import";

async function requireSuperadminApi() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "SUPERADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function POST(request: Request) {
  const authResult = await requireSuperadminApi();
  if ("error" in authResult && authResult.error) {
    return authResult.error;
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return NextResponse.json(
      { error: "Only .xlsx files are supported" },
      { status: 400 },
    );
  }

  const buffer = await file.arrayBuffer();
  const mode = formData.get("mode");
  const updateExisting = formData.get("updateExisting") !== "false";

  if (mode === "preview") {
    const preview = await previewProductImport(buffer);
    return NextResponse.json(preview);
  }

  const result = await importProductsFromExcel(buffer, { updateExisting });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
