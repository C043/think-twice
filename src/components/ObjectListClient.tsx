"use client";

import { SelectObject } from "@/db/schema";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DeleteObjectComponent from "./DeleteObjectComponent";
import ObjectForm from "./ObjectForm";
import Modal from "./ModalComponent";
import { toast } from "sonner";

interface ObjectListClientProps {
  initialObjects: SelectObject[];
}

export default function ObjectListClient({
  initialObjects,
}: ObjectListClientProps) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedObject, setSelectedObject] = useState<SelectObject | null>(
    null,
  );
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());

    const interval = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(interval);
  }, []);

  const calculateProgressPercentage = (obj: SelectObject): number => {
    if (!now || !obj.createdAt || !obj.reviewAt) return 0;
    const start = new Date(obj.createdAt).getTime();
    const end = new Date(obj.reviewAt).getTime();
    const current = now.getTime();

    const totalDuration = end - start;
    if (totalDuration <= 0) return 100;

    const timePassed = current - start;
    const percentage = (timePassed / totalDuration) * 100;

    return Math.max(0, Math.min(100, percentage));
  };

  const calculateReviewDays = (obj: SelectObject): number => {
    if (!obj.createdAt || !obj.reviewAt) return 30;

    const start = new Date(obj.createdAt);
    const end = new Date(obj.reviewAt);
    const diffInMs = end.getTime() - start.getTime();
    return Math.round(diffInMs / (1000 * 60 * 60 * 24)) || 30;
  };

  const handleOpenEdit = (obj: SelectObject) => {
    setSelectedObject(obj);
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (obj: SelectObject) => {
    setSelectedObject(obj);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setSelectedObject(null);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
  };

  const handleUpdateSubmit = async (data: {
    name: string;
    price: number;
    reviewDays: number;
  }) => {
    if (!selectedObject) return;
    const resp = await fetch(`/api/objects?id=${selectedObject.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!resp.ok) {
      const errData = await resp.json();
      throw new Error(errData.error || "Failed to update object");
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedObject) return;
    setLoadingDelete(true);
    try {
      const resp = await fetch(`/api/objects?id=${selectedObject.id}`, {
        method: "DELETE",
      });

      if (!resp.ok) throw new Error();

      toast.success("Object deleted successfully!");
      handleCloseModals();
      router.refresh();
    } catch (err) {
      toast.error("There was an error deleting the object.");
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div>
      <ul className="m-y-10 w-full">
        {initialObjects.map((obj: SelectObject) => {
          const progress = calculateProgressPercentage(obj);
          return (
            <li
              key={obj.id}
              className="relative overflow-hidden w-full mb-3 border dark:border-zinc-800 rounded-xl flex justify-between bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-200/90 dark:hover:bg-zinc-800/90 transition-colors items-center"
            >
              <div className="absolute inset-0 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors z-0" />
              <div
                className="absolute h-full top-0 left-0 bg-emerald-500/50 dark:bg-emerald-500/30 transition-all duration-1000 ease-out z-10 pointer-events-none"
                style={{ width: `${progress}%` }}
              />
              <div className="relative z-20 w-full flex justify-between items-center bg-transparent">
                {/*Passiamo la funzione handleOpenDelete al figlio, senza annidare modali qui*/}
                <DeleteObjectComponent
                  objectId={obj.id}
                  objectName={obj.name}
                  onDeleteClick={() => handleOpenDelete(obj)}
                >
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(obj)}
                    className="rounded-xl flex justify-between items-center w-full text-left cursor-pointer"
                  >
                    <div className="p-3">
                      <span className="font-medium text-black dark:text-white">
                        {obj.name}
                      </span>
                      <div className="flex gap-2 items-center">
                        <span className="text-zinc-500">
                          {(obj.price / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </button>
                </DeleteObjectComponent>
              </div>
            </li>
          );
        })}
      </ul>

      <Modal isOpen={isEditModalOpen} onClose={handleCloseModals}>
        {selectedObject && (
          <ObjectForm
            initialData={{
              name: selectedObject.name,
              price: selectedObject.price,
              reviewDays: calculateReviewDays(selectedObject),
            }}
            onSubmit={handleUpdateSubmit}
            onCancel={handleCloseModals}
            onSuccess={() => {
              handleCloseModals();
              router.refresh();
            }}
          />
        )}
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseModals}>
        {selectedObject && (
          <div className="flex flex-col h-full justify-between gap-4 p-5 text-left">
            <div className="space-y-3">
              <h2 className="text-xl font-bold dark:text-white text-black">
                Are you absolutely sure?
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                This will permanently delete{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  "{selectedObject.name}"
                </span>
                .
              </p>
            </div>

            <div className="flex gap-2 pt-4 border-t dark:border-zinc-800">
              <button
                type="button"
                disabled={loadingDelete}
                onClick={handleCloseModals}
                className="flex-1 p-2 border rounded-lg text-sm font-medium text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loadingDelete}
                onClick={handleDeleteSubmit}
                className="flex-1 p-2 bg-red-600 text-white rounded-lg text-sm font-medium"
              >
                {loadingDelete ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
