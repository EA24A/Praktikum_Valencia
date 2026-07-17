"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { dateFnsLocaleForUi } from "@/lib/ui-locale";
import { toast } from "sonner";
import {
  Briefcase,
  Check,
  Clock,
  Mail,
  Pencil,
  Phone,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { calculateLuggagePrice } from "@/lib/luggage/pricing";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import {
  combinePhoneFields,
  PhoneNumberInput,
} from "@/components/shared/phone-number-input";
import { EmailProviderInput } from "@/components/shared/email-provider-input";
import { isValidGuestEmail } from "@/lib/luggage/email-providers";
import { parseStoredPhone } from "@/lib/phone/format-phone";
import type { LuggageStorageItem } from "@/lib/actions/luggage-storage";

type ViewFilter = "active" | "all";
type FormMode = "create" | "edit";

function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDateTimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

function isOverdue(item: LuggageStorageItem): boolean {
  if (item.pickedUpAt) return false;
  return new Date(item.endsAt).getTime() < Date.now();
}

export function LuggageStorageClient() {
  const t = useTranslations("luggageStorage");
  const tc = useTranslations("common");
  const locale = useLocale();
  const dateLocale = dateFnsLocaleForUi(locale);

  const [items, setItems] = useState<LuggageStorageItem[]>([]);
  const [filter, setFilter] = useState<ViewFilter>("active");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [guestName, setGuestName] = useState("");
  const [phoneCountryIso, setPhoneCountryIso] = useState("ES");
  const [phoneLocalNumber, setPhoneLocalNumber] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [startedAt, setStartedAt] = useState(toDateTimeLocalValue(new Date()));
  const [durationHours, setDurationHours] = useState("4");
  const [bagCount, setBagCount] = useState("1");
  const [isPaid, setIsPaid] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/luggage-storage?active=${filter === "active" ? "true" : "false"}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("load failed");
      const data = (await res.json()) as { items: LuggageStorageItem[] };
      setItems(data.items);
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [filter, t]);

  useEffect(() => {
    setLoading(true);
    void loadItems();
  }, [loadItems]);

  const activeCount = useMemo(
    () => items.filter((item) => !item.pickedUpAt).length,
    [items],
  );

  const quotedPrice = useMemo(() => {
    const hours = Number(durationHours);
    const bags = Number(bagCount);
    if (Number.isNaN(hours) || hours < 1 || Number.isNaN(bags) || bags < 1) return 0;
    return calculateLuggagePrice(hours, bags);
  }, [durationHours, bagCount]);

  function resetForm() {
    setGuestName("");
    setPhoneCountryIso("ES");
    setPhoneLocalNumber("");
    setGuestEmail("");
    setStartedAt(toDateTimeLocalValue(new Date()));
    setDurationHours("4");
    setBagCount("1");
    setIsPaid(false);
  }

  function openCreateDialog() {
    resetForm();
    setFormMode("create");
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEditDialog(item: LuggageStorageItem) {
    const phone = parseStoredPhone(item.phoneNumber);
    setGuestName(item.guestName);
    setPhoneCountryIso(phone.countryIso);
    setPhoneLocalNumber(phone.localNumber);
    setGuestEmail(item.guestEmail ?? "");
    setStartedAt(toDateTimeLocalValue(parseISO(item.startedAt)));
    setDurationHours(String(item.durationHours));
    setBagCount(String(item.bagCount ?? 1));
    setIsPaid(item.isPaid);
    setFormMode("edit");
    setEditingId(item.id);
    setDialogOpen(true);
  }

  const fullPhoneNumber = combinePhoneFields(phoneCountryIso, phoneLocalNumber);

  function validateForm(): boolean {
    if (!fullPhoneNumber) {
      toast.error(t("phoneRequired"));
      return false;
    }
    const emailTrimmed = guestEmail.trim();
    if (emailTrimmed && !isValidGuestEmail(emailTrimmed)) {
      toast.error(t("emailInvalid"));
      return false;
    }
    return true;
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!validateForm()) return;
    const emailTrimmed = guestEmail.trim();
    setSaving(true);
    try {
      const res = await fetch("/api/luggage-storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: guestName.trim(),
          phoneNumber: fullPhoneNumber,
          guestEmail: emailTrimmed || undefined,
          startedAt: parseDateTimeLocalValue(startedAt),
          durationHours: Number(durationHours),
          bagCount: Number(bagCount),
          isPaid,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        if (data?.error === "VALIDATION") {
          toast.error(t("validationError"));
        } else {
          toast.error(t("saveError"));
        }
        return;
      }
      toast.success(t("createSuccess"));
      setDialogOpen(false);
      resetForm();
      await loadItems();
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(event: React.FormEvent) {
    event.preventDefault();
    if (!editingId || !validateForm()) return;
    const emailTrimmed = guestEmail.trim();
    setSaving(true);
    try {
      const res = await fetch(`/api/luggage-storage/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: guestName.trim(),
          phoneNumber: fullPhoneNumber,
          guestEmail: emailTrimmed || null,
          startedAt: parseDateTimeLocalValue(startedAt),
          durationHours: Number(durationHours),
          bagCount: Number(bagCount),
          isPaid,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        if (data?.error === "VALIDATION") {
          toast.error(t("validationError"));
        } else {
          toast.error(t("updateError"));
        }
        return;
      }
      const data = (await res.json()) as { item: LuggageStorageItem };
      setItems((prev) =>
        filter === "active" && data.item.pickedUpAt
          ? prev.filter((item) => item.id !== editingId)
          : prev.map((item) => (item.id === editingId ? data.item : item)),
      );
      toast.success(t("updateSuccess"));
      setDialogOpen(false);
      resetForm();
      setEditingId(null);
      setFormMode("create");
    } catch {
      toast.error(t("updateError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    if (formMode === "edit") {
      await handleUpdate(event);
    } else {
      await handleCreate(event);
    }
  }

  async function patchItem(
    id: string,
    patch: Record<string, unknown>,
    successMessage?: string,
  ) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/luggage-storage/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        toast.error(t("updateError"));
        return;
      }
      const data = (await res.json()) as { item: LuggageStorageItem };
      setItems((prev) =>
        filter === "active" && data.item.pickedUpAt
          ? prev.filter((item) => item.id !== id)
          : prev.map((item) => (item.id === id ? data.item : item)),
      );
      if (successMessage) toast.success(successMessage);
    } catch {
      toast.error(t("updateError"));
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t("deleteConfirm"))) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/luggage-storage/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error(t("deleteError"));
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success(t("deleteSuccess"));
    } catch {
      toast.error(t("deleteError"));
    } finally {
      setUpdatingId(null);
    }
  }

  function formatWhen(iso: string) {
    return format(parseISO(iso), "d MMM yyyy, HH:mm", { locale: dateLocale });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button className="gap-2" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          {t("addGuest")}
        </Button>
      </div>

      <div className="inline-flex rounded-xl border border-border/60 bg-background/50 p-1 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setFilter("active")}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            filter === "active"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t("activeTab")}
        </button>
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            filter === "all"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t("allTab")}
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center text-muted-foreground">
          {tc("loading")}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex min-h-[20vh] flex-col items-center justify-center gap-2 py-10 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              {filter === "active" ? t("noActive") : t("noEntries")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filter === "all" && activeCount > 0 ? (
            <p className="text-xs text-muted-foreground">{t("activeCount", { count: activeCount })}</p>
          ) : null}
          {items.map((item) => {
            const overdue = isOverdue(item);
            const busy = updatingId === item.id;

            return (
              <Card
                key={item.id}
                className={cn(
                  "overflow-hidden",
                  overdue && "border-destructive/50",
                  item.pickedUpAt && "opacity-70",
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{item.guestName}</span>
                        {item.isPaid ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600">
                            {t("paid")}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">{t("unpaid")}</Badge>
                        )}
                        {item.pickedUpAt ? (
                          <Badge variant="secondary">{t("pickedUp")}</Badge>
                        ) : overdue ? (
                          <Badge variant="destructive">{t("overdue")}</Badge>
                        ) : null}
                      </CardTitle>
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <a href={`tel:${item.phoneNumber}`} className="hover:underline">
                          {item.phoneNumber}
                        </a>
                      </p>
                      {item.guestEmail ? (
                        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <a href={`mailto:${item.guestEmail}`} className="hover:underline">
                            {item.guestEmail}
                          </a>
                        </p>
                      ) : null}
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Briefcase className="h-3.5 w-3.5" />
                        {t("bagCountLabel", { count: item.bagCount ?? 1 })}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t("startTime")}
                      </p>
                      <p className="mt-0.5 font-medium">{formatWhen(item.startedAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t("duration")}
                      </p>
                      <p className="mt-0.5 font-medium">
                        {t("durationHours", { hours: item.durationHours })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t("price")}
                      </p>
                      <p className="mt-0.5 font-semibold">
                        <CurrencyDisplay amount={item.price} />
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t("pickupBy")}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 flex items-center gap-1.5 font-medium",
                          overdue && !item.pickedUpAt && "text-destructive",
                        )}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {formatWhen(item.endsAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 border-t pt-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`paid-${item.id}`}
                        checked={item.isPaid}
                        disabled={busy || Boolean(item.pickedUpAt)}
                        onCheckedChange={(checked) =>
                          void patchItem(item.id, { isPaid: checked === true })
                        }
                      />
                      <Label htmlFor={`paid-${item.id}`} className="text-sm">
                        {t("markPaid")}
                      </Label>
                    </div>
                    <div className="ml-auto flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={busy}
                        onClick={() => openEditDialog(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        {t("editGuest")}
                      </Button>
                      {!item.pickedUpAt ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          disabled={busy}
                          onClick={() =>
                            void patchItem(
                              item.id,
                              { pickedUp: true },
                              t("pickupSuccess"),
                            )
                          }
                        >
                          <Check className="h-3.5 w-3.5" />
                          {t("markPickedUp")}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            void patchItem(item.id, { pickedUp: false })
                          }
                        >
                          {t("undoPickup")}
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        disabled={busy}
                        onClick={() => void handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            resetForm();
            setEditingId(null);
            setFormMode("create");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {formMode === "edit" ? t("editGuest") : t("addGuest")}
            </DialogTitle>
            <DialogDescription>
              {formMode === "edit"
                ? t("editGuestDescription")
                : t("addGuestDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="luggage-name">{t("guestName")}</Label>
              <Input
                id="luggage-name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="luggage-phone">{t("phoneNumber")}</Label>
              <PhoneNumberInput
                localInputId="luggage-phone"
                countryIso={phoneCountryIso}
                localNumber={phoneLocalNumber}
                onCountryIsoChange={setPhoneCountryIso}
                onLocalNumberChange={setPhoneLocalNumber}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">{t("phoneHint")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="luggage-email">{t("guestEmail")}</Label>
              <EmailProviderInput
                id="luggage-email"
                value={guestEmail}
                onChange={setGuestEmail}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">{t("guestEmailHint")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="luggage-bags">{t("bagCount")}</Label>
              <Input
                id="luggage-bags"
                type="number"
                min={1}
                max={20}
                step={1}
                inputMode="numeric"
                value={bagCount}
                onChange={(e) => setBagCount(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">{t("bagCountHint")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="luggage-start">{t("startTime")}</Label>
              <Input
                id="luggage-start"
                type="datetime-local"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="luggage-duration">{t("duration")}</Label>
              <Input
                id="luggage-duration"
                type="number"
                min={1}
                max={168}
                step={1}
                inputMode="numeric"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">{t("durationHint")}</p>
              <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                <p className="text-xs text-muted-foreground">{t("pricingHint")}</p>
                <p className="mt-1 text-lg font-semibold">
                  <CurrencyDisplay amount={quotedPrice} />
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Switch
                id="luggage-paid"
                checked={isPaid}
                onCheckedChange={(checked) => setIsPaid(checked === true)}
              />
              <Label htmlFor="luggage-paid">{t("paidOnDropOff")}</Label>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? tc("loading") : tc("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
