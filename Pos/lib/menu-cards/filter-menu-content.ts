const ALI_DIB_PATTERN = /\bali\s*dib\b/i;
const COMBO_CATEGORY_PATTERN = /\bcombos?\b|\bkombos?\b|\bcombo\b/i;

export function isAliDibLabel(value: string): boolean {
  return ALI_DIB_PATTERN.test(value.trim());
}

export function isComboCategoryLabel(value: string): boolean {
  return COMBO_CATEGORY_PATTERN.test(value.trim());
}

export function stripAliDib(value: string): string {
  return value
    .replace(ALI_DIB_PATTERN, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*[·◆|]\s*[·◆|]\s*/g, " · ")
    .replace(/^[\s·◆|]+|[\s·◆|]+$/g, "")
    .trim();
}
