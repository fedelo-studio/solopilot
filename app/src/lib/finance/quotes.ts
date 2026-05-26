import { isBefore, parseISO } from "date-fns";
import type { Quote, QuoteStatus } from "@/types/domain";

/** Derived live status — promotes `sent` to `expired` if past validUntil. */
export function liveQuoteStatus(quote: Quote): QuoteStatus {
  if (quote.status !== "sent") return quote.status;
  if (quote.validUntil && isBefore(parseISO(quote.validUntil), new Date())) return "expired";
  return "sent";
}

/** A quote is "open" if it's awaiting client response (sent, not yet decided/expired). */
export function isOpenQuote(quote: Quote): boolean {
  return liveQuoteStatus(quote) === "sent";
}

/** Total open quote value (e.g., for the reports dashboard). */
export function totalOpenQuotes(quotes: Quote[]): number {
  return quotes.filter(isOpenQuote).reduce((acc, q) => acc + q.total, 0);
}
