/** €1 per hour, €5 per full 24-hour day (remaining hours billed hourly). */
export const LUGGAGE_HOURLY_RATE = 1;
export const LUGGAGE_DAY_HOURS = 24;
export const LUGGAGE_DAY_RATE = 5;

export function calculateLuggagePrice(
  durationHours: number,
  bagCount = 1,
): number {
  const hours = Math.round(durationHours);
  const bags = Math.max(1, Math.round(bagCount));
  if (hours < 1) return 0;

  const fullDays = Math.floor(hours / LUGGAGE_DAY_HOURS);
  const remainingHours = hours % LUGGAGE_DAY_HOURS;
  const perBag = fullDays * LUGGAGE_DAY_RATE + remainingHours * LUGGAGE_HOURLY_RATE;
  return perBag * bags;
}
