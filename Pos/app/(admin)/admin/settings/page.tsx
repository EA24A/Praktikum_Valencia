import { getTranslations } from "next-intl/server";
import { SettingsForm } from "@/components/admin/settings/settings-form";
import { getSettings } from "@/lib/actions/settings";

export default async function AdminSettingsPage() {
  const t = await getTranslations("settings");
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("description")}</p>
      </div>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
