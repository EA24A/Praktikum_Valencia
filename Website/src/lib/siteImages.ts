import { prisma } from "@/lib/prisma";

/**
 * Site-wide image slots. Each slot has a stable key used in the
 * SiteSetting table (`image.<key>`), a default that ships with the
 * repo, and metadata that drives the admin uploader UI.
 */
export type SiteImageKey =
  | "logo"
  | "hero"
  | "story"
  | "about"
  | "og_default"
  | "favicon";

export type SiteImageSlot = {
  key: SiteImageKey;
  /** Settings key used in DB (image.<key>). */
  settingKey: string;
  /** Short label shown in the admin UI. */
  label: string;
  /** One-line description for the admin so they know where it appears. */
  description: string;
  /** Default URL when nothing is set in the DB. */
  defaultUrl: string;
  /** Recommended dimensions hint. */
  recommended: string;
};

export const SITE_IMAGE_SLOTS: SiteImageSlot[] = [
  {
    key: "logo",
    settingKey: "image.logo",
    label: "Logo",
    description:
      "Used in the header, footer, admin sidebar, login screen and structured data.",
    defaultUrl: "/logo.png",
    recommended: "Square PNG, transparent background, ≥ 512×512",
  },
  {
    key: "favicon",
    settingKey: "image.favicon",
    label: "Favicon",
    description:
      "Browser tab icon. Defaults to the site logo if not set.",
    defaultUrl: "/logo.png",
    recommended: "Square PNG, ≥ 192×192",
  },
  {
    key: "hero",
    settingKey: "image.hero",
    label: "Homepage hero photo",
    description:
      "Large photo on the right side of the homepage hero section.",
    defaultUrl: "/images/hero-restaurant.jpg",
    recommended: "Portrait JPG, 4:5, ≥ 1200×1500",
  },
  {
    key: "story",
    settingKey: "image.story",
    label: "Story / kitchen photo",
    description:
      'Square photo paired with the "Our story" block on the homepage.',
    defaultUrl: "/images/our-kitchen.jpg",
    recommended: "Square JPG, ≥ 1200×1200",
  },
  {
    key: "about",
    settingKey: "image.about",
    label: "About-page storefront photo",
    description: "Square photo shown on the About / Nosotros page.",
    defaultUrl: "/images/about-storefront.jpg",
    recommended: "Square JPG, ≥ 1200×1200",
  },
  {
    key: "og_default",
    settingKey: "image.og_default",
    label: "Default share / Open Graph image",
    description:
      "Shown when a page is shared on WhatsApp, Facebook, Twitter, etc., and the page has no specific OG image set.",
    defaultUrl: "/og-default.jpg",
    recommended: "JPG/PNG 1200×630",
  },
];

export type SiteImages = Record<SiteImageKey, string>;

/**
 * Server-only: read every image slot from the DB and return a fully
 * populated map. Slots without a DB row fall back to their built-in
 * defaults so callers never have to handle nulls.
 */
export async function getSiteImages(): Promise<SiteImages> {
  const rows = await prisma.siteSetting
    .findMany({
      where: {
        key: { in: SITE_IMAGE_SLOTS.map((s) => s.settingKey) },
      },
    })
    .catch(() => [] as Array<{ key: string; value: string }>);

  const bySettingKey = new Map(rows.map((r) => [r.key, r.value]));

  const out = {} as SiteImages;
  for (const slot of SITE_IMAGE_SLOTS) {
    const value = bySettingKey.get(slot.settingKey);
    out[slot.key] = value && value.trim() ? value : slot.defaultUrl;
  }
  return out;
}

/**
 * Returns the slot definition for a given key, or undefined.
 */
export function findSlot(key: string): SiteImageSlot | undefined {
  return SITE_IMAGE_SLOTS.find((s) => s.key === key || s.settingKey === key);
}
