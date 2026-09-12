import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Plus,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { erpApi, type ApiInventoryAudit } from '../../services/erpApi';
import type { ApiProduct, ApiShop } from '../../services/api';

type Props = {
  products: ApiProduct[];
  shops: ApiShop[];
  role: string;
  flash: (message: string) => void;
};

export function PhysicalAuditView({ products, shops, role, flash }: Props) {
  const [audits, setAudits] = useState<ApiInventoryAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // New audit state
  const [auditTitle, setAuditTitle] = useState('Monthly Store Stock Count');
  const [selectedShopId, setSelectedShopId] = useState(shops[0]?.id || 'shop-1');
  const [auditItems, setAuditItems] = useState<
    Array<{
      productId: string;
      productName: string;
      sku: string;
      systemStock: number;
      countedStock: number;
      reason: string;
    }>
  >([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await erpApi.audits.list();
      setAudits(data);
    } catch (err: any) {
      flash(err?.message || 'Failed to load stock audits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openNewAuditModal = () => {
    const shopProducts = products.filter(p => !p.shopId || p.shopId === selectedShopId);
    setAuditItems(
      shopProducts.map(p => ({
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        systemStock: p.stock,
        countedStock: p.stock, // default to system count
        reason: ''
      }))
    );
    setShowModal(true);
  };

  const handleCreateAudit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy('create');
    try {
      await erpApi.audits.create({
        title: auditTitle,
        shopId: selectedShopId,
        items: auditItems.map(it => ({
          ...it,
          discrepancy: it.countedStock - it.systemStock
        }))
      });
      flash('Physical audit session initiated');
      setShowModal(false);
      await load();
    } catch (err: any) {
      flash(err?.message || 'Failed to create audit');
    } finally {
      setBusy(null);
    }
  };

  const handleReconcile = async (auditId: string) => {
    setBusy(auditId);
    try {
      await erpApi.audits.reconcile(auditId);
      flash('Audit reconciled: stock balances and ledger adjusted');
      await load();
    } catch (err: any) {
      flash(err?.message || 'Failed to reconcile audit');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-[#173d2e]">Stock Audits & Reconciliation</h2>
          <p className="mt-0.5 text-xs text-[#718078]">
            Perform physical counts, detect inventory shrinkage, and reconcile system balances with an audit trail.
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
            onClick={openNewAuditModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#173d2e] px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-[#1f4e3c]"
          >
            <Plus size={16} />
            <span>Start Stock Audit</span>
          </button>
        </div>
      </div>

      {/* Audits List */}
      <div className="space-y-4">
        {audits.map(aud => {
          const totalDiscrepancies = aud.items.filter(i => i.discrepancy !== 0).length;
          const netVariance = aud.items.reduce((sum, i) => sum + i.discrepancy, 0);

          return (
            <div key={aud.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf1fb] text-[#2964b9]">
                    <ClipboardCheck size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[#173d2e]">{aud.title}</span>
                      <span className="text-xs font-bold text-[#86948c]">({aud.auditNumber})</span>
                    </div>
                    <div className="text-[11px] text-[#718078]">
                      Conducted on {new Date(aud.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                      aud.status === 'RECONCILED'
                        ? 'bg-[#eef6ed] text-[#33704f]'
                        : 'bg-[#fff5e0] text-[#9a6a24]'
                    }`}
                  >
                    {aud.status}
                  </span>

                  {aud.status !== 'RECONCILED' && (
                    <button
                      disabled={busy === aud.id}
                      onClick={() => void handleReconcile(aud.id)}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#173d2e] px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-[#1f4e3c]"
                    >
                      <FileCheck2 size={15} />
                      <span>{busy === aud.id ? 'Reconciling...' : 'Reconcile Stock'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-black/5 bg-[#fafcf9] text-[#718078]">
                    <tr>
                      <th className="p-2.5 font-bold uppercase">Product / SKU</th>
                      <th className="p-2.5 font-bold uppercase">System Qty</th>
                      <th className="p-2.5 font-bold uppercase">Counted Qty</th>
                      <th className="p-2.5 font-bold uppercase">Discrepancy (Variance)</th>
                      <th className="p-2.5 font-bold uppercase">Observation / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {aud.items.map((item, idx) => {
                      const hasVariance = item.discrepancy !== 0;
                      return (
                        <tr key={idx} className={hasVariance ? 'bg-[#fffaf7]' : ''}>
                          <td className="p-2.5">
                            <div className="font-extrabold text-[#203229]">{item.productName}</div>
                            <div className="text-[10px] text-[#7d8b83]">{item.sku}</div>
                          </td>
                          <td className="p-2.5 font-bold text-[#55675d]">{item.systemStock}</td>
                          <td className="p-2.5 font-black text-[#173d2e]">{item.countedStock}</td>
                          <td className="p-2.5">
                            <span
                              className={`inline-flex items-center gap-1 font-black ${
                                item.discrepancy > 0
                                  ? 'text-emerald-700'
                                  : item.discrepancy < 0
                                  ? 'text-red-600'
                                  : 'text-[#88988e]'
                              }`}
                            >
                              {item.discrepancy > 0 ? `+${item.discrepancy}` : item.discrepancy}
                              {hasVariance && <AlertCircle size={12} />}
                            </span>
                          </td>
                          <td className="p-2.5 text-[11px] text-[#718078]">
                            {item.reason || (hasVariance ? 'Variance pending resolution' : 'Matches system record')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {!audits.length && !loading && (
          <div className="rounded-2xl border border-black/5 bg-white py-12 text-center text-sm text-[#718078]">
            <CheckCircle2 className="mx-auto mb-2 text-[#7ca486]" size={24} />
            No physical stock audits performed yet.
          </div>
        )}
      </div>

      {/* Modal: New Stock Audit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-black text-[#173d2e]">New Physical Inventory Count</h2>
            <p className="mt-1 text-xs text-[#718078]">
              Enter the actual counted quantities on physical store shelves to automatically compute variances.
            </p>

            <form onSubmit={handleCreateAudit} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#45574f]">Audit Session Title</label>
                  <input
                    required
                    value={auditTitle}
                    onChange={e => setAuditTitle(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#45574f]">Store Location</label>
                  <select
                    value={selectedShopId}
                    onChange={e => {
                      setSelectedShopId(e.target.value);
                      const shopProds = products.filter(p => !p.shopId || p.shopId === e.target.value);
                      setAuditItems(
                        shopProds.map(p => ({
                          productId: p.id,
                          productName: p.name,
                          sku: p.sku,
                          systemStock: p.stock,
                          countedStock: p.stock,
                          reason: ''
                        }))
                      );
                    }}
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

              {/* Items Table for Counting */}
              <div className="rounded-2xl border border-black/5 bg-[#fafcf9] p-3">
                <div className="mb-2 text-xs font-black uppercase text-[#718078]">Store Shelf Items</div>
                <div className="space-y-2">
                  {auditItems.map((item, idx) => (
                    <div
                      key={item.productId}
                      className="grid grid-cols-12 items-center gap-2 rounded-xl bg-white p-2.5 text-xs border border-black/5"
                    >
                      <div className="col-span-5">
                        <div className="font-extrabold text-[#173d2e]">{item.productName}</div>
                        <div className="text-[10px] text-[#7d8b83]">{item.sku}</div>
                      </div>
                      <div className="col-span-2 text-center text-[#718078]">
                        Sys: <b className="text-[#203229]">{item.systemStock}</b>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          required
                          value={item.countedStock}
                          onChange={e => {
                            const val = Number(e.target.value);
                            const updated = [...auditItems];
                            updated[idx].countedStock = val;
                            setAuditItems(updated);
                          }}
                          className="w-full rounded-lg border border-black/10 p-1.5 text-center font-black text-[#173d2e]"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Reason if variance..."
                          value={item.reason}
                          onChange={e => {
                            const updated = [...auditItems];
                            updated[idx].reason = e.target.value;
                            setAuditItems(updated);
                          }}
                          className="w-full rounded-lg border border-black/10 p-1.5 text-[11px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-bold text-[#4c5f54]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy === 'create'}
                  className="rounded-xl bg-[#173d2e] px-5 py-2.5 text-xs font-black text-white hover:bg-[#1f4e3c]"
                >
                  {busy === 'create' ? 'Saving...' : 'Save Audit Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
