"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { TimeEntryListItem } from "@/lib/actions/time-entries";
import { format, parseISO } from "date-fns";

interface TimeEntryEditDialogProps {
  entry: TimeEntryListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function toLocalInputValue(iso: string): string {
  const date = parseISO(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function TimeEntryEditDialog({
  entry,
  open,
  onOpenChange,
  onSuccess,
}: TimeEntryEditDialogProps) {
  const t = useTranslations("timeTracking");
  const tc = useTranslations("common");

  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && entry) {
      setClockIn(toLocalInputValue(entry.clockIn));
      setClockOut(entry.clockOut ? toLocalInputValue(entry.clockOut) : "");
      setIsOpen(entry.isOpen);
      setNote(entry.note ?? "");
    }
  }, [open, entry]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!entry) return;

    setSaving(true);

    try {
      const response = await fetch(`/api/time-entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clockIn: new Date(clockIn).toISOString(),
          clockOut: isOpen ? null : new Date(clockOut).toISOString(),
          note: note.trim() || null,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? t("updateError"));
        return;
      }

      toast.success(t("updateSuccess"));
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(t("updateError"));
    } finally {
      setSaving(false);
    }
  }

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editEntry")}</DialogTitle>
          <DialogDescription>
            {entry.userName} · {format(parseISO(entry.clockIn), "PP")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-clock-in">{t("clockIn")}</Label>
            <Input
              id="edit-clock-in"
              type="datetime-local"
              value={clockIn}
              onChange={(e) => setClockIn(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="edit-open-entry"
              checked={isOpen}
              onCheckedChange={setIsOpen}
            />
            <Label htmlFor="edit-open-entry">{t("openEntry")}</Label>
          </div>

          {!isOpen && (
            <div className="space-y-2">
              <Label htmlFor="edit-clock-out">{t("clockOut")}</Label>
              <Input
                id="edit-clock-out"
                type="datetime-local"
                value={clockOut}
                onChange={(e) => setClockOut(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-note">{t("note")}</Label>
            <Textarea
              id="edit-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
  );
}
