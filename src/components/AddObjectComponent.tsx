"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./ModalComponent";
import ObjectForm from "./ObjectForm";

export default function AddObjectComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleCreateObject = async (formData: {
    name: string;
    price: number;
    reviewDays: number;
  }) => {
    const resp = await fetch("/api/objects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (!resp.ok) {
      throw new Error("Error during object saving.");
    }
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    router.refresh();
  };

  return (
    <>
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-14 h-14 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 rounded-full bg-white dark:bg-zinc-900 text-black dark:text-white shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer pointer-events-auto"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ObjectForm
          onSubmit={handleCreateObject}
          onCancel={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      </Modal>
    </>
  );
}
