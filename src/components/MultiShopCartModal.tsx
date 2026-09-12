import React from 'react';
import { AlertTriangle, Trash2, ArrowRight } from 'lucide-react';

interface MultiShopCartModalProps {
  isOpen: boolean;
  currentShopName: string;
  newShopName: string;
  onClearAndSwitch: () => void;
  onKeepCurrent: () => void;
}

export const MultiShopCartModal: React.FC<MultiShopCartModalProps> = ({
  isOpen,
  currentShopName,
  newShopName,
  onClearAndSwitch,
  onKeepCurrent
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 mb-4">
            <AlertTriangle size={24} />
          </div>

          <h3 className="text-xl font-extrabold text-[#173d2e]">Replace Cart Items?</h3>
          <p className="mt-2 text-sm text-[#52655b] leading-relaxed">
            Your cart already contains items from <strong className="text-[#173d2e]">{currentShopName}</strong>.
            FreshCart delivers orders individually from each local shopkeeper in 15–25 minutes.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Would you like to discard the existing items and start shopping from{' '}
            <strong className="text-[#173d2e]">{newShopName}</strong>?
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              onClick={onClearAndSwitch}
              className="flex items-center justify-center gap-2 w-full rounded-2xl bg-[#173d2e] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#123024] transition-colors"
            >
              <Trash2 size={16} />
              <span>Clear Cart & Switch Store</span>
            </button>
            <button
              onClick={onKeepCurrent}
              className="flex items-center justify-center gap-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#52655b] hover:bg-slate-50 transition-colors"
            >
              <span>Keep Items from {currentShopName}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
