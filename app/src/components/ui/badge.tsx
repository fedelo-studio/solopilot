import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // self-start prevents flex-column parents from stretching the badge to full width
  "inline-flex w-fit self-start items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide leading-none transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        confirmed:
          "border-transparent bg-confirmed-soft text-confirmed",
        probable:
          "border-transparent bg-probable-soft text-probable",
        hypothetical:
          "border-transparent bg-hypothetical-soft text-hypothetical",
        warning:
          "border-transparent bg-warning-soft text-warning",
        danger:
          "border-transparent bg-danger-soft text-danger",
        hot:
          "border-transparent bg-hot-soft text-hot",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
