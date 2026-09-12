import { useEffect, useState } from 'react';
import { Check, Copy, KeyRound, RefreshCw, Shield, Store, Users, X } from 'lucide-react';
import { api, type PartnerCredential } from '../services/api';

export function PartnerCredentialManager() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<'shopkeeper' | 'employee'>('shopkeeper');
  const [pool, setPool] = useState<PartnerCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadPool = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.partnerCredentials(kind);
      setPool(res.credentials);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load partner credentials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      void loadPool();
    }
  }, [open, kind]);

  const copyToClipboard = (slot: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(slot);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-2xl bg-[#d7ef8d] px-4 py-3 text-xs font-black text-[#10251b] shadow-xl hover:bg-[#c9e477]"
        title="Manage partner credential pool"
      >
        <KeyRound size={16} />
        <span>PARTNER KEYS</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="flex h-[85vh] w-full max-w-3xl flex-col rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf1ea] text-[#3c7358]">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#173d2e]">Partner Credential Pool</h3>
                  <p className="text-xs text-[#78877f]">
                    Pre-generated 22-digit login IDs and accounts for verified partners
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Kind Tabs */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setKind('shopkeeper')}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
                    kind === 'shopkeeper'
                      ? 'bg-[#173d2e] text-white'
                      : 'border border-black/5 bg-[#fafbf8] text-[#52655b] hover:bg-zinc-100'
                  }`}
                >
                  <Store size={14} /> Shopkeeper Pool
                </button>
                <button
                  onClick={() => setKind('employee')}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
                    kind === 'employee'
                      ? 'bg-[#173d2e] text-white'
                      : 'border border-black/5 bg-[#fafbf8] text-[#52655b] hover:bg-zinc-100'
                  }`}
                >
                  <Users size={14} /> Delivery Staff Pool
                </button>
              </div>

              <button
                onClick={() => void loadPool()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-1.5 text-xs font-bold text-[#52655b] hover:bg-zinc-50"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {error && (
              <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                {error}
              </div>
            )}

            {/* List */}
            <div className="mt-4 flex-1 overflow-y-auto rounded-2xl border border-black/5 bg-[#fafbf8]">
              {loading ? (
                <div className="flex h-40 items-center justify-center text-xs font-semibold text-[#819087]">
                  Loading credential pool...
                </div>
              ) : !pool.length ? (
                <div className="flex h-40 items-center justify-center text-xs font-semibold text-[#819087]">
                  No credentials loaded. Ensure MongoDB is connected.
                </div>
              ) : (
                <div className="divide-y divide-black/5">
                  {pool.map(item => {
                    const suffix = String(item.slot).padStart(4, '0');
                    const fullLoginId = `${item.baseLoginId}${suffix}`;
                    const isAssigned = Boolean(item.assignedToId);

                    return (
                      <div
                        key={item.slot}
                        className="flex flex-wrap items-center justify-between gap-3 p-3.5 hover:bg-white"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-12 items-center justify-center rounded-lg bg-[#eaf1ea] text-xs font-mono font-black text-[#173d2e]">
                            #{suffix}
                          </span>
                          <div>
                            <div className="font-mono text-xs font-bold text-[#203229]">
                              {fullLoginId}
                            </div>
                            <div className="mt-0.5 text-[10px] text-[#819087]">
                              {isAssigned ? (
                                <span className="font-bold text-amber-700">
                                  Assigned to application: {item.assignedToId}
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-semibold">Available for assignment</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                              isAssigned
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isAssigned ? 'Claimed' : 'Available'}
                          </span>
                          <button
                            onClick={() => copyToClipboard(item.slot, fullLoginId)}
                            className="flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2.5 py-1 text-xs font-semibold text-[#52655b] hover:bg-zinc-50"
                          >
                            {copied === item.slot ? (
                              <>
                                <Check size={12} className="text-emerald-600" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy size={12} /> Copy ID
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
