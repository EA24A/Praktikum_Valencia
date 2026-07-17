"use client";

import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  COUNTRY_PHONE_CODES,
  countryFlag,
  findCountryByIso,
} from "@/lib/phone/country-codes";
import { formatFullPhoneFromIso } from "@/lib/phone/format-phone";

type PhoneNumberInputProps = {
  countryIso: string;
  localNumber: string;
  onCountryIsoChange: (iso2: string) => void;
  onLocalNumberChange: (localNumber: string) => void;
  disabled?: boolean;
  localInputId?: string;
  className?: string;
};

export function PhoneNumberInput({
  countryIso,
  localNumber,
  onCountryIsoChange,
  onLocalNumberChange,
  disabled,
  localInputId,
  className,
}: PhoneNumberInputProps) {
  const [open, setOpen] = useState(false);
  const selected = findCountryByIso(countryIso) ?? findCountryByIso("ES")!;

  return (
    <div className={cn("flex gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="w-[10.5rem] shrink-0 justify-between px-2.5 font-normal"
            >
              <span className="flex min-w-0 items-center gap-1.5 truncate">
                <span aria-hidden>{countryFlag(selected.iso2)}</span>
                <span className="truncate">+{selected.dialCode}</span>
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          }
        />
        <PopoverContent className="w-[min(20rem,calc(100vw-2rem))] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search country…" />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              {COUNTRY_PHONE_CODES.map((country) => (
                <CommandItem
                  key={country.iso2}
                  value={`${country.name} +${country.dialCode} ${country.iso2}`}
                  onSelect={() => {
                    onCountryIsoChange(country.iso2);
                    setOpen(false);
                  }}
                >
                  <span aria-hidden>{countryFlag(country.iso2)}</span>
                  <span className="min-w-0 flex-1 truncate">{country.name}</span>
                  <span className="text-muted-foreground">+{country.dialCode}</span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        id={localInputId}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="612 345 678"
        value={localNumber}
        disabled={disabled}
        className="min-w-0 flex-1"
        onChange={(event) =>
          onLocalNumberChange(event.target.value.replace(/[^\d\s]/g, ""))
        }
      />
    </div>
  );
}

export function combinePhoneFields(countryIso: string, localNumber: string): string {
  return formatFullPhoneFromIso(countryIso, localNumber);
}
