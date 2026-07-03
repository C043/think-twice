"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import Modal from "./ModalComponent";

interface DeleteObjectComponentProps {
  objectId: string;
  objectName: string;
  children: React.ReactNode;
}

export default function DeleteObjectComponent({
  objectId,
  objectName,
  children,
}: DeleteObjectComponentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDeleteObject = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/objects?id=${objectId}`, {
        method: "DELETE",
      });

      if (!resp.ok) throw new Error();

      toast.success("Object deleted successfully!");
      setIsModalOpen(false);
      router.refresh();
    } catch (err) {
      toast.error("There was an error deleting the object.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="block md:hidden w-full">
        <div className="flex overflow-x-auto scrollbar-none snap-x snap-mandatory rounded-xl w-full">
          <div className="w-full shrink-0 snap-start">{children}</div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
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
          onClick={() => setIsModalOpen(true)}
          className="me-3 p-2 border rounded-xl border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/50 transition-colors shrink-0"
          title="Delete object"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="flex flex-col h-full justify-between gap-4 p-5 text-left">
          <div className="space-y-3">
            <h2 className="text-xl font-bold dark:text-white text-black">
              Are you absolutely sure?
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              This will permanently delete{" "}
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                "{objectName}"
              </span>
              .
            </p>
          </div>

          <div className="flex gap-2 pt-4 border-t dark:border-zinc-800">
            <button
              type="button"
              disabled={loading}
              onClick={() => setIsModalOpen(false)}
              className="flex-1 p-2 border rounded-lg text-sm font-medium text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleDeleteObject}
              className="flex-1 p-2 bg-red-600 text-white rounded-lg text-sm font-medium"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
