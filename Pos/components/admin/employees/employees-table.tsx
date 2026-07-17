"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserListItem } from "@/lib/actions/users";
import { formatTotalHours } from "@/lib/timesheet-utils";
import { Eye, Pencil, UserCheck, UserX } from "lucide-react";

interface EmployeesTableProps {
  users: UserListItem[];
  onView: (user: UserListItem) => void;
  onEdit: (user: UserListItem) => void;
  onRemove: (user: UserListItem) => void;
  onReactivate: (user: UserListItem) => void;
}

export function EmployeesTable({
  users,
  onView,
  onEdit,
  onRemove,
  onReactivate,
}: EmployeesTableProps) {
  const t = useTranslations("employees");
  const tc = useTranslations("common");

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        {t("noEmployees")}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("name")}</TableHead>
            <TableHead>{t("email")}</TableHead>
            <TableHead>{t("role")}</TableHead>
            <TableHead>{tc("status")}</TableHead>
            <TableHead className="text-right">{t("monthHours")}</TableHead>
            <TableHead className="text-right">{t("ordersCount")}</TableHead>
            <TableHead className="text-right">{tc("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {user.name}
                  {user.isClockedIn && (
                    <Badge variant="secondary" className="text-[10px]">
                      {t("clockedIn")}
                    </Badge>
                  )}
                  {user.isOwner && (
                    <Badge variant="outline" className="text-[10px]">
                      {t("ownerBadge")}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {user.role === "SUPERADMIN" ? t("roleSuperadmin") : t("roleEmployee")}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.isActive ? "default" : "destructive"}>
                  {user.isActive ? tc("active") : tc("inactive")}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {`${formatTotalHours(user.monthHours) || "0"}h`}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {user.ordersCount}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onView(user)}
                    aria-label={t("viewDetails")}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(user)}
                    aria-label={tc("edit")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {user.isActive ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onRemove(user)}
                      aria-label={t("removeEmployee")}
                    >
                      <UserX className="h-4 w-4 text-destructive" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onReactivate(user)}
                      aria-label={t("reactivate")}
                    >
                      <UserCheck className="h-4 w-4 text-emerald-600" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
