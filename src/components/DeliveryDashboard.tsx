import { useEffect, useState } from 'react';
import {
  Bike,
  CheckCircle2,
  Clock,
  ExternalLink,
  IndianRupee,
  MapPin,
  Navigation,
  Package,
  Phone,
  Power,
  RefreshCw,
  ShieldCheck,
  Truck,
  XCircle
} from 'lucide-react';
import { api, type ApiDeliveryQueueItem, type DeliveryStatus } from '../services/api';

interface Props {
  flash: (message: string) => void;
}

interface EarningsData {
  completedDeliveries: number;
  totalDistanceKm: number;
  totalEarnings: number;
  currentRatePerKm: number;
  entries: {
    orderId: string;
    distanceKm: number;
    ratePerKm: number;
    earning: number;
    deliveredAt?: string;
  }[];
}

export function DeliveryDashboard({ flash }: Props) {
  const [queue, setQueue] = useState<ApiDeliveryQueueItem[]>([]);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'earnings'>('queue');

  const loadData = async () => {
    setLoading(true);
    try {
      const [queueData, earningsData] = await Promise.allSettled([
        api.deliveryQueue(),
        fetch('/api/delivery/earnings', {
          headers: { Authorization: `Bearer ${localStorage.getItem('freshcart_token')}` }
        }).then(res => (res.ok ? res.json() : null))
      ]);

      if (queueData.status === 'fulfilled') {
        setQueue(queueData.value);
      }
      if (earningsData.status === 'fulfilled' && earningsData.value) {
        setEarnings(earningsData.value);
      }
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Unable to load delivery data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleStatusUpdate = async (orderId: string, nextStatus: DeliveryStatus) => {
    setBusyOrderId(orderId);
    try {
      await api.deliveryStatus(orderId, nextStatus);
      flash(`Order ${orderId} updated to ${nextStatus.replace(/_/g, ' ')}`);
      await loadData();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Status update failed');
    } finally {
      setBusyOrderId(null);
    }
  };

  const getNextAction = (item: ApiDeliveryQueueItem): { label: string; nextStatus: DeliveryStatus; color: string } | null => {
    const current = item.deliveryStatus || 'ASSIGNED';
    if (current === 'ASSIGNED') {
      return { label: 'Confirm Pickup from Store', nextStatus: 'PICKED_UP', color: 'bg-[#173d2e] hover:bg-[#122e23]' };
    }
    if (current === 'PICKED_UP') {
      return { label: 'Start Delivery Run', nextStatus: 'OUT_FOR_DELIVERY', color: 'bg-emerald-600 hover:bg-emerald-700' };
    }
    if (current === 'OUT_FOR_DELIVERY') {
      return { label: 'Mark Order Delivered', nextStatus: 'DELIVERED', color: 'bg-[#d7ef8d] text-[#10251b] hover:bg-[#c9e477]' };
    }
    return null;
  };

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#173d2e] px-3 py-1 text-xs font-bold text-[#d7ef8d]">
              <Bike size={14} /> Rider Portal
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-700'}`}>
              <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
              {isOnline ? 'ONLINE & ACTIVE' : 'OFFLINE'}
            </span>
          </div>
          <h1 className="heading mt-2 text-3xl font-extrabold text-[#173d2e]">Rider Dispatch Dashboard</h1>
          <p className="mt-1 text-sm text-[#74837a]">
            Deliver fresh groceries to local doorsteps in under 30 minutes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOnline(v => !v)}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-extrabold shadow-sm transition ${
              isOnline
                ? 'border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            <Power size={14} />
            {isOnline ? 'Go Offline' : 'Go Online'}
          </button>
          <button
            onClick={() => void loadData()}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#173d2e] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#122e23]"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf1ea] text-[#3c7358]">
            <Package size={20} />
          </div>
          <div className="mt-4 text-xs font-bold text-[#7d8c83]">Active Deliveries</div>
          <div className="mt-1 text-2xl font-extrabold text-[#173d2e]">{queue.length}</div>
          <div className="mt-1 text-xs text-[#8a968f]">Assigned to your queue</div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf1ea] text-[#3c7358]">
            <CheckCircle2 size={20} />
          </div>
          <div className="mt-4 text-xs font-bold text-[#7d8c83]">Total Completed</div>
          <div className="mt-1 text-2xl font-extrabold text-[#173d2e]">
            {earnings?.completedDeliveries ?? 0}
          </div>
          <div className="mt-1 text-xs text-[#8a968f]">Milestone target: 50 orders</div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf1ea] text-[#3c7358]">
            <IndianRupee size={20} />
          </div>
          <div className="mt-4 text-xs font-bold text-[#7d8c83]">Total Payout Earned</div>
          <div className="mt-1 text-2xl font-extrabold text-[#173d2e]">
            ₹{(earnings?.totalEarnings ?? 0).toFixed(0)}
          </div>
          <div className="mt-1 text-xs text-[#8a968f]">
            Current rate: ₹{earnings?.currentRatePerKm ?? 5}/km
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf1ea] text-[#3c7358]">
            <Navigation size={20} />
          </div>
          <div className="mt-4 text-xs font-bold text-[#7d8c83]">Distance Logged</div>
          <div className="mt-1 text-2xl font-extrabold text-[#173d2e]">
            {(earnings?.totalDistanceKm ?? 0).toFixed(1)} km
          </div>
          <div className="mt-1 text-xs text-[#8a968f]">Verified GPS travel</div>
        </div>
      </section>

      {/* Tabs */}
      <div className="mt-7 flex gap-2">
        <button
          onClick={() => setActiveTab('queue')}
          className={`rounded-xl px-4 py-2 text-xs font-extrabold transition ${
            activeTab === 'queue' ? 'bg-[#173d2e] text-white' : 'bg-white text-[#617169]'
          }`}
        >
          Delivery Queue ({queue.length})
        </button>
        <button
          onClick={() => setActiveTab('earnings')}
          className={`rounded-xl px-4 py-2 text-xs font-extrabold transition ${
            activeTab === 'earnings' ? 'bg-[#173d2e] text-white' : 'bg-white text-[#617169]'
          }`}
        >
          Earnings & History
        </button>
      </div>

      {/* Queue View */}
      {activeTab === 'queue' && (
        <section className="mt-5 space-y-4">
          {!queue.length ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
              <CheckCircle2 className="mx-auto text-emerald-500" size={36} />
              <h3 className="mt-3 text-lg font-extrabold text-[#173d2e]">Queue is clear!</h3>
              <p className="mt-1 text-sm text-[#7d8c83]">
                No pending orders right now. Stay online to receive automated local assignments.
              </p>
            </div>
          ) : (
            queue.map(item => {
              const action = getNextAction(item);
              const isBusy = busyOrderId === item.id;
              const deliveryStatus = item.deliveryStatus || 'ASSIGNED';

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-3xl border border-black/5 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/5 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#89958e]">{item.id}</span>
                        <span className="rounded-full bg-[#edf3ee] px-2.5 py-0.5 text-[10px] font-black uppercase text-[#47715a]">
                          {deliveryStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h3 className="mt-1 text-lg font-black text-[#173d2e]">
                        Order Total: ₹{item.total.toFixed(0)} • {item.items.length} item(s)
                      </h3>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-[#89958e]">Estimated Earnings</div>
                      <div className="text-xl font-black text-emerald-700">
                        ₹{item.earning ? item.earning.toFixed(2) : ((item.distanceKm || 3) * (item.ratePerKm || 5)).toFixed(2)}
                      </div>
                      <div className="text-[11px] font-semibold text-[#8a968f]">
                        {item.distanceKm || 3} km @ ₹{item.ratePerKm || 5}/km
                      </div>
                    </div>
                  </div>

                  {/* Order Details & Items */}
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-[#fafbf8] p-4 text-xs">
                      <div className="font-extrabold text-[#173d2e] flex items-center gap-1.5 mb-2">
                        <MapPin size={14} className="text-[#3c7358]" /> Drop Location
                      </div>
                      <p className="text-[#526159] leading-relaxed">
                        Assigned Shop: <span className="font-bold">{item.shopId}</span>
                      </p>
                      <p className="mt-1 text-[#526159]">
                        Payment Mode: <span className="font-bold">{item.paymentMethod}</span>
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#fafbf8] p-4 text-xs">
                      <div className="font-extrabold text-[#173d2e] flex items-center gap-1.5 mb-2">
                        <Package size={14} className="text-[#3c7358]" /> Items in Bag
                      </div>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {item.items.map((prod, idx) => (
                          <div key={idx} className="flex justify-between text-[#526159]">
                            <span>{prod.name}</span>
                            <span className="font-bold">× {prod.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#718078]">
                      <Clock size={14} /> Placed: {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    <div className="flex gap-2">
                      {action && (
                        <button
                          disabled={isBusy}
                          onClick={() => void handleStatusUpdate(item.id, action.nextStatus)}
                          className={`rounded-xl px-5 py-3 text-xs font-black text-white shadow-sm transition disabled:opacity-50 ${action.color}`}
                        >
                          {isBusy ? 'Updating...' : action.label}
                        </button>
                      )}
                      {deliveryStatus !== 'DELIVERED' && (
                        <button
                          disabled={isBusy}
                          onClick={() => void handleStatusUpdate(item.id, 'FAILED')}
                          className="rounded-xl border border-red-200 bg-white px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Report Issue
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      )}

      {/* Earnings View */}
      {activeTab === 'earnings' && (
        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="heading text-xl font-extrabold text-[#173d2e]">Payout Log & History</h2>
              <p className="mt-1 text-xs text-[#7d8c83]">
                Daily and cumulative rider payouts calculated automatically from GPS distances.
              </p>
            </div>
            <ShieldCheck className="text-emerald-600" size={24} />
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-black/5 bg-[#fafbf8] font-bold text-[#7a8880]">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Distance</th>
                  <th className="p-3">Applied Rate</th>
                  <th className="p-3">Payout</th>
                  <th className="p-3">Delivered At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {earnings?.entries.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-[#fcfdfa]">
                    <td className="p-3 font-bold text-[#173d2e]">{entry.orderId}</td>
                    <td className="p-3">{entry.distanceKm.toFixed(1)} km</td>
                    <td className="p-3">₹{entry.ratePerKm}/km</td>
                    <td className="p-3 font-black text-emerald-700">₹{entry.earning.toFixed(2)}</td>
                    <td className="p-3 text-[#7a8880]">
                      {entry.deliveredAt ? new Date(entry.deliveredAt).toLocaleString() : 'Recent'}
                    </td>
                  </tr>
                ))}
                {(!earnings?.entries || !earnings.entries.length) && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm text-[#7d8c83]">
                      No completed payouts logged yet. Complete orders from the queue to start earning!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
