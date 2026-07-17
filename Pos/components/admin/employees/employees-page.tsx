"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmployeesTable } from "@/components/admin/employees/employees-table";
import { EmployeeFormDialog } from "@/components/admin/employees/employee-form-dialog";
import { EmployeeDetailSheet } from "@/components/admin/employees/employee-detail-sheet";
import type { UserListItem } from "@/lib/actions/users";

async function fetchUsers(includeInactive: boolean): Promise<UserListItem[]> {
  const response = await fetch(
    `/api/users?includeInactive=${includeInactive ? "true" : "false"}`,
  );
  if (!response.ok) {
    throw new Error("Failed to load employees");
  }
  const data = (await response.json()) as { users: UserListItem[] };
  return data.users;
}

export function EmployeesPage() {
  const t = useTranslations("employees");
  const tc = useTranslations("common");
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [working, setWorking] = useState(false);

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-users", includeInactive],
    queryFn: () => fetchUsers(includeInactive),
  });

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query),
    );
  }, [users, search]);

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    void refetch();
  }, [queryClient, refetch]);

  function handleCreate() {
    setSelectedUser(null);
    setFormOpen(true);
  }

  function handleEdit(user: UserListItem) {
    setSelectedUser(user);
    setFormOpen(true);
  }

  function handleView(user: UserListItem) {
    setSelectedUser(user);
    setDetailOpen(true);
  }

  function handleRemove(user: UserListItem) {
    setSelectedUser(user);
    setRemoveOpen(true);
  }

  function handleReactivate(user: UserListItem) {
    setSelectedUser(user);
    setReactivateOpen(true);
  }

  async function confirmDeactivate() {
    if (!selectedUser) return;
    setWorking(true);

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deactivate: true }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? t("deactivateError"));
        return;
      }

      toast.success(t("deactivateSuccess"));
      setRemoveOpen(false);
      refresh();
    } catch {
      toast.error(t("deactivateError"));
    } finally {
      setWorking(false);
    }
  }

  async function confirmDelete() {
    if (!selectedUser) return;
    setWorking(true);

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string; code?: string };
      if (!response.ok) {
        toast.error(
          data.code === "HAS_HISTORY" ? t("deleteBlockedHistory") : (data.error ?? t("deleteError")),
        );
        return;
      }

      toast.success(t("deleteSuccess"));
      setRemoveOpen(false);
      refresh();
    } catch {
      toast.error(t("deleteError"));
    } finally {
      setWorking(false);
    }
  }

  async function confirmReactivate() {
    if (!selectedUser) return;
    setWorking(true);

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? t("reactivateError"));
        return;
      }

      toast.success(t("reactivateSuccess"));
      setReactivateOpen(false);
      refresh();
    } catch {
      toast.error(t("reactivateError"));
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          {t("addEmployee")}
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tc("search")}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="include-inactive"
            checked={includeInactive}
            onCheckedChange={setIncludeInactive}
          />
          <Label htmlFor="include-inactive">{t("showInactive")}</Label>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          {tc("loading")}
        </div>
      ) : (
        <EmployeesTable
          users={filteredUsers}
          onView={handleView}
          onEdit={handleEdit}
          onRemove={handleRemove}
          onReactivate={handleReactivate}
        />
      )}

      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={selectedUser}
        onSuccess={refresh}
      />

      <EmployeeDetailSheet
        user={selectedUser}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("removeEmployeeTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("removeEmployeeDescription", { name: selectedUser?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel disabled={working}>{tc("cancel")}</AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              disabled={working}
              onClick={() => void confirmDeactivate()}
            >
              {working ? tc("loading") : t("deactivate")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={working}
              onClick={() => void confirmDelete()}
            >
              {working ? tc("loading") : t("deleteEmployee")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={reactivateOpen} onOpenChange={setReactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("reactivateTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("reactivateDescription", { name: selectedUser?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>{tc("cancel")}</AlertDialogCancel>
            <Button
              type="button"
              disabled={working}
              onClick={() => void confirmReactivate()}
            >
              {working ? tc("loading") : t("reactivate")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
