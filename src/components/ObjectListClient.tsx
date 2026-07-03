"use client";

import { SelectObject } from "@/db/schema";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DeleteObjectComponent from "./DeleteObjectComponent";
import ObjectForm from "./ObjectForm";
import Modal from "./ModalComponent";

interface ObjectListClientProps {
  initialObjects: SelectObject[];
}

export default function ObjectListClient({
  initialObjects,
}: ObjectListClientProps) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedObject, setSelectedObject] = useState<SelectObject | null>(
    null,
  );

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

  const handleCloseEdit = () => {
    setSelectedObject(null);
    setIsEditModalOpen(false);
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
  return (
    <div>
      <ul className="m-y-10 w-full">
        {initialObjects.map((obj: SelectObject) => (
          <li
            key={obj.id}
            className="mb-3 border dark:border-zinc-800 rounded-xl flex justify-between bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-200/90 dark:hover:bg-zinc-800/90 transition-colors items-center"
          >
            <DeleteObjectComponent objectId={obj.id} objectName={obj.name}>
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
          </li>
        ))}
      </ul>

      <Modal isOpen={isEditModalOpen} onClose={handleCloseEdit}>
        {selectedObject && (
          <ObjectForm
            initialData={{
              name: selectedObject.name,
              price: selectedObject.price,
              reviewDays: calculateReviewDays(selectedObject),
            }}
            onSubmit={handleUpdateSubmit}
            onCancel={handleCloseEdit}
            onSuccess={() => {
              handleCloseEdit();
              router.refresh();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
