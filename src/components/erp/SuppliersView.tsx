import { useEffect, useState, type FormEvent } from 'react';
import {
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search
} from 'lucide-react';
import {
  erpApi,
  type ApiSupplier,
  type ApiSupplierPayment
} from '../../services/erpApi';

type Props = {
  flash: (message: string) => void;
};

export function SuppliersView({ flash }: Props) {
  const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
  const [payments, setPayments] = useState<ApiSupplierPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [paymentModalSupplier, setPaymentModalSupplier] = useState<ApiSupplier | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // New Supplier Form
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    gstin: '',
    address: '',
    city: 'New Delhi',
    state: 'Delhi',
    paymentTermsDays: 30,
    category: 'Fresh Produce'
  });

  // Record Payment Form
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'NEFT' | 'RTGS' | 'UPI' | 'CHEQUE' | 'CASH'>('NEFT');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [supList, payList] = await Promise.all([
        erpApi.suppliers.list(),
        erpApi.payments.list()
      ]);
      setSuppliers(supList);
      setPayments(payList);
    } catch (err: any) {
      flash(err?.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreateSupplier = async (e: FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name || !newSupplier.phone) {
      flash('Name and phone are required');
      return;
    }
    setBusy('create-sup');
    try {
      await erpApi.suppliers.create(newSupplier);
      flash(`Supplier ${newSupplier.name} registered`);
      setShowAddSupplierModal(false);
      setNewSupplier({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        gstin: '',
        address: '',
        city: 'New Delhi',
        state: 'Delhi',
        paymentTermsDays: 30,
        category: 'Fresh Produce'
      });
      await loadData();
    } catch (err: any) {
      flash(err?.message || 'Failed to create supplier');
    } finally {
      setBusy(null);
    }
  };

  const handleRecordPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!paymentModalSupplier || paymentAmount <= 0) {
      flash('Please enter a valid payment amount');
      return;
    }
    setBusy('record-pay');
    try {
      await erpApi.payments.record({
        supplierId: paymentModalSupplier.id,
        amount: paymentAmount,
        paymentMode,
        referenceNumber: paymentRef || `REF-${Date.now().toString().slice(-6)}`,
        notes: paymentNotes
      });
      flash(`Payment of ₹${paymentAmount.toLocaleString()} recorded for ${paymentModalSupplier.name}`);
      setPaymentModalSupplier(null);
      setPaymentRef('');
      setPaymentNotes('');
      await loadData();
    } catch (err: any) {
      flash(err?.message || 'Failed to record payment');
    } finally {
      setBusy(null);
    }
  };

  const filtered = suppliers.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.contactPerson.toLowerCase().includes(q) || s.phone.includes(q);
  });

  const totalOutstanding = suppliers.reduce((sum, s) => sum + (s.balanceOutstanding || 0), 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#718078]">
            <span className="text-xs font-bold uppercase tracking-wider">Registered Vendors</span>
            <Building2 size={18} className="text-[#3c7358]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#173d2e]">{suppliers.length}</div>
          <div className="mt-1 text-xs text-[#8a968f]">Verified supply chain partners</div>
        </div>

        <div className="rounded-2xl border border-[#f5dfb8] bg-[#fffaf0] p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#9a6a24]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Accounts Payable</span>
            <Banknote size={18} />
          </div>
          <div className="mt-2 text-2xl font-black text-[#9a6a24]">₹{Math.round(totalOutstanding).toLocaleString('en-IN')}</div>
          <div className="mt-1 text-xs text-[#a87937]">Net outstanding vendor dues</div>
        </div>

        <div className="rounded-2xl border border-[#d6ebd9] bg-[#f4faf4] p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#2c7746]">
            <span className="text-xs font-bold uppercase tracking-wider">Payments Settled</span>
            <CreditCard size={18} />
          </div>
          <div className="mt-2 text-2xl font-black text-[#2c7746]">{payments.length} Vouchers</div>
          <div className="mt-1 text-xs text-[#2c7746]/80">Recorded bank and ledger transfers</div>
        </div>
      </div>

      {/* Action and Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9991]" />
          <input
            type="text"
            placeholder="Search vendor name, contact person, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-[#fafcf9] py-2 pl-9 pr-4 text-xs font-bold outline-none focus:border-[#427b5f]"
          />
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
            onClick={() => setShowAddSupplierModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#173d2e] px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-[#1f4e3c]"
          >
            <Plus size={16} />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Supplier Directory Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(sup => {
          return (
            <div key={sup.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-black text-[#173d2e]">{sup.name}</h3>
                  <div className="text-xs font-bold text-[#62776b]">{sup.category || 'Vendor'}</div>
                </div>
                <span className="rounded-full bg-[#eef6ed] px-2.5 py-0.5 text-[10px] font-black text-[#33704f]">
                  NET {sup.paymentTermsDays}d
                </span>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-[#55675d]">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#718078]">Contact:</span>
                  <b className="text-[#203229]">{sup.contactPerson || '—'}</b>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-[#88988e]" />
                  <span>{sup.phone}</span>
                </div>
                {sup.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-[#88988e]" />
                    <span className="truncate">{sup.email}</span>
                  </div>
                )}
                {sup.gstin && (
                  <div className="text-[11px] text-[#718078]">
                    GSTIN: <b className="font-mono text-[#203229]">{sup.gstin}</b>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
                <div>
                  <div className="text-[10px] font-extrabold uppercase text-[#718078]">Payable Balance</div>
                  <div className={`text-base font-black ${sup.balanceOutstanding > 0 ? 'text-[#9a6a24]' : 'text-emerald-700'}`}>
                    ₹{Math.round(sup.balanceOutstanding || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setPaymentModalSupplier(sup);
                    setPaymentAmount(sup.balanceOutstanding || 1000);
                  }}
                  className="rounded-xl bg-[#173d2e] px-3 py-1.5 text-xs font-black text-white hover:bg-[#1f4e3c]"
                >
                  Pay Vendor
                </button>
              </div>
            </div>
          );
        })}

        {!filtered.length && !loading && (
          <div className="col-span-full rounded-2xl border border-black/5 bg-white py-12 text-center text-sm text-[#718078]">
            <CheckCircle2 className="mx-auto mb-2 text-[#7ca486]" size={24} />
            No suppliers matched your search.
          </div>
        )}
      </div>

      {/* Recent Payments Vouchers Table */}
      {payments.length > 0 && (
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-wider text-[#173d2e]">Recent Payment Vouchers</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-black/5 bg-[#fafcf9] text-[#718078]">
                <tr>
                  <th className="p-2.5 font-bold uppercase">Voucher #</th>
                  <th className="p-2.5 font-bold uppercase">Supplier</th>
                  <th className="p-2.5 font-bold uppercase">Amount</th>
                  <th className="p-2.5 font-bold uppercase">Mode</th>
                  <th className="p-2.5 font-bold uppercase">Reference (UTR)</th>
                  <th className="p-2.5 font-bold uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {payments.map(p => (
                  <tr key={p.id}>
                    <td className="p-2.5 font-black text-[#173d2e]">{p.paymentNumber}</td>
                    <td className="p-2.5 font-bold text-[#203229]">{p.supplierName || p.supplierId}</td>
                    <td className="p-2.5 font-black text-emerald-700">₹{p.amount.toLocaleString()}</td>
                    <td className="p-2.5 font-bold text-[#3a6850]">{p.paymentMode}</td>
                    <td className="p-2.5 font-mono text-[#718078]">{p.referenceNumber}</td>
                    <td className="p-2.5 text-[#718078]">{p.paymentDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: New Supplier */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-black text-[#173d2e]">Register Vendor / Supplier</h2>
            <p className="mt-1 text-xs text-[#718078]">
              Add a trusted vendor profile with tax identifiers and payment terms.
            </p>

            <form onSubmit={handleCreateSupplier} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#45574f]">Supplier / Entity Name</label>
                <input
                  required
                  placeholder="e.g. FarmFresh Agritech Ltd"
                  value={newSupplier.name}
                  onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#45574f]">Contact Person</label>
                  <input
                    placeholder="e.g. Ramesh Patel"
                    value={newSupplier.contactPerson}
                    onChange={e => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#45574f]">Phone Number</label>
                  <input
                    required
                    placeholder="e.g. 9820198201"
                    value={newSupplier.phone}
                    onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#45574f]">Email</label>
                  <input
                    type="email"
                    placeholder="vendor@domain.com"
                    value={newSupplier.email}
                    onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#45574f]">GSTIN</label>
                  <input
                    placeholder="07AAAAF1234A1Z5"
                    value={newSupplier.gstin}
                    onChange={e => setNewSupplier({ ...newSupplier, gstin: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#45574f]">Payment Terms (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={newSupplier.paymentTermsDays}
                    onChange={e => setNewSupplier({ ...newSupplier, paymentTermsDays: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#45574f]">Category</label>
                  <input
                    placeholder="Produce / Dairy / Grains"
                    value={newSupplier.category}
                    onChange={e => setNewSupplier({ ...newSupplier, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-bold text-[#4c5f54]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy === 'create-sup'}
                  className="rounded-xl bg-[#173d2e] px-5 py-2.5 text-xs font-black text-white hover:bg-[#1f4e3c]"
                >
                  {busy === 'create-sup' ? 'Registering...' : 'Register Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pay Vendor */}
      {paymentModalSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-black text-[#173d2e]">Record Vendor Payment</h2>
            <p className="mt-1 text-xs text-[#718078]">
              Disburse payment to <b className="text-[#173d2e]">{paymentModalSupplier.name}</b>. Outstanding: ₹{Math.round(paymentModalSupplier.balanceOutstanding || 0).toLocaleString()}
            </p>

            <form onSubmit={handleRecordPayment} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#45574f]">Payment Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-sm font-black text-[#173d2e]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#45574f]">Payment Method</label>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold"
                  >
                    <option value="NEFT">Bank NEFT</option>
                    <option value="RTGS">Bank RTGS</option>
                    <option value="UPI">Corporate UPI</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CASH">Petty Cash</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#45574f]">Reference / UTR Number</label>
                  <input
                    placeholder="e.g. UTR9018274"
                    value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#45574f]">Payment Memo / Notes</label>
                <input
                  placeholder="e.g. Invoice clearance"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafcf9] p-2.5 text-xs font-medium"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalSupplier(null)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-bold text-[#4c5f54]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy === 'record-pay'}
                  className="rounded-xl bg-[#173d2e] px-5 py-2.5 text-xs font-black text-white hover:bg-[#1f4e3c]"
                >
                  {busy === 'record-pay' ? 'Posting...' : 'Post Payment Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
