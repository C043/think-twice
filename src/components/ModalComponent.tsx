import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-50 w-full bg-white dark:bg-zinc-950 border dark:border-zinc-800 h-full sm:h-auto sm:max-w-md sm:rounded-2xl shadow-xl flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        <div className="flex-1 overflow-y-auto sm:p-2">{children}</div>
      </div>
    </div>
  );
}
