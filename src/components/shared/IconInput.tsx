"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type IconInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ReactNode;
  label?: string;
  error?: string;
};

export const IconInput = React.forwardRef<HTMLInputElement, IconInputProps>(
  ({ icon, label, error, id, className, ...props }, ref) => {
    const inputId =
      id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    return (
      <div className="w-full min-w-0">
        {label ? (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-jc-text-primary mb-1.5"
          >
            {label}
          </label>
        ) : null}
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl bg-[#f0f4f8] px-3 h-12 transition-colors min-w-0",
            error && "ring-2 ring-jc-warning/40",
          )}
        >
          {icon ? (
            <span className="text-jc-text-muted shrink-0">{icon}</span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            size={1}
            className={cn(
              "flex-1 min-w-0 w-full bg-transparent outline-none text-sm text-jc-text-primary placeholder:text-jc-text-muted",
              className,
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="mt-1 text-xs text-jc-warning">{error}</p>
        ) : null}
      </div>
    );
  },
);
IconInput.displayName = "IconInput";
