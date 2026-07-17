import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  SITE_IMAGE_SLOTS,
  findSlot,
  type SiteImageKey,
  type SiteImages,
} from "@/lib/siteImages";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role === "STAFF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: SITE_IMAGE_SLOTS.map((s) => s.settingKey) } },
  });
  const bySettingKey = new Map(rows.map((r) => [r.key, r.value]));

  const images = {} as SiteImages;
  for (const slot of SITE_IMAGE_SLOTS) {
    const v = bySettingKey.get(slot.settingKey);
    images[slot.key] = v && v.trim() ? v : slot.defaultUrl;
  }

  return NextResponse.json({
    images,
    slots: SITE_IMAGE_SLOTS.map((s) => ({
      key: s.key,
      label: s.label,
      description: s.description,
      defaultUrl: s.defaultUrl,
      recommended: s.recommended,
      isOverridden: bySettingKey.has(s.settingKey),
    })),
  });
}

const patchSchema = z.object({
  key: z.string(),
  url: z.string().url().nullable(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role === "STAFF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const slot = findSlot(parsed.data.key);
  if (!slot) {
    return NextResponse.json({ error: "Unknown image slot" }, { status: 400 });
  }

  if (parsed.data.url === null) {
    await prisma.siteSetting
      .delete({ where: { key: slot.settingKey } })
      .catch(() => null);
    return NextResponse.json({
      key: slot.key as SiteImageKey,
      url: slot.defaultUrl,
      isOverridden: false,
    });
  }

  const row = await prisma.siteSetting.upsert({
    where: { key: slot.settingKey },
    update: { value: parsed.data.url },
    create: { key: slot.settingKey, value: parsed.data.url },
  });

  return NextResponse.json({
    key: slot.key as SiteImageKey,
    url: row.value,
    isOverridden: true,
  });
}
