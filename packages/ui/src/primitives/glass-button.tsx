import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";
import { squircleStyle } from "../lib/squircle-style";

/**
 * FAZ 4 — GlassButton primitive migration.
 * See migration notes in commit history. Wrapper + shadow get
 * --radius-chip via shared squircleStyle helper; inner .glass-button CSS
 * class keeps hardcoded 9999px (anayasa "ezme" rule).
 */
const chipRadiusStyle = squircleStyle("chip");

const glassButtonVariants = cva(
  "glass-button relative isolate cursor-pointer r-chip transition-all",
  {
    variants: {
      size: {
        default: "text-base font-medium",
        sm: "text-sm font-medium",
        lg: "text-lg font-medium",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

const glassButtonTextVariants = cva(
  "glass-button-text relative block select-none tracking-tighter",
  {
    variants: {
      size: {
        default: "px-6 py-3.5",
        sm: "px-4 py-2",
        lg: "px-8 py-4",
        icon: "flex h-10 w-10 items-center justify-center",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  contentClassName?: string;
  buttonClassName?: string;
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    { className, children, size, contentClassName, buttonClassName, ...props },
    ref
  ) => {
    return (
      <div
        data-squircle=""
        style={chipRadiusStyle}
        className={cn("glass-button-wrap cursor-pointer", className)}
      >
        <button
          className={cn(glassButtonVariants({ size }), buttonClassName)}
          ref={ref}
          {...props}
        >
          <span
            className={cn(glassButtonTextVariants({ size }), contentClassName)}
          >
            {children}
          </span>
        </button>
        <div
          data-squircle=""
          style={chipRadiusStyle}
          className="glass-button-shadow"
          aria-hidden="true"
        />
      </div>
    );
  }
);
GlassButton.displayName = "GlassButton";

export { GlassButton, glassButtonVariants };
