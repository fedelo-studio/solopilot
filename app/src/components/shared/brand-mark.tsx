import { cn } from "@/lib/utils";

interface BrandMarkProps {
  /** Visual size in pixels (height). */
  size?: number;
  className?: string;
  /** Kept for backward compatibility — both variants now render the official
   *  monogram (Q-lens + green pupil). Call sites can ignore the prop. */
  variant?: "compact" | "full";
  /** Force a color theme regardless of the surrounding text colour. */
  invert?: boolean;
}

/** SoloPilot brand mark — official monogram.
 *
 *  A stylised Q-lens with a small hot-orange disc inside. Reads as "an eye
 *  observing a signal" — the cockpit metaphor. The lens body uses
 *  `currentColor` so the mark inherits the surrounding text colour
 *  (works on both light and dark surfaces). The accent uses Fedelo's
 *  hot orange (#ff4a1c) to stay coherent with the studio identity.
 */
export function BrandMark({
  size = 28,
  className,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  variant,
  invert = false,
}: BrandMarkProps) {
  const bodyFill = invert ? "#050505" : "currentColor";

  const aspect = 117 / 121;
  return (
    <svg
      width={size / aspect}
      height={size}
      viewBox="0 0 121 117"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {/* Q-lens body */}
      <path
        d="M0.0363281 58.6159C0.0363281 25.3674 26.1784 0 60.2124 0C94.4932 0 120.389 25.3674 120.389 58.6159C120.389 72.4697 115.893 84.9553 108.168 94.8075C115.407 97.3126 120.605 104.19 120.605 112.281V116.769H0V93.7956H11.554C4.27236 84.1064 0.0363281 71.9997 0.0363281 58.6159ZM67.9506 93.7956C84.2113 90.4414 95.7263 76.5688 95.7263 58.6159C95.7263 37.9279 80.4355 22.6583 60.2124 22.412C39.7427 22.6583 24.6987 37.9279 24.6987 58.6159C24.6987 76.5688 36.0278 90.4414 52.4006 93.7956C54.8949 94.3066 57.5062 94.5735 60.2124 94.5735C62.8859 94.5735 65.4733 94.3066 67.9506 93.7956Z"
        fill={bodyFill}
      />
      {/* Pupil — Fedelo hot orange */}
      <path
        d="M76.4592 58.5028C76.4592 67.7473 69.1704 74.3843 60.4238 74.3843C51.4343 74.3843 44.1455 67.7473 44.1455 58.5028C44.1455 49.0214 51.4343 42.3843 60.4238 42.3843C69.1704 42.3843 76.4592 49.0214 76.4592 58.5028Z"
        fill="#ff4a1c"
      />
    </svg>
  );
}

/** Official wordmark vector paths (471×90). Single source of truth — used by
 *  both BrandWordmark and BrandLogoLoader. Body strokes use `currentColor`;
 *  the accent dot uses Fedelo's hot orange (#ff4a1c). */
