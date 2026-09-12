import { useState } from 'react';
import { Eye, Heart, Sparkles, User, X } from 'lucide-react';

export function SmartCustomerFeatures() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-2.5 text-xs font-black text-[#173d2e] shadow-lg backdrop-blur-xs border border-black/5 hover:bg-white"
        title="Partner Quick-View Mode"
      >
        <Sparkles size={15} className="text-[#3c7358]" />
        <span>STORE SIMULATOR</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf1ea] text-[#3c7358]">
                  <Eye size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#173d2e]">Store Front Simulator</h3>
                  <p className="text-[11px] text-[#78877f]">Quick commerce preview tools</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-[#52655b]">
              <p className="leading-relaxed">
                You are currently logged into an operational role (Shopkeeper, Rider, or Admin). The customer storefront is active in the background.
              </p>
              <div className="rounded-2xl bg-[#fafbf8] p-4 space-y-2 border border-black/5">
                <div className="font-bold text-[#173d2e]">Operational Checklist:</div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Real-time inventory levels are synchronized</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Express 30-minute delivery radius active</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Razorpay test payment gateway online</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    localStorage.setItem('freshcart_role', 'customer');
                    window.location.reload();
                  }}
                  className="w-full rounded-2xl bg-[#173d2e] py-3 text-center text-xs font-black text-white hover:bg-[#122e23]"
                >
                  Switch View to Customer Storefront
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
