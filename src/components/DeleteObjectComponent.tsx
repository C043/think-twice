"use client";

import { Trash } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Modal from "./ModalComponent";

interface DeleteObjectComponentProps {
  objectId: string;
  objectName: string;
}

export default function DeleteObjectComponent({
  objectId,
  objectName,
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

      if (!resp.ok) {
        throw new Error("Deleting the object encountered an error");
      }

      toast.success("Object deleted successfully!");
      setIsModalOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("There was an error deleting the object, try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/20 transition-colors"
        title="Delete object"
      >
        <Trash className="h-4 w-4" />
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="flex flex-col h-full justify-between gap-4 p-5 text-left">
          <div className="space-y-3">
            <h2 className="text-xl font-bold dark:text-white text-black">
              Are you absolutely sure?
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              This action cannot be undone. This will permanently delete{" "}
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
              className="flex-1 p-2 border rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleDeleteObject}
              className="flex-1 p-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
