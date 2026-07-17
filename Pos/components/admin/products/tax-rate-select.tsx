"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const TAX_RATE_PRESETS = [21, 10, 4, 0] as const;

function isPresetRate(rate: number): rate is (typeof TAX_RATE_PRESETS)[number] {
  return (TAX_RATE_PRESETS as readonly number[]).includes(rate);
}

interface TaxRateSelectProps {
  value: number;
  onChange: (rate: number) => void;
  id?: string;
  disabled?: boolean;
}

export function TaxRateSelect({
  value,
  onChange,
  id,
  disabled,
}: TaxRateSelectProps) {
  const t = useTranslations("products");
  const [useCustom, setUseCustom] = useState(!isPresetRate(value));

  useEffect(() => {
    setUseCustom(!isPresetRate(value));
  }, [value]);

  const selectValue = useCustom ? "custom" : String(value);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{t("taxRate")}</Label>
      <Select
        value={selectValue}
        onValueChange={(next) => {
          if (next === "custom") {
            setUseCustom(true);
            return;
          }
          setUseCustom(false);
          onChange(Number(next));
        }}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TAX_RATE_PRESETS.map((rate) => (
            <SelectItem key={rate} value={String(rate)}>
              {t(`taxPresets.${rate}` as "taxPresets.21")}
            </SelectItem>
          ))}
          <SelectItem value="custom">{t("taxCustom")}</SelectItem>
        </SelectContent>
      </Select>
      {useCustom && (
        <Input
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          placeholder={t("taxCustomPlaceholder")}
          disabled={disabled}
        />
      )}
    </div>
  );
}

export function formatTaxRateLabel(
  rate: number,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (isPresetRate(rate)) {
    return t(`taxPresets.${rate}`);
  }
  return t("taxCustomValue", { rate });
}
