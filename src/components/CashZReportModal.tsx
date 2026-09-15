import { useState } from 'react';
import {
  Banknote,
  Calendar,
  CheckCircle2,
  DollarSign,
  Download,
  FileCheck,
  IndianRupee,
  Printer,
  ShieldAlert,
  Store,
  Wallet,
  X
} from 'lucide-react';
import type { ApiOrder, ApiShop } from '../services/api';

interface Props {
  orders: ApiOrder[];
  shop?: ApiShop | null;
  onClose: () => void;
}

export function CashZReportModal({ orders, shop, onClose }: Props) {
  const [openingFloat, setOpeningFloat] = useState(2000);
  const [actualCashCounted, setActualCashCounted] = useState(0);
  const [pettyCashExpense, setPettyCashExpense] = useState(150);
  const [reportGenerated, setReportGenerated] = useState(false);

  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // Calculate today's totals by payment mode
  const completedOrPlaced = orders.filter(o => o.status !== 'CANCELLED');

  const codOrders = completedOrPlaced.filter(o => o.paymentMethod === 'COD');
  const codCashTotal = codOrders.reduce((sum, o) => sum + o.total, 0);

  const payAtShopOrders = completedOrPlaced.filter(o => o.paymentMethod === 'PAY_AT_SHOP');
  const payAtShopCashTotal = payAtShopOrders.reduce((sum, o) => sum + o.total, 0);

  const digitalOrders = completedOrPlaced.filter(o => o.paymentMethod === 'UPI' || o.paymentMethod === 'CARD');
  const digitalTotal = digitalOrders.reduce((sum, o) => sum + o.total, 0);

  const totalRevenue = codCashTotal + payAtShopCashTotal + digitalTotal;
  const totalCashCollected = codCashTotal + payAtShopCashTotal;
  const expectedCashInDrawer = openingFloat + totalCashCollected - pettyCashExpense;
  const cashVariance = actualCashCounted ? actualCashCounted - expectedCashInDrawer : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-4 backdrop-blur-sm">
      <div className="relative my-6 w-full max-w-2xl rounded-[32px] bg-white shadow-2xl overflow-hidden border border-black/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 bg-[#fafbf8] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#173d2e] text-[#d7ef8d]">
              <Banknote size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#173d2e]">Day-End Settlement & Cash Z-Report</h2>
              <p className="text-[11px] font-semibold text-[#718078]">
                {shop?.name || 'Store Operations'} • Date: {todayStr}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#173d2e] px-3.5 py-2 text-xs font-black text-white hover:bg-[#204e3b] transition"
            >
              <Printer size={14} />
              <span>Print Z-Report</span>
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eef1ed] text-[#4d5c54] hover:bg-[#e2e7e1] transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 text-gray-800">
          {/* Revenue Summary Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-[#fafbf8] p-3.5 border border-black/5">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Net Sales</p>
              <p className="mt-1 text-lg font-black text-[#173d2e]">₹{totalRevenue.toFixed(0)}</p>
              <p className="text-[10px] text-gray-500">{completedOrPlaced.length} transactions</p>
            </div>

            <div className="rounded-2xl bg-[#fafbf8] p-3.5 border border-black/5">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Cash Inflow</p>
              <p className="mt-1 text-lg font-black text-emerald-700">₹{totalCashCollected.toFixed(0)}</p>
              <p className="text-[10px] text-gray-500">COD + Store Counter</p>
            </div>

            <div className="rounded-2xl bg-[#fafbf8] p-3.5 border border-black/5">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Digital / UPI</p>
              <p className="mt-1 text-lg font-black text-indigo-700">₹{digitalTotal.toFixed(0)}</p>
              <p className="text-[10px] text-gray-500">{digitalOrders.length} online orders</p>
            </div>

            <div className="rounded-2xl bg-[#fafbf8] p-3.5 border border-black/5">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Expected Cash</p>
              <p className="mt-1 text-lg font-black text-[#173d2e]">₹{expectedCashInDrawer.toFixed(0)}</p>
              <p className="text-[10px] text-gray-500">Float + Cash - Payouts</p>
            </div>
          </div>

          {/* Drawer Reconciliation Inputs */}
          <div className="rounded-2xl bg-[#f5f8f5] p-5 border border-[#d6e5d8] space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#23583f] flex items-center gap-2">
              <Wallet size={16} /> Cash Drawer Count & Reconciliation
            </h3>

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700">Morning Cash Float (₹)</label>
                <input
                  type="number"
                  value={openingFloat}
                  onChange={e => setOpeningFloat(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold focus:border-[#173d2e] focus:outline-none"
                />
                <span className="text-[10px] text-gray-400">Initial change in drawer</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700">Petty Cash / Store Expenses (₹)</label>
                <input
                  type="number"
                  value={pettyCashExpense}
                  onChange={e => setPettyCashExpense(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold focus:border-[#173d2e] focus:outline-none"
                />
                <span className="text-[10px] text-gray-400">Receipts / packaging purchases</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700">Physical Cash Counted (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 5450"
                  value={actualCashCounted || ''}
                  onChange={e => setActualCashCounted(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-emerald-400 bg-white px-3 py-2 text-xs font-bold focus:border-emerald-600 focus:outline-none"
                />
                <span className="text-[10px] text-gray-400">Physical note & coin count</span>
              </div>
            </div>

            {actualCashCounted > 0 && (
              <div
                className={`flex items-center justify-between rounded-xl p-3.5 text-xs font-black ${
                  cashVariance === 0
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : cashVariance > 0
                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {cashVariance === 0 ? (
                    <CheckCircle2 size={18} className="text-emerald-700" />
                  ) : (
                    <ShieldAlert size={18} className="text-rose-700" />
                  )}
                  <span>
                    {cashVariance === 0
                      ? 'Perfect Match! Drawer cash balances exactly with expected sales.'
                      : cashVariance > 0
                      ? `Cash Surplus: ₹${cashVariance.toFixed(2)} extra in drawer.`
                      : `Cash Shortage: ₹${Math.abs(cashVariance).toFixed(2)} deficit recorded.`}
                  </span>
                </div>
                <span className="text-sm font-mono">
                  {cashVariance >= 0 ? `+₹${cashVariance.toFixed(2)}` : `-₹${Math.abs(cashVariance).toFixed(2)}`}
                </span>
              </div>
            )}
          </div>

          {/* Breakdown Table for Printing & Review */}
          <div className="rounded-2xl border border-black/10 overflow-hidden">
            <div className="bg-[#173d2e] px-4 py-2.5 text-xs font-black text-white flex justify-between">
              <span>Z-REPORT AUDIT SUMMARY</span>
              <span>TERMINAL #01</span>
            </div>
            <table className="w-full text-xs text-left">
              <tbody className="divide-y divide-black/5">
                <tr className="bg-gray-50/50">
                  <td className="py-2.5 px-4 font-semibold text-gray-600">Opening Register Float</td>
                  <td className="py-2.5 px-4 text-right font-bold text-gray-900">₹{openingFloat.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-gray-600">Gross Cash on Delivery (COD) Collected</td>
                  <td className="py-2.5 px-4 text-right font-bold text-emerald-700">+ ₹{codCashTotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-gray-600">Pay at Store Counter Collections</td>
                  <td className="py-2.5 px-4 text-right font-bold text-emerald-700">+ ₹{payAtShopCashTotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-gray-600">Petty Cash Store Disbursements</td>
                  <td className="py-2.5 px-4 text-right font-bold text-rose-600">- ₹{pettyCashExpense.toFixed(2)}</td>
                </tr>
                <tr className="bg-emerald-50/60 font-black">
                  <td className="py-3 px-4 text-emerald-950">Expected Physical Cash In Safe</td>
                  <td className="py-3 px-4 text-right text-sm text-[#173d2e]">₹{expectedCashInDrawer.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-gray-600">UPI / Card Digital Settlement (Direct Bank)</td>
                  <td className="py-2.5 px-4 text-right font-bold text-indigo-700">₹{digitalTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handlePrint}
              className="rounded-xl bg-[#173d2e] px-5 py-2.5 text-xs font-black text-white hover:bg-[#204e3b] transition"
            >
              Download / Print Z-Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
