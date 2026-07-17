import { prisma } from "@/lib/prisma";

const PLACEHOLDER_MARKER = "__CUSTOM_PLACEHOLDER__";

/** Hidden catalog row used as FK target for ad-hoc POS line items. */
export async function getOrCreateCustomProductPlaceholder() {
  let category = await prisma.category.findFirst({
    where: { nameEs: PLACEHOLDER_MARKER },
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        nameEs: PLACEHOLDER_MARKER,
        nameEn: PLACEHOLDER_MARKER,
        isActive: false,
        sortOrder: 9999,
      },
    });
  }

  let product = await prisma.product.findFirst({
    where: { categoryId: category.id, nameEs: PLACEHOLDER_MARKER },
  });

  if (!product) {
    product = await prisma.product.create({
      data: {
        categoryId: category.id,
        nameEs: PLACEHOLDER_MARKER,
        nameEn: PLACEHOLDER_MARKER,
        price: 0,
        taxRate: 21,
        isActive: false,
        posOnly: true,
        sortOrder: 0,
      },
    });
  }

  return product.id;
}

export function isCustomPlaceholderProduct(nameEs: string, nameEn: string) {
  return nameEs === PLACEHOLDER_MARKER || nameEn === PLACEHOLDER_MARKER;
}
