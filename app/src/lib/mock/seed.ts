import { addDays, format, subDays } from "date-fns";

/** Helper: returns an ISO date offset from today (negative = past). */
export function dateOffset(days: number): string {
  return format(days >= 0 ? addDays(new Date(), days) : subDays(new Date(), -days), "yyyy-MM-dd");
}

/** Helper: full ISO timestamp offset from now. */
export function tsOffset(days: number): string {
  return (days >= 0 ? addDays(new Date(), days) : subDays(new Date(), -days)).toISOString();
}

export const MOCK_USER_ID = "user-felipe";
