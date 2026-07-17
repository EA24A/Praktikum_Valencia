"use server";

import { addHours } from "date-fns";
import { auth } from "@/auth";
import { formatDecimal } from "@/lib/calculations";
import { calculateLuggagePrice } from "@/lib/luggage/pricing";
import {
  isValidGuestEmail,
  normalizeGuestEmail,
} from "@/lib/luggage/email-providers";
import { prisma } from "@/lib/prisma";

async function requireEmployeeSession() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "EMPLOYEE" && session.user.role !== "SUPERADMIN") {
    return null;
  }
  return session;
}

export type LuggageStorageItem = {
  id: string;
  guestName: string;
  phoneNumber: string;
  guestEmail: string | null;
  startedAt: string;
  durationHours: number;
  bagCount: number;
  price: number;
  endsAt: string;
  isPaid: boolean;
  pickedUpAt: string | null;
  notes: string | null;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

function serializeEntry(entry: {
  id: string;
  guestName: string;
  phoneNumber: string;
  guestEmail: string | null;
  startedAt: Date;
  durationHours: number;
  bagCount: number;
  price: { toNumber?: () => number } | number | string;
  isPaid: boolean;
  pickedUpAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { name: string };
}): LuggageStorageItem {
  return {
    id: entry.id,
    guestName: entry.guestName,
    phoneNumber: entry.phoneNumber,
    guestEmail: entry.guestEmail,
    startedAt: entry.startedAt.toISOString(),
    durationHours: entry.durationHours,
    bagCount: entry.bagCount,
    price: Number(entry.price),
    endsAt: addHours(entry.startedAt, entry.durationHours).toISOString(),
    isPaid: entry.isPaid,
    pickedUpAt: entry.pickedUpAt?.toISOString() ?? null,
    notes: entry.notes,
    createdByName: entry.createdBy.name,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

const entryInclude = {
  createdBy: { select: { name: true } },
} as const;

export async function listLuggageStorage(options?: {
  activeOnly?: boolean;
}): Promise<
  { success: true; data: LuggageStorageItem[] } | { success: false; error: "FORBIDDEN" }
> {
  const session = await requireEmployeeSession();
  if (!session) {
    return { success: false, error: "FORBIDDEN" };
  }

  const entries = await prisma.luggageStorage.findMany({
    where: options?.activeOnly ? { pickedUpAt: null } : undefined,
    include: entryInclude,
    orderBy: options?.activeOnly
      ? { startedAt: "asc" }
      : [{ pickedUpAt: "asc" }, { startedAt: "desc" }],
  });

  const data = entries.map(serializeEntry);
  if (options?.activeOnly) {
    data.sort(
      (a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime(),
    );
  }

  return { success: true, data };
}

export async function createLuggageStorage(input: {
  guestName: string;
  phoneNumber: string;
  guestEmail?: string;
  startedAt: string;
  durationHours: number;
  bagCount?: number;
  isPaid?: boolean;
  notes?: string;
}): Promise<
  | { success: true; data: LuggageStorageItem }
  | { success: false; error: "FORBIDDEN" | "VALIDATION" }
> {
  const session = await requireEmployeeSession();
  if (!session) {
    return { success: false, error: "FORBIDDEN" };
  }

  const guestName = input.guestName.trim();
  const phoneNumber = input.phoneNumber.trim();
  const guestEmail = normalizeGuestEmail(input.guestEmail ?? "");
  const startedAt = new Date(input.startedAt);
  const durationHours = Math.round(input.durationHours);
  const bagCount = Math.round(input.bagCount ?? 1);

  if (!guestName || !phoneNumber) {
    return { success: false, error: "VALIDATION" };
  }
  if (input.guestEmail?.trim() && !guestEmail) {
    return { success: false, error: "VALIDATION" };
  }
  if (guestEmail && !isValidGuestEmail(guestEmail)) {
    return { success: false, error: "VALIDATION" };
  }
  if (Number.isNaN(startedAt.getTime())) {
    return { success: false, error: "VALIDATION" };
  }
  if (durationHours < 1 || durationHours > 168) {
    return { success: false, error: "VALIDATION" };
  }
  if (bagCount < 1 || bagCount > 20) {
    return { success: false, error: "VALIDATION" };
  }

  const price = formatDecimal(calculateLuggagePrice(durationHours, bagCount));
  const isPaid = input.isPaid ?? false;

  const entry = await prisma.luggageStorage.create({
    data: {
      guestName,
      phoneNumber,
      guestEmail,
      startedAt,
      durationHours,
      bagCount,
      price,
      isPaid,
      notes: input.notes?.trim() || null,
      createdById: session.user.id,
    },
    include: entryInclude,
  });

  return { success: true, data: serializeEntry(entry) };
}

export async function updateLuggageStorage(
  id: string,
  input: {
    guestName?: string;
    phoneNumber?: string;
    guestEmail?: string | null;
    startedAt?: string;
    durationHours?: number;
    bagCount?: number;
    isPaid?: boolean;
    notes?: string | null;
    pickedUp?: boolean;
  },
): Promise<
  | { success: true; data: LuggageStorageItem }
  | { success: false; error: "FORBIDDEN" | "NOT_FOUND" | "VALIDATION" }
> {
  const session = await requireEmployeeSession();
  if (!session) {
    return { success: false, error: "FORBIDDEN" };
  }

  const existing = await prisma.luggageStorage.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "NOT_FOUND" };
  }

  const data: {
    guestName?: string;
    phoneNumber?: string;
    guestEmail?: string | null;
    startedAt?: Date;
    durationHours?: number;
    bagCount?: number;
    price?: number;
    isPaid?: boolean;
    notes?: string | null;
    pickedUpAt?: Date | null;
  } = {};

  if (input.guestName !== undefined) {
    const guestName = input.guestName.trim();
    if (!guestName) return { success: false, error: "VALIDATION" };
    data.guestName = guestName;
  }

  if (input.phoneNumber !== undefined) {
    const phoneNumber = input.phoneNumber.trim();
    if (!phoneNumber) return { success: false, error: "VALIDATION" };
    data.phoneNumber = phoneNumber;
  }

  if (input.guestEmail !== undefined) {
    const guestEmail = normalizeGuestEmail(input.guestEmail ?? "");
    if (input.guestEmail?.trim() && !guestEmail) {
      return { success: false, error: "VALIDATION" };
    }
    if (guestEmail && !isValidGuestEmail(guestEmail)) {
      return { success: false, error: "VALIDATION" };
    }
    data.guestEmail = guestEmail;
  }

  if (input.startedAt !== undefined) {
    const startedAt = new Date(input.startedAt);
    if (Number.isNaN(startedAt.getTime())) {
      return { success: false, error: "VALIDATION" };
    }
    data.startedAt = startedAt;
  }

  if (input.durationHours !== undefined) {
    const durationHours = Math.round(input.durationHours);
    if (durationHours < 1 || durationHours > 168) {
      return { success: false, error: "VALIDATION" };
    }
    data.durationHours = durationHours;
  }

  if (input.bagCount !== undefined) {
    const bagCount = Math.round(input.bagCount);
    if (bagCount < 1 || bagCount > 20) {
      return { success: false, error: "VALIDATION" };
    }
    data.bagCount = bagCount;
  }

  if (input.durationHours !== undefined || input.bagCount !== undefined) {
    const durationHours = data.durationHours ?? existing.durationHours;
    const bagCount = data.bagCount ?? existing.bagCount;
    data.price = formatDecimal(calculateLuggagePrice(durationHours, bagCount));
  }

  if (input.isPaid !== undefined) {
    data.isPaid = input.isPaid;
  }

  if (input.notes !== undefined) {
    data.notes = input.notes?.trim() || null;
  }

  if (input.pickedUp === true) {
    data.pickedUpAt = new Date();
  } else if (input.pickedUp === false) {
    data.pickedUpAt = null;
  }

  const entry = await prisma.luggageStorage.update({
    where: { id },
    data,
    include: entryInclude,
  });

  return { success: true, data: serializeEntry(entry) };
}

export async function deleteLuggageStorage(id: string): Promise<
  | { success: true }
  | { success: false; error: "FORBIDDEN" | "NOT_FOUND" }
> {
  const session = await requireEmployeeSession();
  if (!session) {
    return { success: false, error: "FORBIDDEN" };
  }

  const existing = await prisma.luggageStorage.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "NOT_FOUND" };
  }

  await prisma.luggageStorage.delete({ where: { id } });
  return { success: true };
}
