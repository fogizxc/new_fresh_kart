import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Boxes,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
  Zap
} from 'lucide-react';
import { erpApi, type ApiBatch, type BatchStatus } from '../../services/erpApi';
import type { ApiProduct, ApiShop } from '../../services/api';

type Props = {
  products: ApiProduct[];
  shops: ApiShop[];
  role: string;
  flash: (message: string) => void;
};

export function BatchInventoryView({ products, shops, role, flash }: Props) {
  const [batches, setBatches] = useState<ApiBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [productFilter, setProductFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [writeOffModal, setWriteOffModal] = useState<ApiBatch | null>(null);
  const [writeOffAction, setWriteOffAction] = useState<'QUARANTINE' | 'EXPIRY_SCRAP' | 'DAMAGE'>('EXPIRY_SCRAP');
  const [writeOffQty, setWriteOffQty] = useState<number>(1);
  const [writeOffNotes, setWriteOffNotes] = useState('');
  const [fefoModal, setFefoModal] = useState(false);
  const [fefoProductId, setFefoProductId] = useState(products[0]?.id || '');
  const [fefoQuantity, setFefoQuantity] = useState(10);
  const [fefoPlan, setFefoPlan] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // New batch form
  const [newBatch, setNewBatch] = useState({
    productId: products[0]?.id || '',
    batchNumber: '',
    shopId: shops[0]?.id || 'shop-1',
    mfgDate: new Date().toISOString().slice(0, 10),
    expiryDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
    quantity: 50,
    costPrice: 40,
    sellingPrice: 55
  });

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await erpApi.batches.list({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        productId: productFilter === 'ALL' ? undefined : productFilter
      });
      setBatches(data);
    } catch (err: any) {
      flash(err?.message || 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBatches();
  }, [statusFilter, productFilter]);

  const handleCreateBatch = async (e: FormEvent) => {
    e.preventDefault();
    if (!newBatch.batchNumber || !newBatch.productId) {
      flash('Please enter batch number and product');
      return;
    }
    setSubmitting(true);
    try {
      const selectedProd = products.find(p => p.id === newBatch.productId);
      await erpApi.batches.create({
        ...newBatch,
        productName: selectedProd?.name,
        sku: selectedProd?.sku
      });
      flash(`Batch ${newBatch.batchNumber} created successfully`);
      setShowAddModal(false);
      setNewBatch({
        productId: products[0]?.id || '',
        batchNumber: '',
        shopId: shops[0]?.id || 'shop-1',
        mfgDate: new Date().toISOString().slice(0, 10),
        expiryDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
        quantity: 50,
        costPrice: 40,
        sellingPrice: 55
      });
      await loadBatches();
    } catch (err: any) {
      flash(err?.message || 'Failed to create batch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWriteOff = async () => {
    if (!writeOffModal) return;
    setSubmitting(true);
    try {
      await erpApi.batches.writeOff(writeOffModal.id, writeOffAction, writeOffQty, writeOffNotes);
      flash(`Batch stock wrote off via ${writeOffAction.replace('_', ' ')}`);
      setWriteOffModal(null);
      setWriteOffNotes('');
      await loadBatches();
    } catch (err: any) {
      flash(err?.message || 'Failed to write off batch stock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunFefo = async () => {
    if (!fefoProductId) return;
    try {
      const res = await erpApi.batches.fefoPreview(fefoProductId, Number(fefoQuantity));
      setFefoPlan(res);
    } catch (err: any) {
      flash(err?.message || 'FEFO preview calculation failed');
    }
  };

  const nearExpiryCount = batches.filter(b => b.status === 'NEAR_EXPIRY').length;
  const expiredCount = batches.filter(b => b.status === 'EXPIRED').length;
  const totalStockInBatches = batches.reduce((sum, b) => sum + b.quantity, 0);

  const getRemainingDays = (expiryStr: string) => {
    const diff = new Date(expiryStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Top summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#7d8c83]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Batches</span>
            <Boxes size={18} className="text-[#3c7358]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#173d2e]">{batches.length}</div>
          <div className="mt-1 text-xs text-[#8a968f]">{totalStockInBatches} total units in tracked lots</div>
        </div>

        <div className="rounded-2xl border border-[#f5dfb8] bg-[#fffaf0] p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#9a6a24]">
            <span className="text-xs font-bold uppercase tracking-wider">Near Expiry (&le;30d)</span>
            <Clock size={18} />
          </div>
          <div className="mt-2 text-2xl font-black text-[#9a6a24]">{nearExpiryCount}</div>
          <div className="mt-1 text-xs text-[#a87937]">Require FEFO prioritization or discounting</div>
        </div>

        <div className="rounded-2xl border border-[#f7c2be] bg-[#fff5f4] p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#b93829]">
            <span className="text-xs font-bold uppercase tracking-wider">Expired / Scrap</span>
            <AlertTriangle size={18} />
          </div>
          <div className="mt-2 text-2xl font-black text-[#b93829]">{expiredCount}</div>
          <div className="mt-1 text-xs text-[#b93829]/80">Must be quarantined or written off</div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl bg-[#173d2e] p-4 text-white shadow-sm">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#d7ef8d]">
              <Zap size={15} />
              <span>FEFO Smart Engine</span>
            </div>
            <p className="mt-1 text-xs text-white/70">
              First-Expired, First-Out allocation prioritizes earliest shelf-life depletion.
            </p>
          </div>
          <button
            onClick={() => {
              setFefoModal(true);
              void handleRunFefo();
            }}
            className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#d7ef8d] px-3 py-2 text-xs font-black text-[#173d2e] transition hover:bg-[#c9e578]"
          >
            Simulate FEFO Pick
          </button>
        </div>
      </div>

      {/* Action Bar & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-bold text-[#718078]">
            <Filter size={14} /> Filter:
          </span>
          {(['ALL', 'ACTIVE', 'NEAR_EXPIRY', 'EXPIRED', 'DEPLETED', 'QUARANTINED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === s
                  ? 'bg-[#173d2e] text-white'
                  : 'bg-[#f4f7f4] text-[#55675d] hover:bg-[#e7eee8]'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadBatches()}
            disabled={loading}
            className="rounded-xl border border-black/5 bg-[#f7f9f7] p-2.5 text-[#3b5949] hover:bg-[#ebf0eb]"
            title="Refresh batches"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#173d2e] px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-[#1f4e3c]"
          >
            <Plus size={16} />
            <span>New Batch Lot</span>
          </button>
        </div>
      </div>

      {/* Batches Table */}
      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-black/5 bg-[#fafcf9] text-[#718078]">
              <tr>
                <th className="p-3.5 font-extrabold uppercase">Batch #</th>
                <th className="p-3.5 font-extrabold uppercase">Product / SKU</th>
                <th className="p-3.5 font-extrabold uppercase">Shelf Life</th>
                <th className="p-3.5 font-extrabold uppercase">Quantity</th>
                <th className="p-3.5 font-extrabold uppercase">Unit Cost / Sell</th>
                <th className="p-3.5 font-extrabold uppercase">Status</th>
                <th className="p-3.5 font-extrabold uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 text-[#203229]">
              {batches.map(batch => {
                const days = getRemainingDays(batch.expiryDate);
                const isNear = days <= 30 && days > 0;
                const isExp = days <= 0;

                return (
                  <tr key={batch.id} className="hover:bg-[#fafbf9]">
                    <td className="p-3.5">
                      <div className="font-extrabold text-[#173d2e]">{batch.batchNumber}</div>
                      <div className="text-[11px] text-[#86948c]">Lot ID: {batch.id}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-extrabold">{batch.productName || 'Product'}</div>
                      <div className="text-[11px] text-[#7d8b83]">{batch.sku || 'SKU-N/A'}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1 text-[11px] text-[#55675d]">
                        <Calendar size={12} className="text-[#88988e]" />
                        <span>Mfg: {batch.mfgDate}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 font-bold">
                        <Clock
                          size={12}
                          className={isExp ? 'text-red-500' : isNear ? 'text-amber-500' : 'text-emerald-600'}
                        />
                        <span className={isExp ? 'text-red-600' : isNear ? 'text-amber-600' : 'text-[#315245]'}>
                          Exp: {batch.expiryDate} ({isExp ? 'EXPIRED' : `${days}d left`})
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-sm font-black text-[#173d2e]">{batch.quantity}</div>
                      <div className="text-[10px] text-[#86948c]">
                        Initial: {batch.initialQuantity} | Dmg: {batch.damagedQuantity || 0}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-[#315245]">₹{batch.costPrice} / ₹{batch.sellingPrice}</div>
                      <div className="text-[10px] text-[#718078]">
                        Margin: {Math.round(((batch.sellingPrice - batch.costPrice) / (batch.sellingPrice || 1)) * 100)}%
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                          batch.status === 'ACTIVE'
                            ? 'bg-[#eef6ed] text-[#33704f]'
                            : batch.status === 'NEAR_EXPIRY'
                            ? 'bg-[#fff5e0] text-[#9a6a24]'
                            : batch.status === 'EXPIRED'
                            ? 'bg-[#ffebe9] text-[#b93829]'
                            : batch.status === 'QUARANTINED'
                            ? 'bg-[#f0eaff] text-[#6d32a8]'
                            : 'bg-[#ebeeed] text-[#73827a]'
                        }`}
                      >
                        {batch.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {batch.quantity > 0 ? (
                        <button
                          onClick={() => {
                            setWriteOffModal(batch);
                            setWriteOffQty(Math.min(5, batch.quantity));
                            setWriteOffAction(isExp ? 'EXPIRY_SCRAP' : 'QUARANTINE');
                          }}
                          className="inline-flex items-center gap-1 rounded-xl border border-black/10 bg-white px-2.5 py-1.5 text-xs font-bold text-[#b93829] shadow-sm hover:bg-[#fff7f7]"
                        >
                          <ShieldAlert size={14} />
                          <span>Write-off</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-[#a5b2ab]">Depleted</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!batches.length && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-[#7d8c83]">
                    <CheckCircle2 className="mx-auto mb-2 text-[#7ca486]" size={24} />
                    No batches match the current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Batch Lot */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-black text-[#173d2e]">Create Batch / Lot</h2>
            <p className="mt-1 text-xs text-[#718078]">
              Register physical production or vendor delivery lot with manufacturing & expiry dates.
            </p>

            <form onSubmit={handleCreateBatch} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#45574f]">Product</label>
                <select
                  value={newBatch.productId}
                  onChange={e => setNewBatch({ ...newBatch, productId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold text-[#173d2e]"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#45574f]">Batch / Lot Number</label>
                  <input
                    required
                    placeholder="e.g. B-MNG-2609X"
                    value={newBatch.batchNumber}
                    onChange={e => setNewBatch({ ...newBatch, batchNumber: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#45574f]">Shop / Store</label>
                  <select
                    value={newBatch.shopId}
                    onChange={e => setNewBatch({ ...newBatch, shopId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold"
                  >
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#45574f]">Manufacturing Date</label>
                  <input
                    type="date"
                    required
                    value={newBatch.mfgDate}
                    onChange={e => setNewBatch({ ...newBatch, mfgDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#45574f]">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={newBatch.expiryDate}
                    onChange={e => setNewBatch({ ...newBatch, expiryDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#45574f]">Lot Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newBatch.quantity}
                    onChange={e => setNewBatch({ ...newBatch, quantity: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#45574f]">Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newBatch.costPrice}
                    onChange={e => setNewBatch({ ...newBatch, costPrice: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#45574f]">Sell (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newBatch.sellingPrice}
                    onChange={e => setNewBatch({ ...newBatch, sellingPrice: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-bold text-[#4c5f54]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#173d2e] px-5 py-2.5 text-xs font-black text-white hover:bg-[#1f4e3c]"
                >
                  {submitting ? 'Saving...' : 'Register Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Write-off / Quarantine */}
      {writeOffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-[#b93829]">
              <ShieldAlert size={20} />
              <h2 className="text-lg font-black text-[#203229]">Stock Write-Off / Quarantine</h2>
            </div>
            <p className="mt-1 text-xs text-[#718078]">
              Deduct units from batch <b className="text-[#173d2e]">{writeOffModal.batchNumber}</b> ({writeOffModal.productName}). Available: {writeOffModal.quantity}
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-[#45574f]">Action Type</label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {(['EXPIRY_SCRAP', 'QUARANTINE', 'DAMAGE'] as const).map(act => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => setWriteOffAction(act)}
                      className={`rounded-xl border p-2 text-center text-xs font-bold transition ${
                        writeOffAction === act
                          ? 'border-[#b93829] bg-[#fff3f2] text-[#b93829]'
                          : 'border-black/10 bg-[#fafcf9] text-[#55675d]'
                      }`}
                    >
                      {act.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#45574f]">Quantity to write off</label>
                <input
                  type="number"
                  min="1"
                  max={writeOffModal.quantity}
                  value={writeOffQty}
                  onChange={e => setWriteOffQty(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#45574f]">Reason / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Expired on shelf / damaged seal"
                  value={writeOffNotes}
                  onChange={e => setWriteOffNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-medium"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setWriteOffModal(null)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-bold text-[#4c5f54]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleWriteOff()}
                  className="rounded-xl bg-[#b93829] px-5 py-2.5 text-xs font-black text-white hover:bg-[#9f2e20]"
                >
                  {submitting ? 'Applying...' : 'Confirm Write-Off'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: FEFO Simulator */}
      {fefoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-[#173d2e]">
              <Zap size={20} className="text-[#3b7a5d]" />
              <h2 className="text-lg font-black">FEFO Stock Allocation Engine</h2>
            </div>
            <p className="mt-1 text-xs text-[#718078]">
              Simulate First-Expired, First-Out automatic lot selection for orders or POS checkout.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#45574f]">Product</label>
                <select
                  value={fefoProductId}
                  onChange={e => setFefoProductId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#45574f]">Order Units Needed</label>
                <input
                  type="number"
                  min="1"
                  value={fefoQuantity}
                  onChange={e => setFefoQuantity(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold"
                />
              </div>
            </div>

            <button
              onClick={() => void handleRunFefo()}
              className="mt-3 w-full rounded-xl bg-[#173d2e] py-2 text-xs font-black text-white hover:bg-[#1f4e3c]"
            >
              Calculate FEFO Allocation Plan
            </button>

            {fefoPlan && (
              <div className="mt-4 rounded-2xl bg-[#fafcf9] p-4 text-xs">
                <div className="flex justify-between font-bold text-[#173d2e]">
                  <span>Requested: {fefoPlan.requestedQuantity}</span>
                  <span className="text-emerald-700">Allocated: {fefoPlan.allocatedTotal}</span>
                  {fefoPlan.shortfall > 0 && <span className="text-red-600">Shortfall: {fefoPlan.shortfall}</span>}
                </div>

                <div className="mt-3 space-y-2">
                  <div className="text-[11px] font-extrabold uppercase text-[#718078]">Prioritized Lots:</div>
                  {fefoPlan.allocationPlan?.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-black/5">
                      <div>
                        <span className="font-extrabold text-[#173d2e]">{item.batch.batchNumber}</span>
                        <span className="ml-2 text-[#7d8b83]">Expires: {item.batch.expiryDate}</span>
                      </div>
                      <span className="rounded-full bg-[#d7ef8d] px-2.5 py-0.5 font-black text-[#173d2e]">
                        Pick {item.allocatedQty} units
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => {
                  setFefoModal(false);
                  setFefoPlan(null);
                }}
                className="rounded-xl border border-black/10 bg-white px-5 py-2 text-xs font-bold text-[#45574f]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
