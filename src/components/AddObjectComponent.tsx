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
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-5 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 border rounded-4xl dark:text-white text-black"
      >
        <Plus className="h-5 w-5" />
      </button>

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
