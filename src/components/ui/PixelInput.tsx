import { forwardRef, InputHTMLAttributes } from "react";

export const PixelInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function PixelInput({ className = "", ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={`font-body text-base px-3 py-2 border-2 border-pixel-border rounded-[12px] bg-pixel-bg text-pixel-ink placeholder:text-pixel-ink-soft shadow-[inset_0_1px_3px_rgba(120,90,70,0.08)] focus:outline-none focus:ring-2 focus:ring-pixel-purple ${className}`}
        {...rest}
      />
    );
  },
);
