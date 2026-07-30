"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Rendered as the sheet heading and wired to aria-labelledby. */
  title?: string;
  description?: string;
  /** Actions pinned below the scroll area, outside the scrolling body. */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  footer,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className="relative flex max-h-[92dvh] w-full animate-sheet-up flex-col overflow-hidden
                   rounded-t-3xl border border-line bg-surface shadow-float
                   sm:max-w-md sm:animate-pop-in sm:rounded-3xl"
      >
        {/* Grab affordance: signals the sheet is dismissible on touch. */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-line-strong" />
        </div>

        {(title || description) && (
          <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-4">
            <div className="space-y-1">
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold tracking-tight text-foreground"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm leading-relaxed text-muted">
                  {description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mt-1 -mr-1 inline-flex h-9 w-9 shrink-0 cursor-pointer items-center
                         justify-center rounded-lg text-muted transition-colors
                         hover:bg-surface-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </header>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-1">
          {children}
        </div>

        {footer && (
          <div className="flex gap-2.5 border-t border-line px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
