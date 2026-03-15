import React from "react";

interface BaseFormModalProps {
  showModal: boolean;
  closeModal?: (value: boolean) => void;
  modalId: string;
  modalTitle: string;
  children: React.ReactNode;
}

const BaseFormModal: React.FC<BaseFormModalProps> = ({
  showModal,
  closeModal = () => {},
  modalId,
  modalTitle,
  children,
}) => {
  if (!showModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      id={modalId}
      aria-modal="true"
      role="dialog"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-zinc-900 shadow-2xl flex flex-col overflow-hidden">
        {/* Close button */}
        <button
          type="button"
          className="absolute top-4 right-4 text-zinc-300 hover:text-white text-3xl font-bold bg-transparent border-none cursor-pointer"
          aria-label="Close"
          onClick={() => closeModal(false)}
        >
          &times;
        </button>
        {/* Title */}
        <div className="px-8 pt-4 pb-4 bg-[#df002b]">
          <h2 className="text-2xl font-bold text-white">{modalTitle}</h2>
        </div>
        {/* Content */}
        <div className="px-8 pt-8 pb-8 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BaseFormModal;