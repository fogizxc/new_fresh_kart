import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  FileCheck,
  PackageCheck,
  Plus,
  RefreshCw,
  Truck
} from 'lucide-react';
import {
  erpApi,
  type ApiGoodsReceivedNote,
  type ApiPurchaseOrder
} from '../../services/erpApi';
import type { ApiShop } from '../../services/api';

type Props = {
  shops: ApiShop[];
  role: string;
  flash: (message: string) => void;
  preselectedPo?: ApiPurchaseOrder | null;
  onClearPreselectedPo?: () => void;
};

export function GoodsReceiptView({
  shops,
  role,
  flash,
  preselectedPo,
  onClearPreselectedPo
}: Props) {
  const [grns, setGrns] = useState<ApiGoodsReceivedNote[]>([]);
  const [approvedPos, setApprovedPos] = useState<ApiPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // New GRN form state
  const [selectedPoId, setSelectedPoId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState<number>(0);
  const [grnNotes, setGrnNotes] = useState('');
  const [receivedItems, setReceivedItems] = useState<
    Array<{
      productId: string;
      productName: string;
      orderedQty: number;
      receivedQty: number;
      acceptedQty: number;
      rejectedQty: number;
      rejectionReason: string;
      unitCost: number;
      batchNumber: string;
      mfgDate: string;
      expiryDate: string;
    }>
  >([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [grnList, poList] = await Promise.all([
        erpApi.grn.list(),
        erpApi.purchaseOrders.list()
      ]);
      setGrns(grnList);
      // Filter POs that are approved or partially received
      const eligible = poList.filter(p => p.status === 'APPROVED' || p.status === 'PARTIALLY_RECEIVED');
      setApprovedPos(eligible);
    } catch (err: any) {
      flash(err?.message || 'Failed to load goods receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Handle preselected PO from parent
  useEffect(() => {
    if (preselectedPo) {
      initGrnFromPo(preselectedPo);
      setShowModal(true);
    }
  }, [preselectedPo]);

  const initGrnFromPo = (po: ApiPurchaseOrder) => {
    setSelectedPoId(po.id);
    setInvoiceNumber(`INV-${Date.now().toString().slice(-5)}`);
    setInvoiceAmount(po.totalAmount);
    const now = new Date().toISOString();
    const defaultExp = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);

    const items = po.items.map((it, idx) => {
      const remaining = Math.max(0, it.orderedQty - (it.receivedQty || 0));
      return {
        productId: it.productId,
        productName: it.productName,
        orderedQty: it.orderedQty,
        receivedQty: remaining || it.orderedQty,
        acceptedQty: remaining || it.orderedQty,
        rejectedQty: 0,
        rejectionReason: '',
        unitCost: it.unitCost,
        batchNumber: `B-${po.poNumber.slice(-4)}-${idx + 1}`,
        mfgDate: now.slice(0, 10),
        expiryDate: defaultExp
      };
    });
    setReceivedItems(items);
  };

  const handleSelectPoChange = (poId: string) => {
    const found = approvedPos.find(p => p.id === poId);
    if (found) {
      initGrnFromPo(found);
    }
  };

  const handleProcessGrn = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPoId || !receivedItems.length) {
      flash('Please select an approved purchase order');
      return;
    }
    setBusy('process-grn');
    try {
      await erpApi.grn.process({
        purchaseOrderId: selectedPoId,
        invoiceNumber,
        invoiceAmount,
        notes: grnNotes,
        items: receivedItems
      });
      flash('Goods receipt processed: batches created and inventory stocked');
      setShowModal(false);
      if (onClearPreselectedPo) onClearPreselectedPo();
      await loadData();
    } catch (err: any) {
      flash(err?.message || 'Failed to process goods receipt');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-[#173d2e]">Dockside Goods Receipts (GRN)</h2>
          <p className="mt-0.5 text-xs text-[#718078]">
            Inspect incoming vendor shipments, assign manufacturing & expiry batches, and record verified stock.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadData()}
            disabled={loading}
            className="rounded-xl border border-black/5 bg-[#f7f9f7] p-2.5 text-[#3b5949] hover:bg-[#ebf0eb]"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => {
              if (approvedPos.length > 0) {
                initGrnFromPo(approvedPos[0]);
              }
              setShowModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#173d2e] px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-[#1f4e3c]"
          >
            <Plus size={16} />
            <span>Receive Goods (GRN)</span>
          </button>
        </div>
      </div>

      {/* GRN List */}
      <div className="space-y-4">
        {grns.map(grn => {
          const totalAccepted = grn.items.reduce((s, i) => s + i.acceptedQty, 0);
          const totalRejected = grn.items.reduce((s, i) => s + i.rejectedQty, 0);

          return (
            <div key={grn.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef6ed] text-[#33704f]">
                    <PackageCheck size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[#173d2e]">{grn.grnNumber}</span>
                      <span className="text-xs font-extrabold text-[#55675d]">against {grn.poNumber}</span>
                    </div>
                    <div className="text-[11px] text-[#718078]">
                      Vendor: <b className="text-[#203229]">{grn.supplierName || grn.supplierId}</b> • Received on{' '}
                      {new Date(grn.receivedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#eef6ed] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#33704f]">
                    {grn.status}
                  </span>
                  {grn.invoiceNumber && (
                    <span className="rounded-full bg-[#fafcf9] border border-black/5 px-3 py-1 text-[10px] font-bold text-[#55675d]">
                      Inv: {grn.invoiceNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Items detail */}
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[#718078]">
                    <tr>
                      <th className="py-2 font-bold uppercase">Product</th>
                      <th className="py-2 font-bold uppercase">Assigned Batch #</th>
                      <th className="py-2 font-bold uppercase">Received</th>
                      <th className="py-2 font-bold uppercase">Accepted</th>
                      <th className="py-2 font-bold uppercase">Rejected / Reason</th>
                      <th className="py-2 font-bold uppercase">Shelf Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {grn.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 font-extrabold text-[#203229]">{item.productName}</td>
                        <td className="py-2 font-bold text-[#173d2e]">{item.batchNumber}</td>
                        <td className="py-2 font-semibold text-[#55675d]">{item.receivedQty}</td>
                        <td className="py-2 font-black text-emerald-700">+{item.acceptedQty}</td>
                        <td className="py-2">
                          {item.rejectedQty > 0 ? (
                            <span className="font-bold text-red-600">
                              {item.rejectedQty} ({item.rejectionReason || 'Damage'})
                            </span>
                          ) : (
                            <span className="text-[#8b9991]">0</span>
                          )}
                        </td>
                        <td className="py-2 font-medium text-[#718078]">{item.expiryDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3 text-xs text-[#718078]">
                <div>{grn.notes && <span><b>Dock Note:</b> {grn.notes}</span>}</div>
                <div className="flex gap-4">
                  <span>
                    Accepted: <b className="text-emerald-700">+{totalAccepted} units</b>
                  </span>
                  {totalRejected > 0 && (
                    <span>
                      Rejected: <b className="text-red-600">{totalRejected} units</b>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {!grns.length && !loading && (
          <div className="rounded-2xl border border-black/5 bg-white py-12 text-center text-sm text-[#718078]">
            <CheckCircle2 className="mx-auto mb-2 text-[#7ca486]" size={24} />
            No dockside goods receipts processed yet.
          </div>
        )}
      </div>

      {/* Modal: Process Inbound GRN */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-black text-[#173d2e]">Dockside Goods Received Note (GRN)</h2>
            <p className="mt-1 text-xs text-[#718078]">
              Verify delivered units against authorized purchase order, inspect quality, and stamp batch identifiers.
            </p>

            <form onSubmit={handleProcessGrn} className="mt-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs font-bold text-[#45574f]">Approved Purchase Order</label>
                  <select
                    value={selectedPoId}
                    onChange={e => handleSelectPoChange(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold text-[#173d2e]"
                  >
                    {approvedPos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.poNumber} — {p.supplierName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#45574f]">Vendor Invoice #</label>
                  <input
                    required
                    placeholder="e.g. INV-98124"
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#45574f]">Invoice Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={invoiceAmount}
                    onChange={e => setInvoiceAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Items Inspection Table */}
              <div className="rounded-2xl border border-black/5 bg-[#fafcf9] p-4">
                <div className="text-xs font-black uppercase text-[#718078] mb-2">Inward Quality & Batch Assignment</div>
                <div className="space-y-3">
                  {receivedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl bg-white p-3 border border-black/5 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between font-extrabold text-[#173d2e]">
                        <span>{item.productName}</span>
                        <span className="text-xs text-[#718078] font-normal">Ordered: {item.orderedQty} units</span>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-[#8a968f]">Received Qty</label>
                          <input
                            type="number"
                            min="0"
                            value={item.receivedQty}
                            onChange={e => {
                              const val = Number(e.target.value);
                              const updated = [...receivedItems];
                              updated[idx].receivedQty = val;
                              updated[idx].acceptedQty = Math.max(0, val - updated[idx].rejectedQty);
                              setReceivedItems(updated);
                            }}
                            className="mt-0.5 w-full rounded-lg border border-black/10 p-1.5 font-bold text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#8a968f]">Accepted Qty</label>
                          <input
                            type="number"
                            min="0"
                            value={item.acceptedQty}
                            onChange={e => {
                              const val = Number(e.target.value);
                              const updated = [...receivedItems];
                              updated[idx].acceptedQty = val;
                              updated[idx].rejectedQty = Math.max(0, updated[idx].receivedQty - val);
                              setReceivedItems(updated);
                            }}
                            className="mt-0.5 w-full rounded-lg border border-black/10 p-1.5 font-bold text-emerald-700 text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#8a968f]">Rejected Qty</label>
                          <input
                            type="number"
                            min="0"
                            value={item.rejectedQty}
                            onChange={e => {
                              const val = Number(e.target.value);
                              const updated = [...receivedItems];
                              updated[idx].rejectedQty = val;
                              updated[idx].acceptedQty = Math.max(0, updated[idx].receivedQty - val);
                              setReceivedItems(updated);
                            }}
                            className="mt-0.5 w-full rounded-lg border border-black/10 p-1.5 font-bold text-red-600 text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#8a968f]">Rejection Reason</label>
                          <input
                            placeholder="Damaged seal / rot"
                            value={item.rejectionReason}
                            onChange={e => {
                              const updated = [...receivedItems];
                              updated[idx].rejectionReason = e.target.value;
                              setReceivedItems(updated);
                            }}
                            className="mt-0.5 w-full rounded-lg border border-black/10 p-1.5 text-[11px]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-black/5">
                        <div>
                          <label className="text-[10px] font-bold text-[#8a968f]">Batch / Lot #</label>
                          <input
                            value={item.batchNumber}
                            onChange={e => {
                              const updated = [...receivedItems];
                              updated[idx].batchNumber = e.target.value.toUpperCase();
                              setReceivedItems(updated);
                            }}
                            className="mt-0.5 w-full rounded-lg border border-black/10 p-1.5 font-bold text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#8a968f]">Mfg Date</label>
                          <input
                            type="date"
                            value={item.mfgDate}
                            onChange={e => {
                              const updated = [...receivedItems];
                              updated[idx].mfgDate = e.target.value;
                              setReceivedItems(updated);
                            }}
                            className="mt-0.5 w-full rounded-lg border border-black/10 p-1.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#8a968f]">Expiry Date</label>
                          <input
                            type="date"
                            value={item.expiryDate}
                            onChange={e => {
                              const updated = [...receivedItems];
                              updated[idx].expiryDate = e.target.value;
                              setReceivedItems(updated);
                            }}
                            className="mt-0.5 w-full rounded-lg border border-black/10 p-1.5 text-xs font-bold text-[#9a6a24]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#45574f]">Dock Inspection Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Temperature reading verified at 4°C upon arrival"
                  value={grnNotes}
                  onChange={e => setGrnNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-medium"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    if (onClearPreselectedPo) onClearPreselectedPo();
                  }}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-bold text-[#4c5f54]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy === 'process-grn'}
                  className="rounded-xl bg-[#173d2e] px-5 py-2.5 text-xs font-black text-white hover:bg-[#1f4e3c]"
                >
                  {busy === 'process-grn' ? 'Processing...' : 'Accept & Stock Inward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
