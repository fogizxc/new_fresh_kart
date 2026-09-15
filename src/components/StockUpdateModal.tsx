import React, { useState } from 'react';
import {
  X,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import type { ApiProduct } from '../services/api';

export interface StockChangePlan {
  product: ApiProduct;
  previousStock: number;
  newStock: number;
  previousActive: boolean;
  newActive: boolean;
  reason?: string;
}

interface StockUpdateModalProps {
  product: ApiProduct;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (productId: string, newStock: number, active: boolean, password: string) => Promise<void>;
  flash: (msg: string) => void;
}

export const StockUpdateModal: React.FC<StockUpdateModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
  flash
}) => {
  // Controlled fields
  const [stock, setStock] = useState<number>(product.stock);
  const [isActive, setIsActive] = useState<boolean>(product.active ?? true);
  const [reason, setReason] = useState<string>('Routine Kirana inventory restock');

  // Multi-step verification: 'configure' -> 'summary_and_password'
  const [step, setStep] = useState<'configure' | 'summary'>('configure');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const hasStockChanged = stock !== product.stock;
  const hasStatusChanged = isActive !== (product.active ?? true);
  const isAvailableNow = isActive && stock > 0;
  const wasAvailableBefore = (product.active ?? true) && product.stock > 0;
  const delta = stock - product.stock;

  const handleProceedToSummary = () => {
    if (isNaN(stock) || stock < 0) {
      setError('Stock units must be a non-negative number (0 or higher).');
      return;
    }
    if (!hasStockChanged && !hasStatusChanged) {
      setError('Please modify either the stock quantity or availability to proceed.');
      return;
    }
    setError('');
    setStep('summary');
  };

  const handleApplyChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Shopkeeper verification password is required to save inventory modifications.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onConfirm(product.id, stock, isActive, password.trim());
      flash(`Inventory updated successfully for "${product.name}"`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid password or verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-[#fafcf9] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#173d2e] text-white">
              <Package size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-[#173d2e]">
                {step === 'configure' ? 'Update Product Inventory' : 'Verify & Authorize Changes'}
              </h3>
              <p className="text-[11px] font-bold text-slate-500">
                {product.sku || product.id} • {product.category}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step 1: Configure Stock & Availability Dropdown */}
        {step === 'configure' && (
          <div className="p-6 space-y-5">
            {/* Product Summary Card */}
            <div className="flex items-center gap-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-2xs border border-slate-100">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover rounded-xl" />
                ) : (
                  '📦'
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-[#173d2e] truncate">{product.name}</span>
                </div>
                <div className="text-xs text-slate-500 font-semibold mt-0.5">
                  Pack size: <span className="font-bold text-slate-700">{product.unit}</span> • Selling Price: ₹{product.sellingPrice}
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px]">
                  <span className="text-slate-500 font-bold">Current Stock:</span>
                  <span className={`font-black ${product.stock <= product.minStock ? 'text-amber-700' : 'text-emerald-800'}`}>
                    {product.stock} units
                  </span>
                  <span className={`rounded-full px-2 py-0.2 text-[9px] font-black ${
                    wasAvailableBefore ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {wasAvailableBefore ? '● IN STOCK' : '○ OUT OF STOCK'}
                  </span>
                </div>
              </div>
            </div>

            {/* Availability Dropdown */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#173d2e] mb-1.5">
                Product Availability Status
              </label>
              <div className="relative">
                <select
                  value={isActive ? 'available' : 'unavailable'}
                  onChange={e => {
                    const activeVal = e.target.value === 'available';
                    setIsActive(activeVal);
                    if (!activeVal && stock > 0) {
                      // Prompt friendly adjustment or let them keep count
                    }
                  }}
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-[#173d2e] shadow-2xs outline-none transition focus:border-[#173d2e] focus:ring-2 focus:ring-[#173d2e]/10 cursor-pointer"
                >
                  <option value="available">🟢 Available for Customers (Active in Catalog)</option>
                  <option value="unavailable">🔴 Temporarily Unavailable (Hidden / Disabled)</option>
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                If marked unavailable, the product cannot be ordered even if positive stock is logged.
              </p>
            </div>

            {/* Inventory Stock Count */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#173d2e]">
                  Available Physical Stock (Units)
                </label>
                <span className="text-[11px] font-bold text-slate-500">
                  Minimum threshold: {product.minStock} units
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStock(s => Math.max(0, s - 10))}
                  className="h-11 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 font-black text-xs text-slate-700 transition"
                  title="Minus 10"
                >
                  -10
                </button>
                <button
                  type="button"
                  onClick={() => setStock(s => Math.max(0, s - 1))}
                  className="h-11 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 font-black text-sm text-slate-700 transition"
                  title="Minus 1"
                >
                  -1
                </button>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  value={stock}
                  onChange={e => {
                    const val = parseInt(e.target.value, 10);
                    setStock(isNaN(val) ? 0 : Math.max(0, val));
                  }}
                  className="h-11 flex-1 text-center rounded-xl border border-slate-200 font-mono text-lg font-black text-[#173d2e] outline-none focus:border-[#173d2e]"
                />
                <button
                  type="button"
                  onClick={() => setStock(s => s + 1)}
                  className="h-11 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 font-black text-sm text-slate-700 transition"
                  title="Plus 1"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => setStock(s => s + 10)}
                  className="h-11 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 font-black text-xs text-slate-700 transition"
                  title="Plus 10"
                >
                  +10
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[0, 10, 25, 50, 100].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setStock(val)}
                    className={`rounded-lg px-2.5 py-1 text-[10px] font-black transition ${
                      stock === val
                        ? 'bg-[#173d2e] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Set to {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Reason */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                Reason / Note for Audit Log
              </label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g., Distributor fresh shipment arrived, damaged batch discarded"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#173d2e]"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Next Button */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2.5 text-xs font-black text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToSummary}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#173d2e] px-5 py-2.5 text-xs font-black text-white hover:bg-[#123024] shadow-sm transition active:scale-95"
              >
                <span>Review Summary & Verify</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Summary of Changes & Shopkeeper Password Input */}
        {step === 'summary' && (
          <form onSubmit={handleApplyChanges} className="p-6 space-y-5">
            {/* Summary Notice Header */}
            <div className="rounded-2xl bg-amber-50/80 border border-amber-200/80 p-4">
              <div className="flex items-start gap-2.5">
                <ShieldAlert size={18} className="text-amber-800 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                    Review Summary of Inventory Modifications
                  </h4>
                  <p className="mt-0.5 text-xs text-amber-800 leading-relaxed font-medium">
                    Please inspect the table below carefully. Once confirmed with your password, live customer orders will immediately reflect this new stock.
                  </p>
                </div>
              </div>
            </div>

            {/* Structured Changes Comparison Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#fafcf9] border-b border-slate-200/80 font-black uppercase tracking-wider text-[10px] text-slate-500">
                  <tr>
                    <th className="py-2.5 px-4">Parameter</th>
                    <th className="py-2.5 px-3 text-slate-500">Previous</th>
                    <th className="py-2.5 px-3 text-[#173d2e]">New Update</th>
                    <th className="py-2.5 px-4 text-right">Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {/* Stock count */}
                  <tr>
                    <td className="py-3 px-4 font-bold text-[#173d2e]">Stock Count</td>
                    <td className="py-3 px-3 text-slate-500">{product.stock} units</td>
                    <td className="py-3 px-3 font-black text-[#173d2e]">{stock} units</td>
                    <td className="py-3 px-4 text-right">
                      {delta === 0 ? (
                        <span className="text-[11px] text-slate-400">No Change</span>
                      ) : delta > 0 ? (
                        <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          +{delta} added
                        </span>
                      ) : (
                        <span className="text-[11px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                          {delta} reduced
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Availability */}
                  <tr>
                    <td className="py-3 px-4 font-bold text-[#173d2e]">Catalog Status</td>
                    <td className="py-3 px-3 text-slate-500">
                      {(product.active ?? true) ? 'Active' : 'Disabled'}
                    </td>
                    <td className="py-3 px-3 font-black">
                      {isActive ? (
                        <span className="text-emerald-700">Active (Visible)</span>
                      ) : (
                        <span className="text-rose-700">Disabled (Hidden)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isAvailableNow ? (
                        <span className="text-[11px] font-bold text-emerald-800">Purchasable</span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-800">Non-purchasable</span>
                      )}
                    </td>
                  </tr>

                  {/* Reason */}
                  {reason && (
                    <tr>
                      <td className="py-2.5 px-4 font-bold text-slate-500">Audit Log Note</td>
                      <td colSpan={3} className="py-2.5 px-3 text-slate-700 italic text-[11px]">
                        "{reason}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Shopkeeper Password Entry */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-[#173d2e]">
                Enter Shopkeeper Password to Confirm
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your login password (e.g., Password123)"
                  autoFocus
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-11 text-xs font-semibold text-slate-800 outline-none focus:border-[#173d2e] focus:ring-2 focus:ring-[#173d2e]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Verification ensures store modifications can only be authorized by the shopkeeper or store manager.
              </p>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setError('');
                  setStep('configure');
                }}
                className="rounded-xl px-4 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-100 transition"
              >
                ← Back to Edit
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !password}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#173d2e] px-6 py-2.5 text-xs font-black text-white hover:bg-[#123024] shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                <Lock size={14} />
                <span>{isSubmitting ? 'Verifying & Saving…' : 'Authenticate & Save Changes'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
