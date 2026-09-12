import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  KeyRound,
  LogOut,
  Power,
  RefreshCw,
  Search,
  Shield,
  Store,
  Trash2,
  Users,
  XCircle
} from 'lucide-react';
import { api, type ApiUser, type Role } from '../services/api';

interface Props {
  onLogout: () => void;
}

export function SuperAdminAccounts({ onLogout }: Props) {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<'all' | 'shopkeeper' | 'employee'>('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.adminStaff();
      setUsers(data);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Unable to load partner accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleToggleActive = async (user: ApiUser) => {
    setBusyId(user.id);
    try {
      await api.setPartnerActive(user.id, !user.active);
      showToast(`${user.name} is now ${!user.active ? 'Active' : 'Suspended'}`);
      await loadUsers();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Status update failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleResetPassword = async (user: ApiUser) => {
    if (!confirm(`Reset temporary password for ${user.name}?`)) return;
    setBusyId(user.id);
    try {
      const res = await api.resetPartnerPassword(user.id);
      alert(`Temporary password generated: ${res.tempPassword || 'Password123'}`);
      showToast(`Password reset for ${user.name}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Password reset failed');
    } finally {
      setBusyId(null);
    }
  };

  const filtered = users.filter(u => {
    const matchesRole =
      filterRole === 'all' ||
      (filterRole === 'shopkeeper' && (u.role === 'shopkeeper' || u.role === 'store_manager')) ||
      (filterRole === 'employee' && u.role === 'employee');
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search);
    return matchesRole && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#173d2e] text-xl text-[#d7ef8d]">
              👑
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#819087]">
                Super Admin Portal
              </div>
              <h1 className="heading text-2xl font-extrabold text-[#173d2e]">
                Partner & Staff Account Governance
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void loadUsers()}
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-xs font-extrabold text-[#315245] shadow-xs hover:bg-zinc-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#173d2e] px-4 py-2.5 text-xs font-extrabold text-white shadow-xs hover:bg-[#122e23]"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterRole('all')}
              className={`rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                filterRole === 'all' ? 'bg-[#173d2e] text-white' : 'bg-white text-[#52655b]'
              }`}
            >
              All Partners ({users.length})
            </button>
            <button
              onClick={() => setFilterRole('shopkeeper')}
              className={`rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                filterRole === 'shopkeeper' ? 'bg-[#173d2e] text-white' : 'bg-white text-[#52655b]'
              }`}
            >
              Shopkeepers (
              {users.filter(u => u.role === 'shopkeeper' || u.role === 'store_manager').length})
            </button>
            <button
              onClick={() => setFilterRole('employee')}
              className={`rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                filterRole === 'employee' ? 'bg-[#173d2e] text-white' : 'bg-white text-[#52655b]'
              }`}
            >
              Delivery Riders ({users.filter(u => u.role === 'employee').length})
            </button>
          </div>

          <div className="relative w-full max-w-xs">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8d9992]"
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or phone..."
              className="w-full rounded-2xl border border-black/10 bg-white py-2.5 pl-9 pr-4 text-xs font-semibold outline-none focus:border-[#6f9f83]"
            />
          </div>
        </div>

        {toast && (
          <div className="mt-4 rounded-2xl bg-[#173d2e] p-3 text-xs font-bold text-white">
            {toast}
          </div>
        )}

        {/* User table */}
        <div className="mt-5 overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-black/5 bg-[#fafbf8] font-extrabold text-[#7a8880]">
                <tr>
                  <th className="p-4">Partner Name</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Assigned Shop</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filtered.map(user => {
                  const isBusy = busyId === user.id;
                  return (
                    <tr key={user.id} className="hover:bg-[#fafbf8]">
                      <td className="p-4">
                        <div className="font-extrabold text-[#173d2e]">{user.name}</div>
                        <div className="text-[10px] text-[#8a968f] font-mono">{user.id}</div>
                      </td>
                      <td className="p-4">
                        <span className="rounded-full bg-[#edf3ee] px-2.5 py-1 text-[10px] font-black uppercase text-[#3c7358]">
                          {user.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-[#52655b]">
                        {user.shopId || 'Unassigned / Platform-wide'}
                      </td>
                      <td className="p-4">
                        <div className="text-[#52655b]">{user.email}</div>
                        <div className="text-[11px] text-[#8a968f]">{user.phone}</div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                            user.active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              user.active ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          {user.active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={isBusy}
                            onClick={() => void handleToggleActive(user)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
                              user.active
                                ? 'border border-red-200 text-red-600 hover:bg-red-50'
                                : 'border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {user.active ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            disabled={isBusy}
                            onClick={() => void handleResetPassword(user)}
                            className="rounded-xl border border-black/10 bg-[#fafbf8] px-3 py-1.5 text-xs font-bold text-[#52655b] hover:bg-zinc-100 disabled:opacity-50"
                          >
                            Reset Password
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-[#7d8c83]">
                      No partner accounts match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
