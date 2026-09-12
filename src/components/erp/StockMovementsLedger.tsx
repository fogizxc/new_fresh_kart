import { useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Filter,
  History,
  RefreshCw,
  Search
} from 'lucide-react';
import { erpApi, type ApiStockMovement, type StockMovementType } from '../../services/erpApi';

type Props = {
  flash: (message: string) => void;
};

export function StockMovementsLedger({ flash }: Props) {
  const [movements, setMovements] = useState<ApiStockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await erpApi.movements.list();
      setMovements(data);
    } catch (err: any) {
      flash(err?.message || 'Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = movements.filter(m => {
    if (typeFilter !== 'ALL' && m.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchProd = m.productName?.toLowerCase().includes(q);
      const matchRef = m.referenceId?.toLowerCase().includes(q);
      const matchBatch = m.batchNumber?.toLowerCase().includes(q);
      if (!matchProd && !matchRef && !matchBatch) return false;
    }
    return true;
  });

  const totalIn = movements.filter(m => m.delta > 0).reduce((sum, m) => sum + m.delta, 0);
  const totalOut = movements.filter(m => m.delta < 0).reduce((sum, m) => sum + Math.abs(m.delta), 0);

  const types: StockMovementType[] = [
    'PO_RECEIPT',
    'SALE',
    'POS_SALE',
    'RETURN',
    'DAMAGE',
    'EXPIRY_SCRAP',
    'TRANSFER_IN',
    'TRANSFER_OUT',
    'RECONCILIATION'
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#718078]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Ledger Entries</span>
            <History size={18} className="text-[#3c7358]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#173d2e]">{movements.length}</div>
          <div className="mt-1 text-xs text-[#8a968f]">Auditable stock mutations recorded</div>
        </div>

        <div className="rounded-2xl border border-[#d6ebd9] bg-[#f4faf4] p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#2c7746]">
            <span className="text-xs font-bold uppercase tracking-wider">Stock Inflow (+)</span>
            <ArrowUpRight size={18} />
          </div>
          <div className="mt-2 text-2xl font-black text-[#2c7746]">+{totalIn} units</div>
          <div className="mt-1 text-xs text-[#2c7746]/80">Receipts, transfers-in & returns</div>
        </div>

        <div className="rounded-2xl border border-[#fbd4d2] bg-[#fdf6f5] p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#b93829]">
            <span className="text-xs font-bold uppercase tracking-wider">Stock Outflow (-)</span>
            <ArrowDownRight size={18} />
          </div>
          <div className="mt-2 text-2xl font-black text-[#b93829]">-{totalOut} units</div>
          <div className="mt-1 text-xs text-[#b93829]/80">Sales, damages, scraps & transfers-out</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex flex-1 items-center gap-2 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9991]" />
            <input
              type="text"
              placeholder="Search product, batch #, reference..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-[#fafcf9] py-2 pl-9 pr-4 text-xs font-bold outline-none focus:border-[#427b5f]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void load()}
            disabled={loading}
            className="rounded-xl border border-black/5 bg-[#f7f9f7] p-2.5 text-[#3b5949] hover:bg-[#ebf0eb]"
            title="Refresh ledger"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex w-full flex-wrap items-center gap-1.5 pt-2 border-t border-black/5 text-xs font-bold">
          <span className="mr-1 flex items-center gap-1 text-[#718078]">
            <Filter size={13} /> Type:
          </span>
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`rounded-xl px-2.5 py-1 transition ${
              typeFilter === 'ALL' ? 'bg-[#173d2e] text-white' : 'bg-[#f4f7f4] text-[#55675d] hover:bg-[#e7eee8]'
            }`}
          >
            ALL
          </button>
          {types.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-xl px-2.5 py-1 transition ${
                typeFilter === t ? 'bg-[#173d2e] text-white' : 'bg-[#f4f7f4] text-[#55675d] hover:bg-[#e7eee8]'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Movements Table */}
      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-black/5 bg-[#fafcf9] text-[#718078]">
              <tr>
                <th className="p-3.5 font-extrabold uppercase">Date & Time</th>
                <th className="p-3.5 font-extrabold uppercase">Mutation Type</th>
                <th className="p-3.5 font-extrabold uppercase">Product / Batch</th>
                <th className="p-3.5 font-extrabold uppercase">Change (Delta)</th>
                <th className="p-3.5 font-extrabold uppercase">Resulting Stock</th>
                <th className="p-3.5 font-extrabold uppercase">Reference / Notes</th>
                <th className="p-3.5 font-extrabold uppercase">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 text-[#203229]">
              {filtered.map(mov => {
                const isPositive = mov.delta > 0;
                return (
                  <tr key={mov.id} className="hover:bg-[#fafbf9]">
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-extrabold text-[#203229]">
                        {new Date(mov.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-[11px] text-[#7d8b83]">
                        {new Date(mov.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          mov.type === 'PO_RECEIPT' || mov.type === 'TRANSFER_IN' || mov.type === 'RETURN'
                            ? 'bg-[#eef6ed] text-[#33704f]'
                            : mov.type === 'RECONCILIATION'
                            ? 'bg-[#eaf1fb] text-[#2964b9]'
                            : 'bg-[#fff2f0] text-[#b93829]'
                        }`}
                      >
                        {mov.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-extrabold text-[#173d2e]">{mov.productName || mov.productId}</div>
                      {mov.batchNumber && (
                        <div className="text-[11px] text-[#7d8b83]">Lot: {mov.batchNumber}</div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-0.5 text-sm font-black ${
                          isPositive ? 'text-[#2c7746]' : 'text-[#b93829]'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {mov.delta}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-extrabold text-[#173d2e]">{mov.resultingStock}</span>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      {mov.referenceId && (
                        <div className="font-extrabold text-[#3a6850]">{mov.referenceId}</div>
                      )}
                      <div className="text-[11px] text-[#718078] truncate">{mov.notes || '—'}</div>
                    </td>
                    <td className="p-3.5 text-[11px] text-[#7d8b83] font-mono">
                      {mov.createdBy}
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-[#7d8c83]">
                    <CheckCircle2 className="mx-auto mb-2 text-[#7ca486]" size={24} />
                    No stock movements matched your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
