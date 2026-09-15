import { useRef } from 'react';
import { Download, Printer, ShieldCheck, X } from 'lucide-react';
import type { ApiOrder, ApiShop } from '../services/api';

interface Props {
  order: ApiOrder;
  shop?: ApiShop | null;
  onClose: () => void;
}

// Map categories to standard Indian GST HSN codes
const HSN_MAP: Record<string, string> = {
  vegetables: '0709',
  fruits: '0808',
  dairy: '0401',
  bakery: '1905',
  beverages: '2202',
  snacks: '2106',
  staples: '1006',
  default: '2106'
};

function numberToWords(num: number): string {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const n = Math.floor(num);
  if (n === 0) return 'Zero Rupees Only';
  if (n < 20) return `${a[n]} Rupees Only`;
  if (n < 100) return `${b[Math.floor(n / 10)]} ${a[n % 10]}`.trim() + ' Rupees Only';
  if (n < 1000) return `${a[Math.floor(n / 100)]} Hundred ${b[Math.floor((n % 100) / 10)]} ${a[n % 10]}`.trim() + ' Rupees Only';
  return `INR ${n} Rupees Only`;
}

export function GstInvoiceModal({ order, shop, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const invoiceNo = `INV-FC-${order.id.replace(/[^0-9]/g, '').slice(-8) || '20260913'}`;
  const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const invoiceTime = new Date(order.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const shopName = shop?.name || 'FreshCart Hyperlocal Darkstore #12';
  const shopAddress = shop?.address || 'Plot 42, Okhla Industrial Area Phase-III, New Delhi 110020';
  const shopGstin = '07AAECF2948P1Z8';
  const fssaiLicence = '10021011000452';

  // Itemized GST calculation: grocery goods standard composite rate (5% GST: 2.5% CGST + 2.5% SGST)
  const itemsBreakdown = order.items.map((item, idx) => {
    const gross = item.unitPrice * item.quantity;
    const taxable = Math.round((gross / 1.05) * 100) / 100;
    const gstTotal = Math.round((gross - taxable) * 100) / 100;
    const cgst = Math.round((gstTotal / 2) * 100) / 100;
    const sgst = gstTotal - cgst;
    return {
      sr: idx + 1,
      name: item.name,
      hsn: HSN_MAP.default,
      qty: item.quantity,
      rate: item.unitPrice,
      taxable,
      cgst,
      sgst,
      total: gross
    };
  });

  const totalTaxable = itemsBreakdown.reduce((sum, i) => sum + i.taxable, 0);
  const totalCgst = itemsBreakdown.reduce((sum, i) => sum + i.cgst, 0);
  const totalSgst = itemsBreakdown.reduce((sum, i) => sum + i.sgst, 0);
  const discount = order.discount || 0;
  const deliveryFee = order.deliveryFee || 0;
  const handlingFee = order.handlingFee ?? (order.fulfilment === 'SELF_PICKUP' ? 0 : 5);
  const tip = order.tip || 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative my-8 w-full max-w-3xl rounded-[28px] bg-white shadow-2xl overflow-hidden border border-black/10">
        {/* Modal Top Control Bar */}
        <div className="flex items-center justify-between border-b border-black/5 bg-[#fafbf8] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#173d2e] text-[#d7ef8d]">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#173d2e]">Official Tax Invoice / Bill of Supply</h2>
              <p className="text-[11px] font-semibold text-[#718078]">GST Rule 46 Compliant • {invoiceNo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#173d2e] px-3.5 py-2 text-xs font-black text-white hover:bg-[#204e3b] transition"
            >
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eef1ed] text-[#4d5c54] hover:bg-[#e2e7e1] transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Tax Invoice Content */}
        <div ref={printRef} className="p-6 sm:p-8 text-black bg-white select-text">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-5">
            <div>
              <div className="text-2xl font-black tracking-tight text-[#173d2e]">FreshCart Quick Commerce</div>
              <p className="mt-1 text-xs font-semibold text-gray-600 max-w-xs">{shopName}</p>
              <p className="text-[11px] text-gray-500 max-w-xs">{shopAddress}</p>
              <div className="mt-2 space-y-0.5 text-[11px] font-medium text-gray-700">
                <p><span className="font-bold">GSTIN:</span> {shopGstin}</p>
                <p><span className="font-bold">FSSAI Lic. No:</span> {fssaiLicence}</p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block rounded-lg bg-[#eaf3ec] px-3 py-1 text-[11px] font-black uppercase text-[#295c43]">
                Tax Invoice
              </div>
              <div className="mt-3 space-y-1 text-xs">
                <p><span className="text-gray-500">Invoice No:</span> <span className="font-bold text-gray-900">{invoiceNo}</span></p>
                <p><span className="text-gray-500">Order ID:</span> <span className="font-bold text-gray-900">{order.id}</span></p>
                <p><span className="text-gray-500">Date:</span> <span className="font-bold text-gray-900">{invoiceDate} {invoiceTime}</span></p>
                <p><span className="text-gray-500">Fulfilment:</span> <span className="font-bold text-gray-900">{order.fulfilment === 'SELF_PICKUP' ? 'Store Self-Pickup' : '15-min Direct Delivery'}</span></p>
              </div>
            </div>
          </div>

          {/* Bill To / Ship To */}
          <div className="mt-5 grid grid-cols-2 gap-4 rounded-2xl bg-[#fafbf8] p-4 text-xs">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Billed & Delivered To</p>
              <p className="mt-1 font-bold text-gray-900">Customer ID: {order.customerId}</p>
              <p className="mt-0.5 text-gray-600 leading-relaxed">Place of Supply: Delhi (07)</p>
              <p className="text-gray-600">Category: B2C Quick Commerce</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Payment & Verification</p>
              <p className="mt-1 font-bold text-gray-900">Method: {order.paymentMethod.replace(/_/g, ' ')}</p>
              <p className="text-gray-600">Payment Status: <span className="font-bold text-emerald-700">COMPLETED</span></p>
              {order.deliveryOtp && (
                <p className="text-gray-600">Doorstep OTP: <span className="font-bold font-mono">{order.deliveryOtp}</span></p>
              )}
              {order.pickupCode && (
                <p className="text-gray-600">Store Pickup Code: <span className="font-bold font-mono">{order.pickupCode}</span></p>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-black/10 text-[11px] font-black uppercase text-gray-600">
                  <th className="py-2.5 pl-2">#</th>
                  <th className="py-2.5">Item Description</th>
                  <th className="py-2.5 text-center">HSN</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Unit Price</th>
                  <th className="py-2.5 text-right">Taxable</th>
                  <th className="py-2.5 text-right">CGST (2.5%)</th>
                  <th className="py-2.5 text-right">SGST (2.5%)</th>
                  <th className="py-2.5 pr-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {itemsBreakdown.map(item => (
                  <tr key={item.sr} className="text-gray-800">
                    <td className="py-2.5 pl-2 font-bold text-gray-400">{item.sr}</td>
                    <td className="py-2.5 font-bold text-gray-900">{item.name}</td>
                    <td className="py-2.5 text-center font-mono text-gray-500">{item.hsn}</td>
                    <td className="py-2.5 text-center font-bold">{item.qty}</td>
                    <td className="py-2.5 text-right">₹{item.rate.toFixed(2)}</td>
                    <td className="py-2.5 text-right">₹{item.taxable.toFixed(2)}</td>
                    <td className="py-2.5 text-right">₹{item.cgst.toFixed(2)}</td>
                    <td className="py-2.5 text-right">₹{item.sgst.toFixed(2)}</td>
                    <td className="py-2.5 pr-2 text-right font-bold text-gray-900">₹{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Tax Calculation Breakdown */}
          <div className="mt-5 border-t border-black/10 pt-4 grid sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl border border-dashed border-gray-200 p-3 bg-gray-50">
              <p className="font-bold text-gray-700">Amount in Words:</p>
              <p className="mt-1 font-semibold text-emerald-800 italic">{numberToWords(order.total)}</p>
              <div className="mt-3 text-[10px] text-gray-500 space-y-0.5">
                <p>• Goods once sold are covered under 15-minute fresh replacement guarantee.</p>
                <p>• This is a computer-generated tax invoice and requires no physical signature.</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-gray-600">
                <span>Taxable Amount (Goods):</span>
                <span className="font-semibold">₹{totalTaxable.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total CGST (2.5%):</span>
                <span className="font-semibold">₹{totalCgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total SGST (2.5%):</span>
                <span className="font-semibold">₹{totalSgst.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Discount ({order.couponCode || 'PROMO'}):</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Delivery & Logistics Fee:</span>
                <span className="font-semibold">{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}</span>
              </div>
              {handlingFee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Packaging & Handling Charge:</span>
                  <span className="font-semibold">₹{handlingFee.toFixed(2)}</span>
                </div>
              )}
              {tip > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Partner Tip (100% to rider):</span>
                  <span className="font-semibold">₹{tip.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t-2 border-black/10 pt-2 text-base font-black text-gray-900">
                <span>Grand Total:</span>
                <span className="text-[#173d2e]">₹{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-6 border-t border-black/5 pt-3 text-center text-[10px] text-gray-400">
            FreshCart India Private Limited • Registered in New Delhi • Support: support@freshcart.in • 1800-FRESH-CART
          </div>
        </div>
      </div>
    </div>
  );
}
