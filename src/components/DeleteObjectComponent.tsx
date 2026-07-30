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

      <div className="hidden w-full items-center md:flex">
        <div className="min-w-0 flex-1">{children}</div>

        {/*
          Zero width at rest, so the row reserves nothing for a button that is
          not there. Growing this column is what shrinks the flex-1 content
          beside it, which is how the price, the date and the progress rail slide
          across — they need no transition of their own.

          This animates width, hence layout, unlike the progress rail. The cost
          profile is the opposite though: one card, once, on an intentional
          hover, rather than every row at once on a timer.

          focus-within and not just hover: the button stays tabbable while
          clipped, so a keyboard user has to be able to see where they are.
        */}
        <div
          className="flex w-0 items-center justify-center overflow-hidden
                     transition-[width] duration-200 ease-out
                     group-hover:w-14 group-focus-within:w-14"
        >
          <button
            type="button"
            onClick={onDeleteClick}
            aria-label={`Delete ${objectName}`}
            title="Delete object"
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center
                       rounded-xl text-muted opacity-0 transition-[opacity,background-color,color]
                       duration-200 hover:bg-red-500/10 hover:text-red-500
                       group-hover:opacity-100 group-focus-within:opacity-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
