import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-md rounded-lg border border-[#1e222c] bg-[#0c0e13] p-5 shadow-2xl text-[#e8ebf0]">
        <div className="flex items-start justify-between border-b border-[#181a22] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 ${isDestructive ? 'text-[#ef4444]' : 'text-[#f59e0b]'}`} />
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#f4f5f7]">
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="rounded p-1 text-[#6e7484] hover:text-[#e4e7ec]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-[#a0a6b5] leading-relaxed mb-5 font-sans">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-[#1e222c] bg-[#101217] px-3 py-1.5 text-[#8c92a2] hover:text-[#f4f5f7] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-md px-3.5 py-1.5 font-medium transition-colors ${
              isDestructive
                ? 'bg-[#ef4444] text-white hover:bg-[#dc2626]'
                : 'bg-[#161820] text-[#f4f5f7] hover:bg-[#1f232e] border border-[#262a36]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
