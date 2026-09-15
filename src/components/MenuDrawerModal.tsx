import React from 'react';
import { X, ChevronRight } from 'lucide-react';

interface MenuDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSubscriptions: () => void;
  onOpenRecipes: () => void;
  onOpenQuickList: () => void;
  onOpenMerchants: () => void;
  onOpenOrders: () => void;
  onOpenLocation?: () => void;
}

export const MenuDrawerModal: React.FC<MenuDrawerModalProps> = ({
  isOpen,
  onClose,
  onOpenSubscriptions,
  onOpenRecipes,
  onOpenQuickList,
  onOpenMerchants,
  onOpenOrders,
  onOpenLocation
}) => {
  if (!isOpen) return null;

  const workableFeatures = [
    {
      id: 'subscriptions',
      title: 'Daily Subscriptions',
      detail: 'Set up recurring morning deliveries for fresh milk, eggs, bakery, and pantry staples by 6:30 AM.',
      action: () => {
        onClose();
        onOpenSubscriptions();
      }
    },
    {
      id: 'recipes',
      title: '1-Click Recipe Bundles',
      detail: 'Cook delicious homemade dishes. Add all curated, pre-portioned ingredients straight to your cart in one tap.',
      action: () => {
        onClose();
        onOpenRecipes();
      }
    },
    {
      id: 'quicklist',
      title: 'Smart Quick-List & Voice',
      detail: 'Paste your shopping notes directly from WhatsApp or dictate items by voice to match catalog products instantly.',
      action: () => {
        onClose();
        onOpenQuickList();
      }
    },
    {
      id: 'orders',
      title: 'My Orders & Live Tracking',
      detail: 'Track real-time rider dispatch, view active order statuses, and review your previous grocery receipts.',
      action: () => {
        onClose();
        onOpenOrders();
      }
    },
    {
      id: 'merchants',
      title: 'Neighborhood Merchants',
      detail: 'Discover verified local kirana stores, fresh fruit vendors, and organic markets nearby in your sector.',
      action: () => {
        onClose();
        onOpenMerchants();
      }
    }
  ];

  if (onOpenLocation) {
    workableFeatures.push({
      id: 'location',
      title: 'Change Delivery Address',
      detail: 'Update your street address, apartment flat number, or pin your live GPS location for 15-min delivery.',
      action: () => {
        onClose();
        onOpenLocation();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fadeIn">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-over Drawer Menu */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h3 className="text-lg font-black text-[#173d2e]">Menu</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* BRIEF DETAIL ON TOP */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#173d2e] mb-1">
              Quick Services & Features
            </h4>
            <p className="text-xs leading-relaxed text-slate-600">
              Access all automated delivery options, quick cooking kits, smart list parsing, and order tracking services below. Select any option to get started immediately.
            </p>
          </div>

          {/* WORKABLE FEATURES UNDERNEATH WITH SIMPLE TEXT & DETAILS INSIDE THE BUTTON */}
          <div className="space-y-3">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              All Available Features
            </span>

            <div className="space-y-2.5">
              {workableFeatures.map(feature => (
                <button
                  key={feature.id}
                  type="button"
                  onClick={feature.action}
                  className="group flex w-full items-start justify-between rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#173d2e] hover:bg-emerald-50/40 hover:shadow-xs active:scale-[0.99] cursor-pointer"
                >
                  <div className="pr-3">
                    <h5 className="text-sm font-black text-[#173d2e] group-hover:text-emerald-900 transition-colors">
                      {feature.title}
                    </h5>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500 group-hover:text-slate-700 transition-colors">
                      {feature.detail}
                    </p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="mt-1 text-slate-400 group-hover:text-[#173d2e] group-hover:translate-x-0.5 transition shrink-0"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
