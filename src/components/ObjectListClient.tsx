"use client";

import { SelectObject } from "@/db/schema";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import DeleteObjectComponent from "./DeleteObjectComponent";
import ObjectForm from "./ObjectForm";
import Modal from "./ModalComponent";
import { toast } from "sonner";
import { dangerButton, secondaryButton } from "./ui/styles";
import {
  formatPrice,
  formatReviewDate,
  formatTimeLeft,
  isReadyToDecide,
  progressPercentage,
  reviewDaysBetween,
} from "@/lib/object-format";

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
  // Null until mounted: the server has no clock the client would agree with.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());

    const interval = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(interval);
  }, []);

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
    } catch {
      toast.error("There was an error deleting the object.");
    } finally {
      setLoadingDelete(false);
    }
  };

  const totalCents = initialObjects.reduce((sum, obj) => sum + obj.price, 0);
  const readyCount = now
    ? initialObjects.filter((obj) => isReadyToDecide(obj.reviewAt, now)).length
    : 0;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <p className="text-[13px] text-muted">
          <span className="font-semibold text-foreground">
            {initialObjects.length}
          </span>{" "}
          {initialObjects.length === 1 ? "object" : "objects"} on hold
          <span className="mx-1.5 opacity-40">·</span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatPrice(totalCents)}
          </span>{" "}
          resisted
        </p>

        {readyCount > 0 && (
          <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            {readyCount} ready
          </span>
        )}
      </div>

      <ul className="flex w-full flex-col gap-2.5">
        {initialObjects.map((obj, index) => {
          const progress = now
            ? progressPercentage(obj.createdAt, obj.reviewAt, now)
            : 0;
          const ready = now ? isReadyToDecide(obj.reviewAt, now) : false;

          return (
            <li
              key={obj.id}
              style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              className={`group animate-row-in overflow-hidden rounded-2xl border bg-surface shadow-card
                          transition-all duration-200 hover:-translate-y-0.5 hover:shadow-float ${
                            ready
                              ? "border-emerald-500/40"
                              : "border-line hover:border-line-strong"
                          }`}
            >
              {/* handleOpenDelete is passed down; the modal stays mounted once, here. */}
              <DeleteObjectComponent
                objectId={obj.id}
                objectName={obj.name}
                onDeleteClick={() => handleOpenDelete(obj)}
              >
                <button
                  type="button"
                  onClick={() => handleOpenEdit(obj)}
                  className="w-full cursor-pointer px-4 py-3.5 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            ready
                              ? "bg-emerald-500"
                              : "animate-breathe bg-accent"
                          }`}
                        />
                        <span className="truncate font-medium text-foreground">
                          {obj.name}
                        </span>
                      </div>

                      <div className="mt-1.5 pl-3.5">
                        {!now ? (
                          <div className="h-3.5 w-28 animate-breathe rounded bg-line" />
                        ) : ready ? (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Ready to decide
                          </span>
                        ) : (
                          <span className="text-[13px] text-muted tabular-nums">
                            {formatTimeLeft(obj.reviewAt, now)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="font-semibold tabular-nums text-foreground">
                        {formatPrice(obj.price)}
                      </div>
                      <div className="mt-1 text-[11px] text-muted tabular-nums">
                        {formatReviewDate(obj.reviewAt)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-line">
                    <div
                      className={`h-full rounded-full transition-[width] duration-1000 ease-out ${
                        ready ? "bg-emerald-500" : "bg-accent"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </button>
              </DeleteObjectComponent>
            </li>
          );
        })}
      </ul>

      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseModals}
        title="Edit object"
        description="Change the details or restart the waiting period."
      >
        {selectedObject && (
          <ObjectForm
            initialData={{
              name: selectedObject.name,
              price: selectedObject.price,
              reviewDays: reviewDaysBetween(
                selectedObject.createdAt,
                selectedObject.reviewAt,
              ),
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

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModals}
        title="Delete this object?"
        description={
          selectedObject
            ? `"${selectedObject.name}" and its waiting period will be removed for good.`
            : undefined
        }
        footer={
          <>
            <button
              type="button"
              disabled={loadingDelete}
              onClick={handleCloseModals}
              className={secondaryButton}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loadingDelete}
              onClick={handleDeleteSubmit}
              className={dangerButton}
            >
              {loadingDelete && <Loader2 className="h-4 w-4 animate-spin" />}
              {loadingDelete ? "Deleting" : "Delete"}
            </button>
          </>
        }
      >
        <div className="pb-1" />
      </Modal>
    </div>
  );
}
