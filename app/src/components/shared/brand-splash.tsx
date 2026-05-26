import { cn } from "@/lib/utils";
import { BrandLogoLoader, BrandWordmark } from "./brand-mark";

interface BrandSplashProps {
  /** When true, the official wordmark fills left-to-right like a loading bar. */
  loading?: boolean;
  className?: string;
  /** Optional eyebrow shown below the wordmark (only when `loading` is false). */
  caption?: string;
}

/** Full-bleed splash with the official SoloPilot logo at center.
 *
 *  When `loading` is true, the wordmark animates from a soft gray base to
 *  full color, left-to-right — like a progress bar painting itself. Loops.
 *  Otherwise it sits static (used for 404, error fallback layouts). */
export function BrandSplash({ loading = false, className, caption }: BrandSplashProps) {
  return (
    <div
      className={cn(
        "flex min-h-[40vh] flex-col items-center justify-center gap-4",
        className,
      )}
    >
      {loading ? (
        <BrandLogoLoader height={36} />
      ) : (
        <>
          <BrandWordmark height={28} />
          {caption ? (
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {caption}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
