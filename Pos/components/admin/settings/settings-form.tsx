"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateSettings } from "@/lib/actions/settings";
import {
  settingsUpdateSchema,
  type SettingsUpdateInput,
} from "@/lib/schemas/settings";
import type { BusinessSettings } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RegisterCacheClearButton } from "@/components/admin/settings/register-cache-clear-button";

interface SettingsFormProps {
  initialSettings: BusinessSettings;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  const form = useForm<SettingsUpdateInput>({
    resolver: zodResolver(settingsUpdateSchema),
    defaultValues: initialSettings,
  });

  const onSubmit = (values: SettingsUpdateInput) => {
    startTransition(async () => {
      try {
        await updateSettings(values);
        toast.success(t("saveSuccess"));
      } catch {
        toast.error(t("saveError"));
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("businessSection")}</CardTitle>
            <CardDescription>{t("businessSectionDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t("businessName")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="businessAddress"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t("address")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="businessPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("phone")}</FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="taxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("taxId")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("taxSection")}</CardTitle>
            <CardDescription>{t("taxSectionDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="defaultTaxRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("defaultTaxRate")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(event.target.valueAsNumber)
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currencySymbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("currencySymbol")}</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={5} className="max-w-24" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("receiptSection")}</CardTitle>
            <CardDescription>{t("receiptSectionDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="receiptHeaderEs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("receiptHeaderEs")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="receiptHeaderEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("receiptHeaderEn")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="receiptFooterEs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("receiptFooterEs")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="receiptFooterEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("receiptFooterEn")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("receiptEmailSection")}</CardTitle>
            <CardDescription>{t("receiptEmailSectionDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="receiptEmailEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <FormLabel>{t("receiptEmailEnabled")}</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {t("receiptEmailEnabledDescription")}
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="receiptFromEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("receiptFromEmail")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("receiptFromEmailPlaceholder")}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    {t("receiptFromEmailHint")}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("kitchenSection")}</CardTitle>
            <CardDescription>{t("kitchenSectionDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="kitchenPrintingEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <FormLabel>{t("kitchenPrintingEnabled")}</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {t("kitchenPrintingDescription")}
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("mapSection")}</CardTitle>
            <CardDescription>{t("mapSectionDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="mapWidth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("mapWidth")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={50}
                      max={500}
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(event.target.valueAsNumber)
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mapHeight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("mapHeight")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={50}
                      max={500}
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(event.target.valueAsNumber)
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("cashRegisterSection")}</CardTitle>
            <CardDescription>{t("cashRegisterSectionDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="cashRegisterBalance"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>{t("cashRegisterBalance")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(event.target.valueAsNumber)
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormDescription>{t("cashRegisterBalanceHint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-medium">{t("clearRegisterCacheTitle")}</p>
              <p className="text-sm text-muted-foreground">
                {t("clearRegisterCacheDescription")}
              </p>
              <RegisterCacheClearButton />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? tCommon("loading") : tCommon("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
