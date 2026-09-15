import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Coffee,
  Egg,
  Milk,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Sun,
  Trash2,
  X,
  AlertCircle
} from 'lucide-react';
import type { ApiProduct } from '../services/api';

export interface SubscriptionItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string;
  quantity: number;
  frequency: 'DAILY' | 'ALTERNATE_DAYS' | 'WEEKDAYS' | 'WEEKENDS';
  slot: '6:00 AM - 7:30 AM' | '7:30 AM - 9:00 AM';
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  startDate: string;
  pausedDates: string[];
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ApiProduct[];
  flash: (msg: string) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  products,
  flash
}) => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  // New Subscription Form
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [frequency, setFrequency] = useState<'DAILY' | 'ALTERNATE_DAYS' | 'WEEKDAYS' | 'WEEKENDS'>('DAILY');
  const [slot, setSlot] = useState<'6:00 AM - 7:30 AM' | '7:30 AM - 9:00 AM'>('6:00 AM - 7:30 AM');
  const [submitting, setSubmitting] = useState(false);

  // Filter essential subscription items from catalog (Dairy, Bakery, Eggs, Fruits)
  const essentialProducts = products.filter(
    p =>
      p.category === 'Dairy & Eggs' ||
      p.category === 'Pantry' ||
      p.category === 'Fruits' ||
      /milk|bread|egg|butter|curd|paneer|dahi/i.test(p.name)
  );

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('freshcart_token');
      const res = await fetch('/api/subscriptions', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSubscriptions();
      if (essentialProducts.length > 0 && !selectedProductId) {
        setSelectedProductId(essentialProducts[0].id);
      }
    }
  }, [isOpen, essentialProducts.length]);

  const handleTogglePause = async (id: string) => {
    try {
      const token = localStorage.getItem('freshcart_token');
      const res = await fetch(`/api/subscriptions/${id}/toggle`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(prev =>
          prev.map(s => (s.id === id ? { ...s, status: data.status } : s))
        );
        flash(`Subscription ${data.status === 'ACTIVE' ? 'resumed' : 'paused'}`);
      }
    } catch {
      flash('Failed to update subscription status');
    }
  };

  const handleSkipDate = async (id: string, dateStr: string) => {
    try {
      const token = localStorage.getItem('freshcart_token');
      const res = await fetch(`/api/subscriptions/${id}/pause-date`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ date: dateStr })
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(prev =>
          prev.map(s => (s.id === id ? { ...s, pausedDates: data.pausedDates } : s))
        );
        flash('Delivery calendar updated');
      }
    } catch {
      flash('Could not update date pause');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('freshcart_token');
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setSubscriptions(prev => prev.filter(s => s.id !== id));
        setConfirmCancelId(null);
        flash('Subscription cancelled');
      }
    } catch {
      flash('Failed to cancel subscription');
    }
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('freshcart_token');
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          productId: selectedProductId,
          quantity,
          frequency,
          slot
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSubscriptions(prev => [data.subscription, ...prev]);
        setIsCreating(false);
        flash('Daily doorstep subscription activated!');
      } else {
        const err = await res.json();
        flash(err.error || 'Failed to create subscription');
      }
    } catch {
      flash('Network error creating subscription');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Next 5 upcoming dates for quick skip toggle
  const upcomingDates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      iso: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateNum: d.getDate()
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-black/10 my-8">
        {/* Header */}
        <div className="bg-[#173d2e] p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d7ef8d] text-[#173d2e]">
                <Sun size={24} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Morning Essentials Subscriptions</h3>
                <p className="text-xs text-emerald-200">
                  Fresh milk, bread & eggs delivered to your doorstep by 7:00 AM
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black uppercase tracking-wider text-[#798881]">
              Active Subscriptions ({subscriptions.length})
            </h4>
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#173d2e] px-4 py-2 text-xs font-black text-white hover:bg-[#20503e] transition shadow-xs"
            >
              <Plus size={15} />
              <span>{isCreating ? 'Cancel' : 'Subscribe New Item'}</span>
            </button>
          </div>

          {/* New Subscription Form */}
          {isCreating && (
            <form
              onSubmit={handleCreateSubscription}
              className="rounded-2xl border border-emerald-900/10 bg-[#f4f7f4] p-5 space-y-4"
            >
              <div className="flex items-center gap-2 text-xs font-black text-[#173d2e]">
                <Plus size={16} />
                <span>Configure Daily / Recurring Delivery</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Essential Item</label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-emerald-600"
                  required
                >
                  {(essentialProducts.length > 0 ? essentialProducts : products).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{p.sellingPrice} / {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Quantity per Delivery</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-9 w-9 rounded-lg bg-white border border-gray-300 font-black text-gray-700 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-black text-sm">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-9 w-9 rounded-lg bg-white border border-gray-300 font-black text-gray-700 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value as any)}
                    className="w-full rounded-xl border border-gray-300 bg-white p-2 text-xs font-bold text-gray-800 outline-none"
                  >
                    <option value="DAILY">Every Day</option>
                    <option value="ALTERNATE_DAYS">Alternate Days</option>
                    <option value="WEEKDAYS">Mon to Fri Only</option>
                    <option value="WEEKENDS">Sat & Sun Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Morning Slot</label>
                  <select
                    value={slot}
                    onChange={e => setSlot(e.target.value as any)}
                    className="w-full rounded-xl border border-gray-300 bg-white p-2 text-xs font-bold text-gray-800 outline-none"
                  >
                    <option value="6:00 AM - 7:30 AM">6:00 AM - 7:30 AM (Silent Drop)</option>
                    <option value="7:30 AM - 9:00 AM">7:30 AM - 9:00 AM</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#173d2e] px-5 py-2 text-xs font-black text-white hover:bg-[#20503e] transition disabled:opacity-50"
                >
                  {submitting ? 'Activating...' : 'Confirm Subscription'}
                </button>
              </div>
            </form>
          )}

          {/* Subscriptions List */}
          {loading ? (
            <div className="py-12 text-center text-sm font-bold text-gray-500">
              Loading your daily subscriptions...
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 p-8 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#173d2e]">
                <Milk size={28} />
              </div>
              <h5 className="font-extrabold text-gray-800">No Active Subscriptions Yet</h5>
              <p className="mx-auto max-w-sm text-xs text-gray-500">
                Never run out of milk or bread! Schedule recurring daily deliveries with 0 delivery fee and early 6:30 AM doorstep drops.
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#173d2e] px-4 py-2 text-xs font-black text-white"
              >
                <Plus size={14} />
                <span>Start Your First Daily Item</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map(sub => {
                const isPaused = sub.status === 'PAUSED';
                return (
                  <div
                    key={sub.id}
                    className={`rounded-2xl border p-4 transition-all ${
                      isPaused
                        ? 'border-gray-200 bg-gray-50/70 opacity-80'
                        : 'border-emerald-950/10 bg-white shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-black/5">
                          <img
                            src={sub.productImage || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80'}
                            alt={sub.productName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-gray-900">{sub.productName}</span>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                                isPaused
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {sub.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {sub.quantity} units • ₹{sub.productPrice * sub.quantity} / day •{' '}
                            <span className="font-bold text-gray-700">{sub.frequency.replace('_', ' ')}</span>
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-[#3c7257] font-semibold mt-1">
                            <Clock size={12} />
                            <span>{sub.slot}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleTogglePause(sub.id)}
                          className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                            isPaused
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                          }`}
                        >
                          {isPaused ? <Play size={13} /> : <Pause size={13} />}
                          <span>{isPaused ? 'Resume' : 'Pause'}</span>
                        </button>
                        {confirmCancelId === sub.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(sub.id)}
                              className="rounded-xl bg-red-600 px-2.5 py-1 text-[11px] font-black text-white hover:bg-red-700 transition"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmCancelId(null)}
                              className="rounded-xl bg-gray-200 px-2 py-1 text-[11px] font-bold text-gray-700 hover:bg-gray-300 transition"
                            >
                              Keep
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmCancelId(sub.id)}
                            title="Cancel Subscription"
                            className="rounded-xl p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick 5-day calendar skip toggle */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-[11px] font-bold text-gray-500 mb-1.5 flex items-center gap-1">
                        <Calendar size={12} />
                        <span>Upcoming Deliveries (tap date to skip):</span>
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {upcomingDates.map(d => {
                          const isSkipped = sub.pausedDates?.includes(d.iso);
                          return (
                            <button
                              key={d.iso}
                              type="button"
                              onClick={() => handleSkipDate(sub.id, d.iso)}
                              className={`flex flex-col items-center justify-center rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition border ${
                                isSkipped
                                  ? 'border-red-200 bg-red-50 text-red-700 line-through'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                              }`}
                            >
                              <span className="text-[9px] uppercase font-bold opacity-75">{d.dayName}</span>
                              <span className="text-xs font-black">{d.dateNum}</span>
                              <span className="text-[8px] font-semibold mt-0.5">
                                {isSkipped ? 'Skipped' : 'Delivering'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Perks Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="rounded-2xl bg-[#f8faf8] p-3 border border-black/5 text-center">
              <span className="text-lg">🚪</span>
              <p className="text-xs font-black text-gray-800 mt-1">Silent Morning Drop</p>
              <p className="text-[10px] text-gray-500">No doorbell wake-up calls</p>
            </div>
            <div className="rounded-2xl bg-[#f8faf8] p-3 border border-black/5 text-center">
              <span className="text-lg">⚡</span>
              <p className="text-xs font-black text-gray-800 mt-1">Zero Delivery Charge</p>
              <p className="text-[10px] text-gray-500">Always free on daily essentials</p>
            </div>
            <div className="rounded-2xl bg-[#f8faf8] p-3 border border-black/5 text-center">
              <span className="text-lg">🏖️</span>
              <p className="text-xs font-black text-gray-800 mt-1">Vacation Mode</p>
              <p className="text-[10px] text-gray-500">Pause anytime with 1 tap</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
