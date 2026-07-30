"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./ModalComponent";
import ObjectForm from "./ObjectForm";

export default function AddObjectComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Stamped when the sheet opens so the form can preview the review date
  // without reading the clock during render.
  const [openedAt, setOpenedAt] = useState<Date | null>(null);
  const router = useRouter();

  const openModal = () => {
    setOpenedAt(new Date());
    setIsModalOpen(true);
  };

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
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(1.75rem,env(safe-area-inset-bottom))]">
        {/* Fade so rows scrolling under the button stay readable. */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent" />

        <button
          type="button"
          onClick={openModal}
          aria-label="Add object"
          className="pointer-events-auto relative flex h-14 items-center gap-2 rounded-full bg-accent
                     px-5 text-[15px] font-semibold text-white shadow-float transition-all
                     duration-200 hover:brightness-110 hover:-translate-y-0.5 active:scale-95
                     cursor-pointer"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          <span>Add object</span>
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add new object"
        description="Name it, price it, then sit on it for a while."
      >
        <ObjectForm
          baseDate={openedAt}
          onSubmit={handleCreateObject}
          onCancel={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      </Modal>
    </>
  );
}
