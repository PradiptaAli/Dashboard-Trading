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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md select-none">
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.09] bg-[#0A0D15]/95 p-6 shadow-2xl text-[#e8ebf0] backdrop-blur-2xl">
        <div className="flex items-start justify-between border-b border-white/[0.06] pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className={`h-4 w-4 ${isDestructive ? 'text-rose-400' : 'text-amber-400'}`} />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-6 font-sans">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2.5 font-mono text-xs">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 font-bold transition-all shadow-md active:scale-[0.98] ${
              isDestructive
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-[#07090E] shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
