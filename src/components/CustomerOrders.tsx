import { useEffect, useState } from 'react';
import { Check, ChevronRight, Clock3, FileText, Gift, MapPin, Package, RotateCcw, ShieldCheck, Truck, X } from 'lucide-react';
import { api, type ApiOrder, type ApiShop, type OrderStatus } from '../services/api';
import { addItemsToCart } from '../services/cart';
import { LiveTrackingModal } from './LiveTrackingModal';
import { GstInvoiceModal } from './GstInvoiceModal';

const steps: { status: OrderStatus; label: string }[] = [
  { status: 'PLACED', label: 'Order placed' },
  { status: 'ACCEPTED', label: 'Store accepted' },
  { status: 'PICKING', label: 'Picking items' },
  { status: 'PACKING', label: 'Packed' },
  { status: 'READY', label: 'Ready for delivery' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { status: 'DELIVERED', label: 'Delivered' },
];

const rank = (status: OrderStatus) => steps.findIndex(s => s.status === status);

function statusLabel(status: OrderStatus) {
  return status === 'OUT_FOR_DELIVERY' ? 'Out for delivery' : status.replaceAll('_', ' ').toLowerCase().replace(/(^| )\S/g, x => x.toUpperCase());
}

export function CustomerOrders({ flash }: { flash: (message: string) => void }) {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [selected, setSelected] = useState<ApiOrder | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<ApiOrder | null>(null);
  const [shops, setShops] = useState<ApiShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [reward, setReward] = useState<{ points: number; spent: number; orders: number } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [orderData, rewardData, shopData] = await Promise.all([
        api.customerOrders(),
        api.rewards().catch(() => null),
        api.shops().catch(() => [])
      ]);
      setOrders(orderData);
      setReward(rewardData);
      setShops(shopData);
      if (selected) setSelected(orderData.find(o => o.id === selected.id) ?? selected);
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Unable to load your orders');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    void load();
    const timer = setInterval(() => {
      // Check if there are active (in-transit/processing) orders
      const hasActiveOrders = orders.some(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'COLLECTED');
      if (hasActiveOrders || selected) {
        api.customerOrders().then(data => {
          setOrders(data);
          if (selected) setSelected(data.find(o => o.id === selected.id) ?? selected);
        }).catch(() => {});
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [selected?.id, orders.length]);

  const reorder = async (order: ApiOrder) => {
    setBusy(order.id); setUnavailable([]);
    try {
      const result = await api.reorder(order.id);
      if (result.unavailable.length) {
        setUnavailable(result.unavailable);
      }
      if (result.items.length) {
        addItemsToCart(result.items);
        flash(`${result.items.length} item${result.items.length > 1 ? 's' : ''} added to cart${result.unavailable.length ? ` · ${result.unavailable.length} unavailable` : ''}`);
      } else if (result.unavailable.length) {
        flash(`${result.unavailable.length} item${result.unavailable.length > 1 ? 's are' : ' is'} unavailable`);
      } else {
        flash('This order has no available items to reorder');
      }
    } catch (e) { flash(e instanceof Error ? e.message : 'Reorder failed'); }
    finally { setBusy(''); }
  };

  if (loading) return <section className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 lg:px-8"><div className="rounded-3xl bg-white p-8 text-sm font-semibold text-[#718078] shadow-sm">Loading your orders…</div></section>;

  return <section className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#819087]">Your account</p><h2 className="heading mt-1 text-3xl font-extrabold text-[#173d2e]">My orders</h2><p className="mt-1 text-sm text-[#718078]">Track deliveries, review past purchases and reorder in seconds.</p></div>
      <div className="rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#52655b] shadow-sm">{orders.length} order{orders.length === 1 ? '' : 's'}</div>
    </div>
    {!orders.length ? <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm"><Package className="mx-auto text-[#6d947d]" size={34}/><h3 className="mt-3 font-extrabold text-[#173d2e]">No orders yet</h3><p className="mt-1 text-sm text-[#7a8881]">Your completed purchases will appear here.</p></div> :
      <div className="mt-6 grid gap-4 lg:grid-cols-2">{orders.map(order => {
        const active = order.status !== 'DELIVERED' && order.status !== 'CANCELLED';
        const cancellable = order.status === 'PLACED' || order.status === 'ACCEPTED';
        return <article key={order.id} className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div><div className="text-xs font-bold text-[#89958e]">{order.id}</div><h3 className="mt-1 font-extrabold text-[#173d2e]">₹{order.total.toFixed(0)} · {order.items.length} item{order.items.length === 1 ? '' : 's'}</h3></div><span className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${order.status === 'CANCELLED' ? 'bg-[#fff0f0] text-[#a34f4f]' : 'bg-[#eaf3eb] text-[#3c7358]'}`}>{statusLabel(order.status)}</span></div>
          <div className="mt-4 rounded-2xl bg-[#f7f8f3] p-4"><div className="flex items-center gap-2 text-xs font-bold text-[#64736b]"><Clock3 size={15}/> {new Date(order.createdAt).toLocaleString()}</div><div className="mt-4 flex items-center gap-1">{steps.slice(0, 7).map((step, index) => <div key={step.status} className={`h-1.5 flex-1 rounded-full ${rank(order.status) >= index && order.status !== 'CANCELLED' ? 'bg-[#4f8a69]' : 'bg-[#dce2dc]'}`} />)}</div><div className="mt-2 flex justify-between text-[9px] font-bold text-[#7c8982]"><span>Placed</span><span>Delivery</span><span>Done</span></div></div>
          <div className="mt-4 grid grid-cols-2 gap-2">{order.items.slice(0, 4).map(item => <div key={`${order.id}-${item.productId}`} className="rounded-xl bg-[#fafbf8] px-3 py-2 text-xs font-semibold text-[#526159]">{item.name} × {item.quantity}</div>)}</div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-3">
            <div className="flex items-center gap-2">
              {order.deliveryOtp ? (
                <div className="flex items-center gap-1.5 rounded-lg bg-[#eaf4ec] px-2.5 py-1 text-[11px] font-black text-[#173d2e] border border-[#cfe3d3]">
                  <ShieldCheck size={13} className="text-emerald-700" />
                  <span>Doorstep OTP: <strong className="font-mono">{order.deliveryOtp}</strong></span>
                </div>
              ) : order.pickupCode ? (
                <div className="flex items-center gap-1.5 rounded-lg bg-[#eaf4ec] px-2.5 py-1 text-[11px] font-black text-[#173d2e] border border-[#cfe3d3]">
                  <ShieldCheck size={13} className="text-emerald-700" />
                  <span>Pickup: <strong className="font-mono">{order.pickupCode}</strong></span>
                </div>
              ) : null}
            </div>
            <button
              onClick={() => setInvoiceOrder(order)}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#315245] hover:text-[#173d2e] underline decoration-dotted"
            >
              <FileText size={13} />
              <span>Tax Invoice</span>
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={() => { setSelected(order); setUnavailable([]); }} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#173d2e] px-4 py-3 text-xs font-extrabold text-white"><Truck size={15}/> {active ? 'Track live order' : 'View order'} <ChevronRight size={14}/></button>
            {cancellable && (
              confirmCancelId === order.id ? (
                <div className="flex items-center gap-1.5 rounded-xl bg-[#fff0f0] p-1 border border-[#f0d8d8]">
                  <span className="px-2 text-[11px] font-bold text-[#9a5555]">Confirm?</span>
                  <button
                    onClick={async () => {
                      setConfirmCancelId(null);
                      setBusy(order.id);
                      try {
                        await api.cancelOrder(order.id);
                        flash('Order cancelled');
                        await load();
                      } catch (e) {
                        flash(e instanceof Error ? e.message : 'Unable to cancel order');
                      } finally {
                        setBusy('');
                      }
                    }}
                    disabled={busy === order.id}
                    className="rounded-lg bg-[#9a5555] px-2.5 py-1.5 text-xs font-extrabold text-white hover:bg-[#854545]"
                  >
                    Yes, Cancel
                  </button>
                  <button
                    onClick={() => setConfirmCancelId(null)}
                    className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-[#64736b] hover:bg-[#f0f2f0]"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmCancelId(order.id)}
                  disabled={busy === order.id}
                  className="flex items-center justify-center gap-1 rounded-xl border border-[#f0d8d8] px-4 py-3 text-xs font-extrabold text-[#9a5555] disabled:opacity-50 hover:bg-[#fff7f7]"
                >
                  <X size={14}/> {busy === order.id ? 'Cancelling…' : 'Cancel'}
                </button>
              )
            )}
            <button onClick={() => void reorder(order)} disabled={busy === order.id} className="flex items-center justify-center gap-1 rounded-xl border border-[#dce5dd] px-4 py-3 text-xs font-extrabold text-[#315245] disabled:opacity-50"><RotateCcw size={14}/> {busy === order.id ? 'Working…' : 'Reorder'}</button>
          </div>
        </article>;
      })}</div>}

    {selected && (
      <LiveTrackingModal
        order={selected}
        shop={shops.find(s => s.id === selected.shopId)}
        onClose={() => setSelected(null)}
        onOpenInvoice={() => setInvoiceOrder(selected)}
      />
    )}

    {invoiceOrder && (
      <GstInvoiceModal
        order={invoiceOrder}
        shop={shops.find(s => s.id === invoiceOrder.shopId)}
        onClose={() => setInvoiceOrder(null)}
      />
    )}
  </section>;
}
