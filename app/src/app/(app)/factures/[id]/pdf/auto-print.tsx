"use client";

import { useEffect } from "react";

/** Trigger the browser's print dialog on mount.
 *  We use a small delay so the page paints before the dialog opens. */
export function AutoPrint() {
  useEffect(() => {
    const handle = window.setTimeout(() => window.print(), 250);
    return () => window.clearTimeout(handle);
  }, []);
  return null;
}
