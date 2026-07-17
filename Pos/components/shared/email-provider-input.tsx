"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  applyEmailProvider,
  EMAIL_PROVIDER_DOMAINS,
} from "@/lib/luggage/email-providers";

type EmailProviderInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
};

export function EmailProviderInput({
  value,
  onChange,
  disabled,
  id,
  className,
}: EmailProviderInputProps) {
  const activeDomain = value.includes("@")
    ? value.split("@").slice(1).join("@")
    : null;

  return (
    <div className={cn("space-y-2", className)}>
      <Input
        id={id}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="name@example.com"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="flex flex-wrap gap-1.5">
        {EMAIL_PROVIDER_DOMAINS.map((provider) => {
          const isActive = activeDomain === provider.domain;
          return (
            <Button
              key={provider.id}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={disabled}
              onClick={() => onChange(applyEmailProvider(value, provider.domain))}
            >
              {provider.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
