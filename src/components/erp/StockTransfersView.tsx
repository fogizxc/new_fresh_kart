import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Truck,
  XCircle
} from 'lucide-react';
import { erpApi, type ApiStockTransfer, type StockTransferStatus } from '../../services/erpApi';
import type { ApiProduct, ApiShop } from '../../services/api';

type Props = {
  products: ApiProduct[];
  shops: ApiShop[];
  role: string;
  flash: (message: string) => void;
};

export function StockTransfersView({ products, shops, role, flash }: Props) {
  const [transfers, setTransfers] = useState<ApiStockTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const [sourceShopId, setSourceShopId] = useState(shops[0]?.id || 'shop-1');
  const [destShopId, setDestShopId] = useState(shops[1]?.id || 'shop-2');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState(10);
  const [notes, setNotes] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await erpApi.transfers.list();
      setTransfers(data);
    } catch (err: any) {
      flash(err?.message || 'Failed to load stock transfers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreateTransfer = async (e: FormEvent) => {
    e.preventDefault();
    if (sourceShopId === destShopId) {
      flash('Source and destination shops must be different');
      return;
    }
    const prod = products.find(p => p.id === productId);
    const srcShop = shops.find(s => s.id === sourceShopId);
    const dstShop = shops.find(s => s.id === destShopId);

    setBusy('create');
    try {
      await erpApi.transfers.create({
        sourceShopId,
        sourceShopName: srcShop?.name || sourceShopId,
        destShopId,
        destShopName: dstShop?.name || destShopId,
        items: [
          {
            productId,
            productName: prod?.name || 'Product',
            quantity: Number(quantity)
          }
        ],
        notes
      });
      flash('Inter-shop transfer requested');
      setShowCreateModal(false);
      setNotes('');
      await load();
    } catch (err: any) {
      flash(err?.message || 'Failed to request transfer');
    } finally {
      setBusy(null);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: StockTransferStatus) => {
    setBusy(id);
    try {
      await erpApi.transfers.updateStatus(id, newStatus);
      flash(`Transfer status updated to ${newStatus}`);
      await load();
    } catch (err: any) {
      flash(err?.message || 'Failed to update transfer');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-[#173d2e]">Inter-Shop Stock Transfers</h2>
          <p className="mt-0.5 text-xs text-[#718078]">
            Move inventory between multi-store branches with end-to-end dispatch and receipt logging.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void load()}
            disabled={loading}
            className="rounded-xl border border-black/5 bg-[#f7f9f7] p-2.5 text-[#3b5949] hover:bg-[#ebf0eb]"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#173d2e] px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-[#1f4e3c]"
          >
            <Plus size={16} />
            <span>New Transfer Request</span>
          </button>
        </div>
      </div>

      {/* Transfers Cards / List */}
      <div className="grid gap-4">
        {transfers.map(trf => {
          return (
            <div key={trf.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef5ed] text-[#347451]">
                    <Truck size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-black text-[#173d2e]">{trf.transferNumber}</div>
                    <div className="text-[11px] text-[#718078]">
                      Requested on {new Date(trf.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                      trf.status === 'RECEIVED'
                        ? 'bg-[#eef6ed] text-[#33704f]'
                        : trf.status === 'IN_TRANSIT'
                        ? 'bg-[#eaf1fb] text-[#2964b9]'
                        : trf.status === 'APPROVED'
                        ? 'bg-[#fff5e0] text-[#9a6a24]'
                        : trf.status === 'CANCELLED' || trf.status === 'REJECTED'
                        ? 'bg-[#ffebe9] text-[#b93829]'
                        : 'bg-[#f0f3f1] text-[#5b6a62]'
                    }`}
                  >
                    {trf.status}
                  </span>

                  {/* Operational workflow buttons */}
                  {trf.status === 'REQUESTED' && (
                    <div className="flex gap-1.5">
                      <button
                        disabled={busy === trf.id}
                        onClick={() => void handleUpdateStatus(trf.id, 'APPROVED')}
                        className="rounded-xl bg-[#173d2e] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1f4e3c]"
                      >
                        Approve
                      </button>
                      <button
                        disabled={busy === trf.id}
                        onClick={() => void handleUpdateStatus(trf.id, 'REJECTED')}
                        className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-[#b93829] hover:bg-[#fff6f6]"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {trf.status === 'APPROVED' && (
                    <button
                      disabled={busy === trf.id}
                      onClick={() => void handleUpdateStatus(trf.id, 'IN_TRANSIT')}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#2964b9] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1f519c]"
                    >
                      <Truck size={14} />
                      <span>Dispatch (In-Transit)</span>
                    </button>
                  )}

                  {trf.status === 'IN_TRANSIT' && (
                    <button
                      disabled={busy === trf.id}
                      onClick={() => void handleUpdateStatus(trf.id, 'RECEIVED')}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#2c7746] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#235e37]"
                    >
                      <CheckCircle2 size={14} />
                      <span>Confirm Store Inward</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Route & Items */}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl bg-[#fafcf9] p-3 text-xs">
                  <div>
                    <div className="text-[10px] font-extrabold uppercase text-[#718078]">Source Store</div>
                    <div className="font-bold text-[#173d2e]">{trf.sourceShopName || trf.sourceShopId}</div>
                  </div>
                  <ArrowRight size={16} className="text-[#88988e]" />
                  <div>
                    <div className="text-[10px] font-extrabold uppercase text-[#718078]">Destination Store</div>
                    <div className="font-bold text-[#173d2e]">{trf.destShopName || trf.destShopId}</div>
                  </div>
                </div>

                <div className="rounded-xl bg-[#fafcf9] p-3 text-xs">
                  <div className="text-[10px] font-extrabold uppercase text-[#718078]">Manifest Items</div>
                  <div className="mt-1 space-y-1">
                    {trf.items.map((it, i) => (
                      <div key={i} className="flex justify-between font-bold text-[#203229]">
                        <span>{it.productName}</span>
                        <span className="text-[#173d2e]">{it.quantity} units</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {trf.notes && (
                <div className="mt-3 text-[11px] text-[#718078]">
                  <b>Note:</b> {trf.notes}
                </div>
              )}
            </div>
          );
        })}

        {!transfers.length && !loading && (
          <div className="rounded-2xl border border-black/5 bg-white py-12 text-center text-sm text-[#718078]">
            <CheckCircle2 className="mx-auto mb-2 text-[#7ca486]" size={24} />
            No inter-shop transfer requests logged yet.
          </div>
        )}
      </div>

      {/* Modal: New Transfer */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-black text-[#173d2e]">Request Inter-Shop Transfer</h2>
            <p className="mt-1 text-xs text-[#718078]">
              Initiate a stock balance transfer from a source warehouse to destination branch.
            </p>

            <form onSubmit={handleCreateTransfer} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#45574f]">Source Shop</label>
                  <select
                    value={sourceShopId}
                    onChange={e => setSourceShopId(e.target.value)}
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
                  <label className="text-xs font-bold text-[#45574f]">Destination Shop</label>
                  <select
                    value={destShopId}
                    onChange={e => setDestShopId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold text-[#173d2e]"
                  >
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-[#45574f]">Product to Transfer</label>
                  <select
                    value={productId}
                    onChange={e => setProductId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#45574f]">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#45574f]">Transfer Reason / Memo</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Balancing stock for weekend peak demand"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
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
                  type="submit"
                  disabled={busy === 'create'}
                  className="rounded-xl bg-[#173d2e] px-5 py-2.5 text-xs font-black text-white hover:bg-[#1f4e3c]"
                >
                  {busy === 'create' ? 'Submitting...' : 'Submit Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
