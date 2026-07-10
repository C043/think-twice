"use client";

import { Trash2 } from "lucide-react";

interface DeleteObjectComponentProps {
  objectId: string;
  objectName: string;
  children: React.ReactNode;
  onDeleteClick: () => void;
}

export default function DeleteObjectComponent({
  children,
  onDeleteClick,
}: DeleteObjectComponentProps) {
  return (
    <div className="w-full">
      <div className="block md:hidden w-full">
        <div className="flex overflow-x-auto scrollbar-none snap-x snap-mandatory rounded-xl w-full">
          <div className="w-full shrink-0 snap-start">{children}</div>
          <button
            type="button"
            className="bg-red-600 text-white px-5 text-sm font-medium shrink-0 snap-end flex items-center justify-center rounded-r-xl"
            style={{ width: "100px" }}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="hidden md:flex items-center justify-between w-full gap-4">
        <div className="flex-1">{children}</div>
        <button
          type="button"
          className="me-3 p-2 border rounded-xl border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/50 transition-colors shrink-0"
          title="Delete object"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
