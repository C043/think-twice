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
      {/* Sized to the button, not to the viewport: a full-width fixed wrapper
          is a compositing layer the size of the screen that has to be blended
          over the scrolling list every frame. The gradient fade that used to
          live here cost the same and the shadow already separates the button
          from the rows. */}
      <div className="pointer-events-none fixed bottom-[max(1.75rem,env(safe-area-inset-bottom))] left-1/2 z-40 -translate-x-1/2">
        <button
          type="button"
          onClick={openModal}
          aria-label="Add object"
          className="pointer-events-auto relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full
                     bg-accent text-white shadow-float
                     transition-[background-color,transform] duration-200
                     hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] active:scale-95"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
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
