import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { getSettings, updateSettingsData } from "@/lib/actions/settings";

function requireSuperadminApi() {
  return auth().then((session) => {
    if (!session?.user) {
      return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }
    if (session.user.role !== "SUPERADMIN") {
      return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
    return { session };
  });
}

export async function GET() {
  const result = await requireSuperadminApi();
  if ("error" in result && result.error) {
    return result.error;
  }

  try {
    const settings = await getSettings();
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: "Settings not found" }, { status: 404 });
  }
}

export async function PATCH(request: Request) {
  const result = await requireSuperadminApi();
  if ("error" in result && result.error) {
    return result.error;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const settings = await updateSettingsData(body);
    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten() },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
