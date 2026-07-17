import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.adminUser.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, email, password, role } = await req.json();
  if (!name || !email || !password) return NextResponse.json({ error: "name, email, password required" }, { status: 400 });

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.adminUser.create({
    data: { name, email, password: hashed, role: role ?? "STAFF" },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });
  return NextResponse.json(user, { status: 201 });
}
