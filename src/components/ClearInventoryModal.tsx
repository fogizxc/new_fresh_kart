import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Trash2,
  PackageX,
  RotateCcw,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldAlert,
  Layers,
  Sparkles
} from 'lucide-react';
import type { ApiProduct } from '../services/api';
import { clearShopkeeperInventory } from '../services/shopkeeperApi';

interface ClearInventoryModalProps {
  products: ApiProduct[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  flash: (message: string) => void;
  shopTitle?: string;
}

export const ClearInventoryModal: React.FC<ClearInventoryModalProps> = ({
  products,
  isOpen,
  onClose,
  onSuccess,
  flash,
  shopTitle = 'My Store'
}) => {
  const [clearType, setClearType] = useState<'zero_stock' | 'remove_all'>('zero_stock');
  const [confirmKeyword, setConfirmKeyword] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [reason, setReason] = useState('Store physical stock count reset');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const totalProducts = products.length;
  const totalUnits = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const isConfirmKeywordMatch = confirmKeyword.trim().toUpperCase() === 'CLEAR';

  const handleClear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmKeywordMatch) {
      setError('Please type "CLEAR" in the confirmation box to confirm this action.');
      return;
    }
    if (!password.trim()) {
      setError('Your shopkeeper account password is required to authorize this action.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await clearShopkeeperInventory(clearType, password.trim(), reason.trim());
      flash(response.message || 'Inventory cleared successfully.');
      await onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear inventory. Please check your password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-black/10 overflow-hidden z-10 my-8">
        {/* Header Banner */}
        <div className="bg-linear-to-r from-[#173d2e] to-[#245e46] p-6 text-white relative">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full p-2 text-white/75 hover:text-white hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-xs">
              <PackageX size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-rose-500/25 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-200 border border-rose-400/30">
                  Shopkeeper Action
                </span>
                <span className="text-xs text-emerald-200 font-medium">{shopTitle}</span>
              </div>
              <h2 className="heading mt-1 text-2xl font-extrabold text-white">Clear Store Inventory</h2>
            </div>
          </div>
        </div>

        {/* Current State Summary Pill */}
        <div className="bg-[#fafbf8] border-b border-black/5 px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#63756c]">
            <Layers size={16} className="text-[#3b795b]" />
            <span>Currently catalogued:</span>
          </div>
          <div className="flex items-center gap-3 font-mono font-bold text-sm">
            <span className="rounded-xl bg-white border border-black/5 px-3 py-1 text-[#173d2e]">
              {totalProducts} products
            </span>
            <span className="rounded-xl bg-white border border-black/5 px-3 py-1 text-[#173d2e]">
              {totalUnits} units in stock
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleClear} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-800">
              <AlertTriangle size={18} className="shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-extrabold text-[#203229] uppercase tracking-wider mb-2">
              Select Clear Method
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Option 1: Zero Out Stock */}
              <div
                onClick={() => setClearType('zero_stock')}
                className={`cursor-pointer rounded-2xl border p-4 transition text-left flex flex-col justify-between ${
                  clearType === 'zero_stock'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-600/20'
                    : 'border-black/10 bg-[#fafcf9] hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RotateCcw size={16} className={clearType === 'zero_stock' ? 'text-emerald-700' : 'text-gray-500'} />
                      <span className="text-sm font-extrabold text-[#173d2e]">Zero Out All Stock</span>
                    </div>
                    <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black text-emerald-800 uppercase">
                      Recommended
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-[#5c6e64]">
                    Sets all product quantities to <b>0</b> and marks them <b>Out of Stock</b>.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-900/10 text-[10px] text-[#4d6a59]">
                  ✓ Preserves product details, SKUs, and barcodes for quick restocking.
                </div>
              </div>

              {/* Option 2: Remove All Products */}
              <div
                onClick={() => setClearType('remove_all')}
                className={`cursor-pointer rounded-2xl border p-4 transition text-left flex flex-col justify-between ${
                  clearType === 'remove_all'
                    ? 'border-rose-600 bg-rose-50/50 shadow-xs ring-2 ring-rose-600/20'
                    : 'border-black/10 bg-[#fafcf9] hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trash2 size={16} className={clearType === 'remove_all' ? 'text-rose-600' : 'text-gray-500'} />
                      <span className="text-sm font-extrabold text-[#7a2020]">Purge Entire Catalog</span>
                    </div>
                    <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[9px] font-black text-rose-800 uppercase">
                      Destructive
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-[#7a4848]">
                    Completely <b>deletes all products</b> from your store catalog.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-rose-900/10 text-[10px] text-[#854545]">
                  ⚠️ Clears catalogue entirely so you can re-import a brand new CSV.
                </div>
              </div>
            </div>
          </div>

          {/* Reason / Audit Note */}
          <div>
            <label className="block text-xs font-bold text-[#35483d] mb-1.5">
              Reason for clearing (Logged in audit trail)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Physical inventory count, seasonal swap, store restock"
              className="w-full rounded-xl border border-black/10 bg-[#fafbf8] px-3.5 py-2.5 text-xs text-[#1e2f26] placeholder:text-gray-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#173d2e]"
              maxLength={150}
            />
          </div>

          {/* Confirmation keyword verification */}
          <div className="rounded-2xl bg-amber-50 border border-amber-200/80 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <ShieldAlert size={16} className="text-amber-700 shrink-0" />
              <span>Safety confirmation: type <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 font-extrabold text-amber-950">CLEAR</span> to proceed</span>
            </div>
            <input
              type="text"
              value={confirmKeyword}
              onChange={(e) => setConfirmKeyword(e.target.value)}
              placeholder="Type CLEAR here"
              className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-xs font-mono font-bold tracking-wider uppercase text-[#173d2e] placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Password authentication */}
          <div>
            <label className="block text-xs font-bold text-[#35483d] mb-1.5">
              Enter shopkeeper password to authorize
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                <Lock size={15} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Account password"
                className="w-full rounded-xl border border-black/10 bg-[#fafbf8] pl-10 pr-10 py-2.5 text-xs text-[#1e2f26] placeholder:text-gray-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#173d2e]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-extrabold text-[#4f6057] hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isConfirmKeywordMatch || !password.trim()}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black text-white transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                clearType === 'remove_all'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-[#173d2e] hover:bg-[#123024]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Clearing inventory...</span>
                </>
              ) : clearType === 'remove_all' ? (
                <>
                  <Trash2 size={14} />
                  <span>Permanently Purge All ({totalProducts})</span>
                </>
              ) : (
                <>
                  <RotateCcw size={14} />
                  <span>Zero Out All Stock ({totalProducts})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
