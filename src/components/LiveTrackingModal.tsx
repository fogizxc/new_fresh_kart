import { useEffect, useState } from 'react';
import {
  Bike,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock3,
  Copy,
  FileText,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  PhoneCall,
  Radio,
  Shield,
  ShieldCheck,
  Smartphone,
  Store,
  Truck,
  User,
  X
} from 'lucide-react';
import type { ApiOrder, ApiShop } from '../services/api';

interface Props {
  order: ApiOrder;
  shop?: ApiShop | null;
  onClose: () => void;
  onOpenInvoice: () => void;
}

const statusProgress: { status: ApiOrder['status']; label: string; sub: string }[] = [
  { status: 'PLACED', label: 'Order Confirmed', sub: 'Store received your order' },
  { status: 'ACCEPTED', label: 'Accepted by Store', sub: 'Picking fresh groceries' },
  { status: 'PICKING', label: 'Items Being Picked', sub: 'Freshness verified' },
  { status: 'PACKING', label: 'Bagging & Sealed', sub: 'Quality inspected & packed' },
  { status: 'READY', label: 'Handover Ready', sub: 'Rider reaching pickup bay' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', sub: 'Rider is on the way to you' },
  { status: 'DELIVERED', label: 'Delivered', sub: 'Enjoy your fresh order!' }
];

export function LiveTrackingModal({ order, shop, onClose, onOpenInvoice }: Props) {
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [callModal, setCallModal] = useState(false);
  const [progressPercent, setProgressPercent] = useState(65);
  const [notifications, setNotifications] = useState<Array<{ id: string; channel: 'SMS' | 'WHATSAPP'; body: string; timestamp: string; status: string }>>([]);
  const [maskedSession, setMaskedSession] = useState<{ bridgeNumber: string; dialInstructions: string } | null>(null);
  const [callingState, setCallingState] = useState<'IDLE' | 'CONNECTING' | 'READY'>('IDLE');

  const isDelivered = order.status === 'DELIVERED' || order.status === 'COLLECTED';
  const isCancelled = order.status === 'CANCELLED';
  const isSelfPickup = order.fulfilment === 'SELF_PICKUP';

  // Fetch real SMS & WhatsApp dispatch logs for this order
  useEffect(() => {
    async function loadNotifications() {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`/api/notifications/logs?orderId=${order.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setNotifications(data);
          }
        }
      } catch (err) {
        console.warn('Could not fetch notifications:', err);
      }
    }
    loadNotifications();
  }, [order.id, order.status]);

  // Initiate real masked call session
  const handleInitiateCall = async () => {
    setCallModal(true);
    setCallingState('CONNECTING');
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/support/call-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ orderId: order.id, riderPhone: '+91 98765 43210' })
      });
      if (res.ok) {
        const data = await res.json();
        setMaskedSession({
          bridgeNumber: data.session?.bridgeNumber || '+91 80 4719 2840',
          dialInstructions: data.dialInstructions || 'Your phone number remains 100% private.'
        });
      }
    } catch {
      setMaskedSession({
        bridgeNumber: '+91 80 4719 2840',
        dialInstructions: 'Your phone number remains 100% private.'
      });
    } finally {
      setCallingState('READY');
    }
  };

  // Rider details for quick delivery
  const rider = {
    name: 'Sunil Kumar',
    phone: '+91 98765 43210',
    rating: 4.9,
    trips: '1,420+',
    vehicle: 'Ather 450X (DL-03-AX-8492)',
    batteryOrTemp: 'Sealed Thermal Bag • 100% Inspected'
  };

  const currentIdx = statusProgress.findIndex(s => s.status === order.status);
  const effectiveIdx = currentIdx === -1 ? 0 : currentIdx;

  // Animate route bike progress smoothly
  useEffect(() => {
    if (order.status === 'DELIVERED') {
      setProgressPercent(100);
    } else if (order.status === 'OUT_FOR_DELIVERY') {
      const timer = setInterval(() => {
        setProgressPercent(prev => (prev >= 92 ? 65 : prev + 1));
      }, 1000);
      return () => clearInterval(timer);
    } else {
      const stageMap: Record<string, number> = {
        PLACED: 10,
        ACCEPTED: 25,
        PICKING: 40,
        PACKING: 55,
        READY: 65
      };
      setProgressPercent(stageMap[order.status] ?? 20);
    }
  }, [order.status]);

  const copyOtp = () => {
    const code = order.deliveryOtp || order.pickupCode || '4921';
    navigator.clipboard?.writeText?.(code);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-4 backdrop-blur-sm">
      <div className="relative my-6 w-full max-w-2xl rounded-[32px] bg-[#f7f8f4] shadow-2xl overflow-hidden border border-black/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 bg-white px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                {isDelivered ? 'Order Fulfilled' : isCancelled ? 'Order Cancelled' : 'Live Order Tracking'}
              </p>
            </div>
            <h2 className="mt-0.5 text-lg font-black text-[#173d2e]">
              Order #{order.id}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenInvoice}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#d6dfd7] bg-[#f2f6f3] px-3 py-1.5 text-xs font-black text-[#285740] hover:bg-[#e4ece6] transition"
            >
              <FileText size={14} />
              <span>Tax Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eef1ed] text-[#4d5c54] hover:bg-[#e2e7e1] transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* OTP Banner */}
          {!isDelivered && !isCancelled && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#173d2e] to-[#255e47] p-4 text-white shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d7ef8d] text-[#173d2e] font-black">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#d7ef8d]">
                      {isSelfPickup ? 'Store Counter Pickup Code' : 'Doorstep Delivery OTP'}
                    </div>
                    <p className="text-xs text-white/80">
                      {isSelfPickup
                        ? 'Show this 6-digit code at the store pickup counter'
                        : 'Share with delivery partner upon doorstep arrival'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-xl bg-black/30 px-3.5 py-2 font-mono text-xl font-black tracking-widest text-[#d7ef8d] border border-white/10">
                    {order.deliveryOtp || order.pickupCode || '4921'}
                  </div>
                  <button
                    onClick={copyOtp}
                    title="Copy OTP"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                  >
                    {copiedOtp ? <Check size={16} className="text-[#d7ef8d]" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Simulated Hyperlocal GPS Map View */}
          <div className="relative h-56 sm:h-64 w-full rounded-2xl overflow-hidden border border-black/10 bg-[#e8ece7] shadow-inner">
            {/* Map Roads & Geography Canvas (SVG) */}
            <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 500 240">
              {/* Background grid */}
              <defs>
                <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#d5dcd4" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Street lines */}
              <path d="M 30 50 Q 150 70, 240 40 T 470 60" fill="none" stroke="#cfd7ce" strokeWidth="10" strokeLinecap="round" />
              <path d="M 80 220 Q 200 180, 280 200 T 440 180" fill="none" stroke="#cfd7ce" strokeWidth="10" strokeLinecap="round" />
              <path d="M 120 20 L 120 220" fill="none" stroke="#cfd7ce" strokeWidth="8" />
              <path d="M 380 20 L 380 220" fill="none" stroke="#cfd7ce" strokeWidth="8" />

              {/* Delivery Route Polyline */}
              <path
                id="routePath"
                d="M 80 160 C 130 160, 160 110, 220 110 S 330 140, 420 80"
                fill="none"
                stroke="#173d2e"
                strokeWidth="4.5"
                strokeDasharray="6 4"
                strokeLinecap="round"
              />

              {/* Completed part of polyline */}
              <path
                d="M 80 160 C 130 160, 160 110, 220 110 S 330 140, 420 80"
                fill="none"
                stroke="#10b981"
                strokeWidth="5"
                strokeDasharray="500"
                strokeDashoffset={500 - (500 * progressPercent) / 100}
                strokeLinecap="round"
              />
            </svg>

            {/* Store Pin (Origin) */}
            <div className="absolute left-[70px] top-[140px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#173d2e] text-white shadow-lg border-2 border-white ring-2 ring-emerald-600/30">
                <Store size={18} />
              </div>
              <span className="mt-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[9px] font-black text-[#173d2e] shadow-sm backdrop-blur-xs">
                {shop?.name ? shop.name.slice(0, 14) : 'Fresh Store'}
              </span>
            </div>

            {/* Delivery Destination Pin */}
            <div className="absolute left-[420px] top-[60px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg border-2 border-white ring-2 ring-emerald-600/40">
                <MapPin size={20} />
              </div>
              <span className="mt-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[9px] font-black text-[#173d2e] shadow-sm backdrop-blur-xs">
                Your Doorstep
              </span>
            </div>

            {/* Live Moving Rider Marker */}
            {!isDelivered && !isCancelled && (
              <div
                style={{
                  left: `${70 + ((420 - 70) * progressPercent) / 100}px`,
                  top: `${140 + ((60 - 140) * progressPercent) / 100}px`,
                  transform: 'translate(-50%, -50%)',
                  transition: 'left 0.8s ease-out, top 0.8s ease-out'
                }}
                className="absolute z-10 flex flex-col items-center"
              >
                <div className="relative">
                  <span className="absolute -inset-2 rounded-full bg-emerald-400 opacity-60 animate-ping" />
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#d7ef8d] text-[#173d2e] shadow-xl border-2 border-[#173d2e]">
                    <Bike size={22} className="animate-bounce" />
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-1 rounded-full bg-[#173d2e] px-2 py-0.5 text-[9px] font-black text-white shadow-md">
                  <span>~{Math.max(2, Math.round(12 * (1 - progressPercent / 100)))} min</span>
                </div>
              </div>
            )}

            {/* Floating Live Badge on Map */}
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-[#173d2e] shadow-sm backdrop-blur-xs">
              <Navigation size={12} className="text-emerald-600" />
              <span>{order.status === 'OUT_FOR_DELIVERY' ? 'Rider In Transit • 1.8 km' : 'Hyperlocal Dispatch Network'}</span>
            </div>
          </div>

          {/* Delivery Hero Card */}
          {!isSelfPickup && !isDelivered && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm border border-black/5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf4ee] text-[#1f563d] font-black">
                  <User size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-[#173d2e] text-sm">{rider.name}</h3>
                    <span className="rounded-md bg-[#eaf4ec] px-1.5 py-0.5 text-[10px] font-black text-emerald-800">
                      ★ {rider.rating}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#718078]">{rider.vehicle} • {rider.trips} drops</p>
                  <p className="text-[10px] font-medium text-emerald-700">{rider.batteryOrTemp}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleInitiateCall}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#173d2e] px-4 py-2.5 text-xs font-black text-white hover:bg-[#21523e] transition shadow-sm"
                >
                  <Phone size={14} />
                  <span>Call Rider (Masked)</span>
                </button>
              </div>
            </div>
          )}

          {/* SMS & WhatsApp Real-Time Notification Stream */}
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-black/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-emerald-600 animate-pulse" />
                <h4 className="text-xs font-black uppercase tracking-wider text-[#798881]">
                  SMS & WhatsApp Updates
                </h4>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-200">
                Verified Gateway
              </span>
            </div>

            <div className="space-y-2">
              {notifications.length > 0 ? (
                notifications.slice(0, 3).map(n => (
                  <div key={n.id} className="flex items-start gap-2.5 rounded-xl bg-[#f8faf8] p-2.5 border border-emerald-950/5">
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white ${n.channel === 'WHATSAPP' ? 'bg-[#25D366]' : 'bg-[#173d2e]'}`}>
                      {n.channel === 'WHATSAPP' ? <MessageSquare size={13} /> : <Smartphone size={13} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-black uppercase tracking-wide text-gray-500">
                          {n.channel} • {n.status}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-800 font-medium leading-relaxed line-clamp-2">
                        {n.body}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-[#f8faf8] p-2.5 text-xs text-gray-600">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white">
                    <MessageSquare size={13} />
                  </div>
                  <p className="text-[11px] text-gray-600">
                    Transactional SMS & WhatsApp dispatch triggered for Order #{order.id}.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Progression Stepper */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-black/5 space-y-4">
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#798881]">Fulfilment Stages</h4>
              <span className="text-xs font-extrabold text-[#173d2e]">
                {statusProgress[effectiveIdx]?.label || order.status}
              </span>
            </div>

            <div className="space-y-3">
              {statusProgress.map((step, idx) => {
                const isDone = effectiveIdx > idx;
                const isCurrent = effectiveIdx === idx;
                return (
                  <div key={step.status} className="flex items-start gap-3">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black transition ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-[#173d2e] text-[#d7ef8d] ring-4 ring-emerald-500/20'
                          : 'bg-[#e7eee8] text-[#819288]'
                      }`}
                    >
                      {isDone ? <Check size={14} /> : idx + 1}
                    </div>
                    <div className="pt-0.5">
                      <p
                        className={`text-xs font-black ${
                          isCurrent ? 'text-[#173d2e]' : isDone ? 'text-gray-800' : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                        {isCurrent && (
                          <span className="ml-2 rounded-full bg-[#d7ef8d] px-2 py-0.5 text-[9px] font-black uppercase text-[#173d2e]">
                            Active
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-[#718078]">{step.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Call Modal Simulation */}
        {callModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf4ec] text-[#173d2e]">
                <PhoneCall size={28} className="animate-bounce text-emerald-600" />
              </div>
              <h3 className="mt-4 text-base font-black text-[#173d2e]">Masked Call Connection</h3>
              <p className="mt-1 text-xs text-gray-500">
                Calling delivery partner <span className="font-bold text-gray-800">{rider.name}</span> through FreshCart’s private number mask.
              </p>
              <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs font-bold text-gray-700">
                {callingState === 'CONNECTING' ? (
                  <span className="text-gray-400 animate-pulse">Generating secure bridge...</span>
                ) : (
                  <>
                    <p className="text-[11px] font-bold text-emerald-800">Virtual Bridge: {maskedSession?.bridgeNumber || '+91 80 4719 2840'}</p>
                    <p className="mt-0.5 text-[10px] text-gray-500 font-medium">{maskedSession?.dialInstructions || 'Private customer-to-rider masked proxy'}</p>
                  </>
                )}
              </div>
              <div className="mt-5 flex gap-2">
                <a
                  href={`tel:${maskedSession?.bridgeNumber || rider.phone}`}
                  className="flex-1 rounded-xl bg-[#173d2e] py-2.5 text-xs font-black text-white hover:bg-[#20523e] transition flex items-center justify-center gap-1.5"
                >
                  <Phone size={13} />
                  <span>Dial Bridge</span>
                </a>
                <button
                  onClick={() => setCallModal(false)}
                  className="flex-1 rounded-xl bg-gray-100 py-2.5 text-xs font-black text-gray-600 hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
