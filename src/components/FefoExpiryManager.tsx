import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Percent,
  RefreshCw,
  Sparkles,
  Tag,
  Zap
} from 'lucide-react';

export interface BatchItem {
  id: string;
  batchNumber: string;
  productId: string;
  productName: string;
  shopId: string;
  stockQty: number;
  costPrice: number;
  originalPrice: number;
  mfgDate: string;
  expiryDate: string;
  daysRemaining: number;
  clearanceDiscountPercent: number;
  clearancePrice: number;
  status: 'FRESH' | 'EXPIRING_SOON' | 'CRITICAL' | 'EXPIRED';
  isClearanceActive: boolean;
}

interface FefoExpiryManagerProps {
  flash: (msg: string) => void;
}

export const FefoExpiryManager: React.FC<FefoExpiryManagerProps> = ({ flash }) => {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAuto, setRunningAuto] = useState(false);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('freshcart_token');
      const res = await fetch('/api/fefo-expiry/batches', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setBatches(data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleUpdateDiscount = async (id: string, discount: number, isActive: boolean) => {
    try {
      const token = localStorage.getItem('freshcart_token');
      const res = await fetch(`/api/fefo-expiry/batches/${id}/discount`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          discountPercent: discount,
          isClearanceActive: isActive
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBatches(prev => prev.map(b => (b.id === id ? data.batch : b)));
        flash(`Batch ${data.batch.batchNumber} markdown set to ${discount}% off`);
      }
    } catch {
      flash('Failed to update discount');
    }
  };

  const handleRunAutoFefo = async () => {
    try {
      setRunningAuto(true);
      const token = localStorage.getItem('freshcart_token');
      const res = await fetch('/api/fefo-expiry/batches/auto-fefo-apply', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches);
        flash(data.message || 'Auto-FEFO markdowns applied!');
      }
    } catch {
      flash('Error running FEFO engine');
    } finally {
      setRunningAuto(false);
    }
  };

  const criticalCount = batches.filter(b => b.status === 'CRITICAL' || b.daysRemaining <= 1).length;
  const expiringSoonCount = batches.filter(b => b.status === 'EXPIRING_SOON').length;
  const activeClearanceCount = batches.filter(b => b.isClearanceActive).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#173d2e] to-[#255e46] p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#d7ef8d]">
            <Sparkles size={14} />
            <span>Zero-Wastage Inventory Protocol</span>
          </div>
          <h3 className="text-xl font-black mt-1">
            FEFO (First-Expired, First-Out) Clearance Engine
          </h3>
          <p className="text-xs text-emerald-100 max-w-xl mt-1">
            Automates flash-clearance markdowns for perishable inventory nearing shelf-life end. Minimizes food waste and recovers product cost.
          </p>
        </div>

        <button
          disabled={runningAuto}
          onClick={handleRunAutoFefo}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#d7ef8d] px-5 py-3 text-xs font-black text-[#173d2e] hover:bg-[#c6e372] transition shadow-md whitespace-nowrap active:scale-95 disabled:opacity-50"
        >
          <Zap size={16} />
          <span>{runningAuto ? 'Calculating Markdowns...' : 'Run Auto-FEFO Markdown Engine'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-800">Critical (&lt;24h)</span>
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-red-900">{criticalCount} Batches</div>
          <p className="text-[10px] text-red-700 mt-0.5">High waste risk — 40% markdown active</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">Expiring Soon (2-3 Days)</span>
            <Clock size={18} className="text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-900">{expiringSoonCount} Batches</div>
          <p className="text-[10px] text-amber-700 mt-0.5">25% markdown active</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Live Clearance Products</span>
            <Tag size={18} className="text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-900">{activeClearanceCount} Active</div>
          <p className="text-[10px] text-emerald-700 mt-0.5">Listed on customer clearance aisle</p>
        </div>
      </div>

      {/* Batches Table */}
      <div className="rounded-3xl border border-black/5 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h4 className="text-sm font-black text-[#173d2e]">Monitored Perishable Batches</h4>
          <button
            onClick={fetchBatches}
            className="flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-200"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8faf8] text-[11px] font-black uppercase tracking-wider text-gray-500 border-b border-gray-100">
              <tr>
                <th className="p-4">Batch #</th>
                <th className="p-4">Product Name</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Expiry Date</th>
                <th className="p-4">Days Left</th>
                <th className="p-4">Original / Clearance</th>
                <th className="p-4">Markdown Discount</th>
                <th className="p-4">Storefront Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {batches.map(b => {
                const isCritical = b.status === 'CRITICAL' || b.daysRemaining <= 1;
                const isWarning = b.status === 'EXPIRING_SOON';

                return (
                  <tr key={b.id} className="hover:bg-gray-50/70 transition">
                    <td className="p-4 font-mono font-bold text-gray-700">{b.batchNumber}</td>
                    <td className="p-4 font-extrabold text-gray-900">{b.productName}</td>
                    <td className="p-4 font-bold text-gray-700">{b.stockQty} units</td>
                    <td className="p-4 text-gray-600">{b.expiryDate}</td>
                    <td className="p-4">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-black ${
                          isCritical
                            ? 'bg-red-100 text-red-800'
                            : isWarning
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {b.daysRemaining} {b.daysRemaining === 1 ? 'day' : 'days'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-black text-gray-900">₹{b.clearancePrice}</span>
                        {b.isClearanceActive && (
                          <span className="text-[11px] text-gray-400 line-through">
                            ₹{b.originalPrice}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {[0, 20, 35, 50].map(pct => (
                          <button
                            key={pct}
                            onClick={() => handleUpdateDiscount(b.id, pct, pct > 0)}
                            className={`rounded-lg px-2 py-1 text-[10px] font-black transition border ${
                              b.clearanceDiscountPercent === pct && b.isClearanceActive
                                ? 'bg-[#173d2e] text-white border-[#173d2e]'
                                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            {pct === 0 ? 'Normal' : `${pct}%`}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() =>
                          handleUpdateDiscount(
                            b.id,
                            b.clearanceDiscountPercent || 25,
                            !b.isClearanceActive
                          )
                        }
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase transition ${
                          b.isClearanceActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            b.isClearanceActive ? 'bg-emerald-600' : 'bg-gray-400'
                          }`}
                        />
                        <span>{b.isClearanceActive ? '⚡ Live Sale' : 'Off'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
