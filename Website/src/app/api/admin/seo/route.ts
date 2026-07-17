import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  pageKey: z.string(),
  locale: z.string(),
  title: z.string(),
  description: z.string(),
  keywords: z.string().optional(),
  ogImageUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role === "STAFF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data = schema.parse(body);

  await prisma.seoSetting.upsert({
    where: { pageKey_locale: { pageKey: data.pageKey, locale: data.locale } },
    update: {
      title: data.title,
      description: data.description,
      keywords: data.keywords,
      ogImageUrl: data.ogImageUrl,
    },
    create: {
      pageKey: data.pageKey,
      locale: data.locale,
      title: data.title,
      description: data.description,
      keywords: data.keywords,
      ogImageUrl: data.ogImageUrl,
    },
  });

  return NextResponse.json({ ok: true });
}
