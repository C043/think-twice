"use client";

import { Trash2 } from "lucide-react";

interface DeleteObjectComponentProps {
  objectId: string;
  objectName: string;
  children: React.ReactNode;
  onDeleteClick: () => void;
}

/**
 * Wraps a row with its delete affordance: swipe-to-reveal on touch, a quiet
 * icon button on pointer devices. Opening the confirmation is the parent's job.
 */
export default function DeleteObjectComponent({
  objectName,
  children,
  onDeleteClick,
}: DeleteObjectComponentProps) {
  return (
    <div className="w-full">
      {/* Touch: horizontal snap scroller reveals the destructive panel. */}
      <div className="block w-full md:hidden">
        <div className="flex w-full snap-x snap-mandatory overflow-x-auto scrollbar-none">
          <div className="w-full shrink-0 snap-start">{children}</div>
          <button
            type="button"
            onClick={onDeleteClick}
            aria-label={`Delete ${objectName}`}
            className="flex w-[104px] shrink-0 snap-end cursor-pointer flex-col items-center
                       justify-center gap-1 bg-red-600 text-white transition-colors
                       active:bg-red-700"
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-[11px] font-semibold tracking-wide">
              Delete
            </span>
          </button>
        </div>
      </div>

      <div className="hidden w-full items-center gap-2 md:flex">
        <div className="min-w-0 flex-1">{children}</div>
        <button
          type="button"
          onClick={onDeleteClick}
          aria-label={`Delete ${objectName}`}
          title="Delete object"
          className="mr-3 inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center
                     rounded-xl text-muted opacity-0 transition-all duration-200
                     hover:bg-red-500/10 hover:text-red-500 focus-visible:opacity-100
                     group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
