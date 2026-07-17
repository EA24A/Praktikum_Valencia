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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserListItem } from "@/lib/actions/users";
import type { Role } from "@prisma/client";

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserListItem | null;
  onSuccess: () => void;
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: EmployeeFormDialogProps) {
  const t = useTranslations("employees");
  const tc = useTranslations("common");
  const isEdit = Boolean(user);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("EMPLOYEE");
  const [isOwner, setIsOwner] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(user?.name ?? "");
      setEmail(user?.email ?? "");
      setPassword("");
      setRole(user?.role ?? "EMPLOYEE");
      setIsOwner(user?.isOwner ?? false);
    }
  }, [open, user]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(
        isEdit ? `/api/users/${user!.id}` : "/api/users",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            role,
            isOwner,
            ...(password ? { password } : {}),
          }),
        },
      );

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast.error(data.error ?? tc("save"));
        return;
      }

      toast.success(isEdit ? t("updateSuccess") : t("createSuccess"));
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("editEmployee") : t("addEmployee")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("editEmployeeDescription") : t("addEmployeeDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee-name">{t("name")}</Label>
            <Input
              id="employee-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee-email">{t("email")}</Label>
            <Input
              id="employee-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee-password">
              {isEdit ? t("newPassword") : t("password")}
            </Label>
            <Input
              id="employee-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!isEdit}
              minLength={8}
              placeholder={isEdit ? t("passwordOptional") : undefined}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("role")}</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as Role)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMPLOYEE">{t("roleEmployee")}</SelectItem>
                <SelectItem value="SUPERADMIN">{t("roleSuperadmin")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isEdit && role === "EMPLOYEE" ? (
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <Checkbox
                id="employee-is-owner"
                checked={isOwner}
                onCheckedChange={(checked) => setIsOwner(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="employee-is-owner">{t("isOwner")}</Label>
                <p className="text-xs text-muted-foreground">{t("isOwnerHint")}</p>
              </div>
            </div>
          ) : null}

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
