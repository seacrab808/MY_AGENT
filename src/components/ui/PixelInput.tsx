import { InputHTMLAttributes } from "react";

export function PixelInput({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`font-body text-base px-3 py-2 border-[3px] border-pixel-border rounded-[10px] bg-pixel-bg text-pixel-ink placeholder:text-pixel-ink-soft shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-pixel-blue ${className}`}
      {...rest}
    />
  );
}
