import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/finance/format";

interface DurationProps {
  minutes: number;
  className?: string;
}

/** Canonical way to render a tracked-time duration — the hours/minutes
 *  analogue of `Money`. Always tabular, always the same "1 h 30" format. */
export function Duration({ minutes, className }: DurationProps) {
  return <span className={cn("num", className)}>{formatDuration(minutes)}</span>;
}
