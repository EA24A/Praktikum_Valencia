"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface EmployeeOption {
  id: string;
  name: string;
}

interface TimeTrackingFiltersProps {
  employees: EmployeeOption[];
  userId: string;
  dateFrom: string;
  dateTo: string;
  onUserIdChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}

export function TimeTrackingFilters({
  employees,
  userId,
  dateFrom,
  dateTo,
  onUserIdChange,
  onDateFromChange,
  onDateToChange,
}: TimeTrackingFiltersProps) {
  const t = useTranslations("timeTracking");

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="space-y-2">
        <Label>{t("filterEmployee")}</Label>
        <Select
          value={userId}
          onValueChange={(value) => onUserIdChange(value ?? "all")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("allEmployees")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allEmployees")}</SelectItem>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date-from">{t("dateFrom")}</Label>
        <Input
          id="date-from"
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date-to">{t("dateTo")}</Label>
        <Input
          id="date-to"
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
        />
      </div>
    </div>
  );
}
