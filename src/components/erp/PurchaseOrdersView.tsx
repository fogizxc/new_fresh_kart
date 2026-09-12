import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileText,
  Filter,
  PackageCheck,
  Plus,
  RefreshCw,
  ShoppingBag,
  Trash2,
  Truck,
  XCircle
} from 'lucide-react';
import {
  erpApi,
  type ApiPurchaseOrder,
  type ApiSupplier,
  type PurchaseOrderStatus
} from '../../services/erpApi';
import type { ApiProduct, ApiShop } from '../../services/api';

type Props = {
  products: ApiProduct[];
  shops: ApiShop[];
  role: string;
  flash: (message: string) => void;
  onOpenGrnForPo?: (po: ApiPurchaseOrder) => void;
};

export function PurchaseOrdersView({
  products,
  shops,
  role,
  flash,
  onOpenGrnForPo
}: Props) {
  const [orders, setOrders] = useState<ApiPurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // New PO State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedShopId, setSelectedShopId] = useState(shops[0]?.id || 'shop-1');
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10)
  );
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<
    Array<{
      productId: string;
      productName: string;
      sku: string;
      orderedQty: number;
      unitCost: number;
      taxRate: number;
    }>
  >([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pos, sups] = await Promise.all([
        erpApi.purchaseOrders.list({
          status: statusFilter === 'ALL' ? undefined : statusFilter
        }),
        erpApi.suppliers.list()
      ]);
      setOrders(pos);
      setSuppliers(sups);
      if (!selectedSupplierId && sups.length) {
        setSelectedSupplierId(sups[0].id);
      }
    } catch (err: any) {
      flash(err?.message || 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [statusFilter]);

  const openCreateModal = () => {
    if (products.length > 0) {
      setPoItems([
        {
          productId: products[0].id,
          productName: products[0].name,
          sku: products[0].sku,
          orderedQty: 50,
          unitCost: Math.round(products[0].costPrice || products[0].sellingPrice * 0.7),
          taxRate: 5
        }
      ]);
    }
    setShowCreateModal(true);
  };

  const handleAddItemRow = () => {
    const prod = products[0];
    if (!prod) return;
    setPoItems([
      ...poItems,
      {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        orderedQty: 25,
        unitCost: Math.round(prod.costPrice || prod.sellingPrice * 0.7),
        taxRate: 5
      }
    ]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (poItems.length <= 1) return;
    setPoItems(poItems.filter((_, i) => i !== idx));
  };

  const handleCreatePo = async (autoSubmit: boolean) => {
    if (!selectedSupplierId || !poItems.length) {
      flash('Supplier and at least one item line required');
      return;
    }
    setBusy('create');
    try {
      await erpApi.purchaseOrders.create({
        supplierId: selectedSupplierId,
        shopId: selectedShopId,
        expectedDeliveryDate: expectedDate,
        notes: poNotes,
        autoSubmit,
        items: poItems.map(item => ({
          ...item,
          receivedQty: 0,
          totalCost: item.orderedQty * item.unitCost * (1 + item.taxRate / 100)
        }))
      });
      flash(autoSubmit ? 'Purchase order submitted for approval' : 'Draft purchase order created');
      setShowCreateModal(false);
      await loadData();
    } catch (err: any) {
      flash(err?.message || 'Failed to create purchase order');
    } finally {
      setBusy(null);
    }
  };

  const handleUpdateStatus = async (id: string, status: PurchaseOrderStatus, notes?: string) => {
    setBusy(id);
    try {
      await erpApi.purchaseOrders.updateStatus(id, status, notes);
      flash(`Purchase order ${status.toLowerCase().replace('_', ' ')}`);
      await loadData();
    } catch (err: any) {
      flash(err?.message || 'Failed to update order status');
    } finally {
      setBusy(null);
    }
  };

  // Computations for new PO
  const subtotal = poItems.reduce((acc, i) => acc + i.orderedQty * i.unitCost, 0);
  const taxTotal = poItems.reduce((acc, i) => acc + (i.orderedQty * i.unitCost * i.taxRate) / 100, 0);
  const grandTotal = subtotal + taxTotal;

  const totalValue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingCount = orders.filter(o => o.status === 'SUBMITTED').length;
  const approvedCount = orders.filter(o => o.status === 'APPROVED' || o.status === 'PARTIALLY_RECEIVED').length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#718078]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <FileSpreadsheet size={18} className="text-[#3c7358]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#173d2e]">{orders.length}</div>
          <div className="mt-1 text-xs text-[#8a968f]">₹{Math.round(totalValue).toLocaleString('en-IN')} lifetime procurement</div>
        </div>

        <div className="rounded-2xl border border-[#f5dfb8] bg-[#fffaf0] p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#9a6a24]">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Approval</span>
            <Clock size={18} />
          </div>
          <div className="mt-2 text-2xl font-black text-[#9a6a24]">{pendingCount}</div>
          <div className="mt-1 text-xs text-[#a87937]">Require Manager / Admin authorization</div>
        </div>

        <div className="rounded-2xl border border-[#d6ebd9] bg-[#f4faf4] p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#2c7746]">
            <span className="text-xs font-bold uppercase tracking-wider">Active Inward Pipeline</span>
            <Truck size={18} />
          </div>
          <div className="mt-2 text-2xl font-black text-[#2c7746]">{approvedCount} Orders</div>
          <div className="mt-1 text-xs text-[#2c7746]/80">Approved and awaiting dockside receipt</div>
        </div>
      </div>

      {/* Filter and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          <span className="mr-1 flex items-center gap-1 text-[#718078]">
            <Filter size={13} /> Filter:
          </span>
          {(['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED'] as const).map(
            st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-xl px-2.5 py-1.5 transition ${
                  statusFilter === st
                    ? 'bg-[#173d2e] text-white'
                    : 'bg-[#f4f7f4] text-[#55675d] hover:bg-[#e7eee8]'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            )
          )}
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
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#173d2e] px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-[#1f4e3c]"
          >
            <Plus size={16} />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Purchase Orders List */}
      <div className="space-y-4">
        {orders.map(po => {
          const isPending = po.status === 'SUBMITTED';
          const isApproved = po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED';
          const isDraft = po.status === 'DRAFT';

          return (
            <div key={po.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef5ed] text-[#347451]">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[#173d2e]">{po.poNumber}</span>
                      <span className="text-xs font-extrabold text-[#55675d]">• {po.supplierName}</span>
                    </div>
                    <div className="text-[11px] text-[#718078]">
                      Created: {new Date(po.createdAt).toLocaleDateString()} | Delivery ETA:{' '}
                      {po.expectedDeliveryDate || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                      po.status === 'COMPLETED'
                        ? 'bg-[#eef6ed] text-[#33704f]'
                        : po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED'
                        ? 'bg-[#eaf1fb] text-[#2964b9]'
                        : po.status === 'SUBMITTED'
                        ? 'bg-[#fff5e0] text-[#9a6a24]'
                        : po.status === 'CANCELLED'
                        ? 'bg-[#ffebe9] text-[#b93829]'
                        : 'bg-[#f0f3f1] text-[#5b6a62]'
                    }`}
                  >
                    {po.status.replace('_', ' ')}
                  </span>

                  {/* Action buttons */}
                  {isDraft && (
                    <button
                      disabled={busy === po.id}
                      onClick={() => void handleUpdateStatus(po.id, 'SUBMITTED')}
                      className="rounded-xl bg-[#173d2e] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1f4e3c]"
                    >
                      Submit for Approval
                    </button>
                  )}

                  {isPending && ['admin', 'super_admin', 'store_manager'].includes(role) && (
                    <div className="flex gap-1.5">
                      <button
                        disabled={busy === po.id}
                        onClick={() => void handleUpdateStatus(po.id, 'APPROVED', 'Approved by manager')}
                        className="rounded-xl bg-[#2c7746] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#235e37]"
                      >
                        Approve PO
                      </button>
                      <button
                        disabled={busy === po.id}
                        onClick={() => void handleUpdateStatus(po.id, 'CANCELLED', 'Rejected by manager')}
                        className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-[#b93829] hover:bg-[#fff6f6]"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {isApproved && onOpenGrnForPo && (
                    <button
                      onClick={() => onOpenGrnForPo(po)}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#d7ef8d] px-3 py-1.5 text-xs font-black text-[#173d2e] hover:bg-[#c9e578]"
                    >
                      <PackageCheck size={14} />
                      <span>Receive Goods (GRN)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[#718078]">
                    <tr>
                      <th className="py-2 font-bold uppercase">Item Details</th>
                      <th className="py-2 font-bold uppercase">Ordered Qty</th>
                      <th className="py-2 font-bold uppercase">Received Qty</th>
                      <th className="py-2 font-bold uppercase">Unit Cost</th>
                      <th className="py-2 font-bold uppercase text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {po.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 font-extrabold text-[#203229]">
                          {item.productName}
                          <span className="ml-1 text-[10px] text-[#7d8b83] font-normal">({item.sku})</span>
                        </td>
                        <td className="py-2 font-bold text-[#173d2e]">{item.orderedQty}</td>
                        <td className="py-2">
                          <span
                            className={`font-black ${
                              item.receivedQty >= item.orderedQty ? 'text-emerald-700' : 'text-[#8b9991]'
                            }`}
                          >
                            {item.receivedQty} / {item.orderedQty}
                          </span>
                        </td>
                        <td className="py-2 text-[#55675d]">₹{item.unitCost}</td>
                        <td className="py-2 text-right font-bold text-[#173d2e]">
                          ₹{Math.round(item.totalCost).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Footer */}
              <div className="mt-3 flex flex-wrap items-center justify-between border-t border-black/5 pt-3 text-xs">
                <div className="text-[11px] text-[#718078]">
                  {po.notes && <span><b>Memo:</b> {po.notes}</span>}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-[#718078]">
                    Subtotal: <b>₹{po.subtotal.toLocaleString()}</b>
                  </span>
                  <span className="text-[#718078]">
                    GST Tax: <b>₹{po.taxAmount.toLocaleString()}</b>
                  </span>
                  <span className="text-sm font-black text-[#173d2e]">
                    Total: ₹{po.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {!orders.length && !loading && (
          <div className="rounded-2xl border border-black/5 bg-white py-12 text-center text-sm text-[#718078]">
            <CheckCircle2 className="mx-auto mb-2 text-[#7ca486]" size={24} />
            No purchase orders matched the current filter.
          </div>
        )}
      </div>

      {/* Modal: Create Purchase Order Wizard */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-black text-[#173d2e]">Create Purchase Order</h2>
            <p className="mt-1 text-xs text-[#718078]">
              Issue a formalized procurement request to an approved vendor with negotiated pricing and GST computation.
            </p>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#45574f]">Vendor / Supplier</label>
                  <select
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold text-[#173d2e]"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} (NET {s.paymentTermsDays}d)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#45574f]">Delivery Shop / Store</label>
                  <select
                    value={selectedShopId}
                    onChange={e => setSelectedShopId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold text-[#173d2e]"
                  >
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#45574f]">Expected Delivery ETA</label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={e => setExpectedDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Line items */}
              <div className="rounded-2xl border border-black/5 bg-[#fafcf9] p-4">
                <div className="flex items-center justify-between pb-2">
                  <div className="text-xs font-black uppercase text-[#718078]">Procurement Line Items</div>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#3c7358] hover:underline"
                  >
                    <Plus size={14} /> Add Line Item
                  </button>
                </div>

                <div className="space-y-2">
                  {poItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 items-center gap-2 rounded-xl bg-white p-2.5 text-xs border border-black/5"
                    >
                      <div className="col-span-4">
                        <label className="text-[10px] font-bold text-[#8a968f]">Product</label>
                        <select
                          value={item.productId}
                          onChange={e => {
                            const p = products.find(prod => prod.id === e.target.value);
                            const updated = [...poItems];
                            updated[idx].productId = e.target.value;
                            updated[idx].productName = p?.name || 'Product';
                            updated[idx].sku = p?.sku || '';
                            updated[idx].unitCost = p ? Math.round(p.costPrice || p.sellingPrice * 0.7) : 50;
                            setPoItems(updated);
                          }}
                          className="mt-0.5 w-full rounded-lg border border-black/10 p-1.5 text-xs font-bold"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-[#8a968f]">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.orderedQty}
                          onChange={e => {
                            const updated = [...poItems];
                            updated[idx].orderedQty = Number(e.target.value);
                            setPoItems(updated);
                          }}
                          className="mt-0.5 w-full rounded-lg border border-black/10 p-1.5 text-center font-bold"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-[#8a968f]">Cost (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={item.unitCost}
                          onChange={e => {
                            const updated = [...poItems];
                            updated[idx].unitCost = Number(e.target.value);
                            setPoItems(updated);
                          }}
                          className="mt-0.5 w-full rounded-lg border border-black/10 p-1.5 text-center font-bold"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-[#8a968f]">GST %</label>
                        <select
                          value={item.taxRate}
                          onChange={e => {
                            const updated = [...poItems];
                            updated[idx].taxRate = Number(e.target.value);
                            setPoItems(updated);
                          }}
                          className="mt-0.5 w-full rounded-lg border border-black/10 p-1.5 text-center font-bold"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                        </select>
                      </div>
                      <div className="col-span-2 flex items-center justify-between pt-3">
                        <span className="font-black text-[#173d2e]">
                          ₹{Math.round(item.orderedQty * item.unitCost * (1 + item.taxRate / 100)).toLocaleString()}
                        </span>
                        {poItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div className="mt-4 flex justify-end gap-6 border-t border-black/5 pt-3 text-xs">
                  <span className="text-[#718078]">
                    Subtotal: <b className="text-[#203229]">₹{subtotal.toLocaleString()}</b>
                  </span>
                  <span className="text-[#718078]">
                    Tax (GST): <b className="text-[#203229]">₹{Math.round(taxTotal).toLocaleString()}</b>
                  </span>
                  <span className="text-sm font-black text-[#173d2e]">
                    Grand Total: ₹{Math.round(grandTotal).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#45574f]">Procurement Notes / Terms</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Standard cold-chain transit required for perishable produce"
                  value={poNotes}
                  onChange={e => setPoNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-medium"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-bold text-[#4c5f54]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy === 'create'}
                  onClick={() => void handleCreatePo(false)}
                  className="rounded-xl border border-black/10 bg-[#fafcf9] px-4 py-2.5 text-xs font-bold text-[#203229] hover:bg-[#ebf0eb]"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={busy === 'create'}
                  onClick={() => void handleCreatePo(true)}
                  className="rounded-xl bg-[#173d2e] px-5 py-2.5 text-xs font-black text-white hover:bg-[#1f4e3c]"
                >
                  {busy === 'create' ? 'Submitting...' : 'Submit PO for Approval'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
