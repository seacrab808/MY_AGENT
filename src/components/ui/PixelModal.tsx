"use client";

import { ReactNode } from "react";
import { PixelIconButton } from "@/components/ui/PixelIconButton";

interface PixelModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  emoji?: string;
}

export function PixelModal({ open, onClose, title, children, emoji }: PixelModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-pixel-ink/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-pixel-panel border-2 border-pixel-border rounded-[20px] shadow-[var(--pixel-shadow-lg)] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="font-cute text-2xl flex items-center gap-2">
            {emoji && <span>{emoji}</span>}
            {title}
          </h2>
          <PixelIconButton tone="red" onClick={onClose} aria-label="닫기">
            X
          </PixelIconButton>
        </div>
        {children}
      </div>
    </div>
  );
}
