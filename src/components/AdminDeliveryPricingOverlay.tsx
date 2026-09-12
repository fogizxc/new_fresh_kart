import { useEffect, useState, type FormEvent } from 'react';
import { Bike, Check, Settings2, Sliders, X } from 'lucide-react';

interface DeliveryPricing {
  baseRatePerKm: number;
  milestoneRatePerKm: number;
  milestoneDeliveries: number;
  updatedAt?: string;
  updatedBy?: string;
}

export function AdminDeliveryPricingOverlay() {
  const [open, setOpen] = useState(false);
  const [pricing, setPricing] = useState<DeliveryPricing>({
    baseRatePerKm: 5,
    milestoneRatePerKm: 7,
    milestoneDeliveries: 50
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const loadPricing = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/delivery/pricing', {
        headers: { Authorization: `Bearer ${localStorage.getItem('freshcart_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPricing(data);
      }
    } catch {
      // Keep defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      void loadPricing();
    }
  }, [open]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast('');
    try {
      const res = await fetch('/api/delivery/pricing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('freshcart_token')}`
        },
        body: JSON.stringify(pricing)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Failed to update delivery pricing');
      }
      const updated = await res.json();
      setPricing(updated);
      setToast('Delivery pricing updated successfully!');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Error updating pricing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-5 z-40 flex items-center gap-2 rounded-2xl bg-[#173d2e] px-4 py-3 text-xs font-black text-white shadow-xl hover:bg-[#122e23]"
        title="Tune delivery partner rates"
      >
        <Sliders size={16} className="text-[#d7ef8d]" />
        <span>DELIVERY RATES</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf1ea] text-[#3c7358]">
                  <Bike size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#173d2e]">Delivery Partner Rates</h3>
                  <p className="text-[11px] text-[#78877f]">Configure rider per-km pay & incentives</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X size={18} />
              </button>
            </div>

            {loading ? (
              <div className="py-10 text-center text-xs font-semibold text-[#78877f]">
                Loading current pricing rates...
              </div>
            ) : (
              <form onSubmit={handleSave} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#52655b]">
                    Base Rate Per Km (₹)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="500"
                    required
                    value={pricing.baseRatePerKm}
                    onChange={e =>
                      setPricing({ ...pricing, baseRatePerKm: parseFloat(e.target.value) || 0 })
                    }
                    className="mt-1 w-full rounded-2xl border border-black/10 bg-[#fafbf8] p-3 text-sm font-semibold outline-none focus:border-[#6f9f83]"
                  />
                  <p className="mt-1 text-[10px] text-[#86958d]">
                    Standard compensation paid per kilometer from shop to doorstep.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#52655b]">
                    Milestone Rate Per Km (₹)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="500"
                    required
                    value={pricing.milestoneRatePerKm}
                    onChange={e =>
                      setPricing({ ...pricing, milestoneRatePerKm: parseFloat(e.target.value) || 0 })
                    }
                    className="mt-1 w-full rounded-2xl border border-black/10 bg-[#fafbf8] p-3 text-sm font-semibold outline-none focus:border-[#6f9f83]"
                  />
                  <p className="mt-1 text-[10px] text-[#86958d]">
                    Incentivized compensation once a rider hits the delivery milestone.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#52655b]">
                    Milestone Target (Deliveries Count)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    required
                    value={pricing.milestoneDeliveries}
                    onChange={e =>
                      setPricing({
                        ...pricing,
                        milestoneDeliveries: parseInt(e.target.value, 10) || 50
                      })
                    }
                    className="mt-1 w-full rounded-2xl border border-black/10 bg-[#fafbf8] p-3 text-sm font-semibold outline-none focus:border-[#6f9f83]"
                  />
                  <p className="mt-1 text-[10px] text-[#86958d]">
                    Number of successfully completed deliveries required to unlock the bonus rate.
                  </p>
                </div>

                {toast && (
                  <div className="rounded-xl bg-[#eef6f1] p-3 text-xs font-bold text-[#1f4a38]">
                    {toast}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="w-1/3 rounded-2xl border border-black/10 px-4 py-3 text-xs font-extrabold text-[#52655b] hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-2/3 rounded-2xl bg-[#173d2e] px-4 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-[#122e23] disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Update Pricing'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
