import { useState } from 'react';
import { AlertCircle, ArrowRight, Check, Package, RefreshCw, X } from 'lucide-react';
import type { ApiOrder, ApiOrderItem, ApiProduct } from '../services/api';

interface Props {
  order: ApiOrder;
  products: ApiProduct[];
  onClose: () => void;
  onApplySubstitution: (orderId: string, oldItem: ApiOrderItem, newItem: ApiProduct) => Promise<void>;
  flash: (msg: string) => void;
}

export function ItemSubstitutionModal({ order, products, onClose, onApplySubstitution, flash }: Props) {
  const [selectedItem, setSelectedItem] = useState<ApiOrderItem | null>(null);
  const [substituteProduct, setSubstituteProduct] = useState<ApiProduct | null>(null);
  const [saving, setSaving] = useState(false);

  const availableProducts = products.filter(p => p.stock > 0 && p.name !== selectedItem?.name);

  const handleConfirm = async () => {
    if (!selectedItem || !substituteProduct) return;
    setSaving(true);
    try {
      await onApplySubstitution(order.id, selectedItem, substituteProduct);
      flash(`Replaced ${selectedItem.name} with ${substituteProduct.name}`);
      onClose();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Substitution failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-4 backdrop-blur-sm">
      <div className="relative my-6 w-full max-w-lg rounded-[32px] bg-white shadow-2xl overflow-hidden border border-black/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 bg-[#fafbf8] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
              <RefreshCw size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#173d2e]">Out-of-Stock Item Substitution</h2>
              <p className="text-[11px] font-semibold text-[#718078]">Order #{order.id} • Smart Alternative Picker</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eef1ed] text-[#4d5c54] hover:bg-[#e2e7e1] transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Step 1: Select which item is missing */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">
              1. Select Missing / Out-of-Stock Item
            </label>
            <div className="space-y-2">
              {order.items.map(item => (
                <div
                  key={item.productId}
                  onClick={() => {
                    setSelectedItem(item);
                    setSubstituteProduct(null);
                  }}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl p-3.5 border transition ${
                    selectedItem?.productId === item.productId
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                      : 'border-black/5 bg-[#fafbf8] hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-gray-700 shadow-xs">
                      <Package size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{item.name}</h4>
                      <p className="text-[11px] text-gray-500">Qty: {item.quantity} • ₹{item.unitPrice} each</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-800">₹{item.unitPrice * item.quantity}</span>
                    {selectedItem?.productId === item.productId && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                        <Check size={12} />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Choose replacement product */}
          {selectedItem && (
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">
                2. Select Fresh Replacement from Available Stock
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {availableProducts.slice(0, 8).map(prod => (
                  <div
                    key={prod.id}
                    onClick={() => setSubstituteProduct(prod)}
                    className={`flex cursor-pointer items-center justify-between rounded-xl p-3 border transition ${
                      substituteProduct?.id === prod.id
                        ? 'border-[#173d2e] bg-[#f0f6f2]'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-900">{prod.name}</p>
                      <p className="text-[10px] text-gray-500">{prod.category} • {prod.stock} units in shelf</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-emerald-700">₹{prod.sellingPrice}</p>
                      <p className="text-[10px] text-gray-400">
                        {prod.sellingPrice > selectedItem.unitPrice
                          ? `+₹${prod.sellingPrice - selectedItem.unitPrice} diff`
                          : prod.sellingPrice < selectedItem.unitPrice
                          ? `-₹${selectedItem.unitPrice - prod.sellingPrice} refund`
                          : 'Same price'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comparison Preview */}
          {selectedItem && substituteProduct && (
            <div className="rounded-2xl bg-[#fafbf8] p-4 border border-black/5">
              <div className="flex items-center justify-between text-xs">
                <div className="text-gray-600">
                  <span className="text-[10px] font-bold uppercase block text-rose-500">Out of Stock</span>
                  <span className="font-bold text-gray-900">{selectedItem.name}</span>
                </div>
                <ArrowRight size={16} className="text-emerald-700" />
                <div className="text-right text-gray-600">
                  <span className="text-[10px] font-bold uppercase block text-emerald-600">Substitution</span>
                  <span className="font-bold text-[#173d2e]">{substituteProduct.name}</span>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-gray-500">
                Customer will be notified via SMS and in-app banner about this substitution.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="rounded-xl bg-gray-100 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              disabled={!selectedItem || !substituteProduct || saving}
              onClick={handleConfirm}
              className="rounded-xl bg-[#173d2e] px-5 py-2.5 text-xs font-black text-white hover:bg-[#204e3b] transition disabled:opacity-50"
            >
              {saving ? 'Updating Order…' : 'Confirm Item Substitution'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