function WordmarkPaths() {
  return (
    <>
      <path d="M20.8397 75.0315C9.61832 75.0315 3.08279 68.9975 0 61.8552L10.2349 57.1758C12.0846 61.4858 16.2772 64.195 20.963 64.195C27.0053 64.195 30.458 61.7321 30.458 57.6684C30.458 53.4816 26.7587 51.5113 20.7164 50.2798C11.2214 48.5558 1.84968 44.369 1.84968 32.6705C1.84968 24.0505 9.12507 16.4157 21.3329 16.4157C31.1979 16.4157 37.8567 21.4645 40.4463 28.6068L30.7046 33.0399C29.4715 28.8531 25.5255 26.5133 21.4563 26.5133C16.4005 26.5133 13.5643 29.2225 13.5643 32.5473C13.5643 36.8573 17.2637 38.7045 23.0593 39.6896C37.4868 42.2756 42.2959 49.0484 42.2959 57.4221C42.2959 66.7809 35.0205 75.0315 20.8397 75.0315Z" fill="currentColor" />
      <path d="M81.8983 75.0315C64.8813 75.0315 51.8102 62.3478 51.8102 45.7236C51.8102 29.0993 64.8813 16.4157 81.8983 16.4157C99.0386 16.4157 111.986 29.0993 111.986 45.7236C111.986 62.3478 99.0386 75.0315 81.8983 75.0315ZM81.8983 63.7024C92.0099 63.7024 99.6552 56.0675 99.6552 45.7236C99.6552 35.3796 92.0099 27.7448 81.8983 27.6216C71.6634 27.7448 64.1414 35.3796 64.1414 45.7236C64.1414 56.0675 71.6634 63.7024 81.8983 63.7024Z" fill="currentColor" />
      <path d="M146.784 74.5389H144.935C132.604 74.5389 125.575 67.7661 125.575 54.3435V0H137.289V54.2204C137.289 60.1312 140.619 63.3329 146.784 63.3329V74.5389Z" fill="currentColor" />
      <path d="M185.1 75.0315C168.083 75.0315 155.012 62.3478 155.012 45.7236C155.012 29.0993 168.083 16.4157 185.1 16.4157C202.24 16.4157 215.188 29.0993 215.188 45.7236C215.188 62.3478 202.24 75.0315 185.1 75.0315ZM185.1 63.7024C195.211 63.7024 202.857 56.0675 202.857 45.7236C202.857 35.3796 195.211 27.7448 185.1 27.6216C174.865 27.7448 167.343 35.3796 167.343 45.7236C167.343 56.0675 174.865 63.7024 185.1 63.7024Z" fill="currentColor" />
      <path d="M259.357 16.4157C276.005 16.4157 288.952 29.3456 288.952 45.7236C288.952 62.2247 276.005 75.0315 259.357 75.0315C252.699 75.0315 246.163 72.6918 241.107 68.5049V89.6H229.393V17.7702H241.107V22.9422C246.163 18.7554 252.699 16.4157 259.357 16.4157ZM258.864 63.7024C269.099 63.7024 276.621 56.0675 276.621 45.7236C276.621 35.3796 269.099 27.7448 258.864 27.6216C248.876 27.7448 241.231 35.3796 241.231 45.7236C241.231 56.0675 248.876 63.7024 258.864 63.7024Z" fill="currentColor" />
      <path d="M314.433 73.6769H302.718V17.7702H314.433V73.6769Z" fill="currentColor" />
      <path d="M352.344 74.5389H350.494C338.163 74.5389 331.135 67.7661 331.135 54.3435V0H342.849V54.2204C342.849 60.1312 346.179 63.3329 352.344 63.3329V74.5389Z" fill="currentColor" />
      <path d="M471 74.4158H462.861C450.53 74.4158 442.392 67.8892 442.392 54.4667V27.9911H432.527V19.4942H432.897C439.432 19.4942 445.474 14.4454 445.474 4.47084V4.22455H454.106V17.7702H471V27.9911H454.106V53.3584C454.106 60.8701 459.039 63.5792 464.341 63.5792H471V74.4158Z" fill="currentColor" />
      <path d="M403.632 45.6671C403.632 50.2893 399.988 53.6078 395.615 53.6078C391.12 53.6078 387.476 50.2893 387.476 45.6671C387.476 40.9263 391.12 37.6078 395.615 37.6078C399.988 37.6078 403.632 40.9263 403.632 45.6671Z" fill="#ff4a1c" />
      <path d="M365.421 45.7236C365.421 29.0993 378.492 16.4156 395.509 16.4156C412.649 16.4156 425.597 29.0993 425.597 45.7236C425.597 52.6505 423.349 58.8933 419.486 63.8194C423.106 65.0719 425.705 68.5104 425.705 72.5561V74.8H365.403V63.3134H371.18C367.539 58.4689 365.421 52.4155 365.421 45.7236ZM399.378 63.3134C407.508 61.6363 413.266 54.7 413.266 45.7236C413.266 35.3796 405.62 27.7448 395.509 27.6216C385.274 27.7448 377.752 35.3796 377.752 45.7236C377.752 54.7 383.417 61.6363 391.603 63.3134C392.85 63.5689 394.156 63.7024 395.509 63.7024C396.846 63.7024 398.139 63.5689 399.378 63.3134Z" fill="currentColor" />
    </>
  );
}

interface BrandWordmarkProps {
  className?: string;
  /** Height in pixels — width auto-computed from aspect ratio. Default 18px. */
  height?: number;
  title?: string;
}

/** Official SoloPilot wordmark — vector. Uses `currentColor`, accent green
 *  constant. Pairs with BrandMark for tight icon+wordmark layouts. */
export function BrandWordmark({ className, height = 18, title = "SoloPilot" }: BrandWordmarkProps) {
  const width = (height * 471) / 90;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 471 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("inline-block shrink-0", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <WordmarkPaths />
    </svg>
  );
}

interface BrandLogoLoaderProps {
  /** Height of the wordmark in pixels. */
  height?: number;
  className?: string;
}

/** Loading wordmark — the official logo painted from a soft gray base into
 *  full color, left to right, like a progress bar. Honors prefers-reduced-motion. */
export function BrandLogoLoader({ height = 36, className }: BrandLogoLoaderProps) {
  const width = (height * 471) / 90;
  return (
    <div
      className={cn("brand-logo-loader relative inline-block", className)}
      style={{ width, height }}
      role="status"
      aria-label="Chargement"
    >
      <svg
        viewBox="0 0 471 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="brand-logo-base absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <WordmarkPaths />
      </svg>
      <svg
        viewBox="0 0 471 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="brand-logo-fill absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <WordmarkPaths />
      </svg>
    </div>
  );
}
