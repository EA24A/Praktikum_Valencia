-- CreateTable
CREATE TABLE "LuggageStorage" (
    "id" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "durationHours" INTEGER NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "pickedUpAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LuggageStorage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LuggageStorage_startedAt_idx" ON "LuggageStorage"("startedAt");

-- CreateIndex
CREATE INDEX "LuggageStorage_pickedUpAt_idx" ON "LuggageStorage"("pickedUpAt");

-- CreateIndex
CREATE INDEX "LuggageStorage_createdById_idx" ON "LuggageStorage"("createdById");

-- AddForeignKey
ALTER TABLE "LuggageStorage" ADD CONSTRAINT "LuggageStorage_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
