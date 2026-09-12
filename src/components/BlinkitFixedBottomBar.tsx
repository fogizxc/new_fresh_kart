import React from 'react';
import { Home, Search, ShoppingBag, Store, User, Sparkles } from 'lucide-react';

export type BottomNavTab = 'home' | 'search' | 'merchants' | 'suggestions' | 'orders' | 'cart';

interface BlinkitFixedBottomBarProps {
  currentTab: BottomNavTab;
  onSelectTab: (tab: BottomNavTab) => void;
  cartCount: number;
  cartSubtotal: number;
  onOpenCart: () => void;
}

export const BlinkitFixedBottomBar: React.FC<BlinkitFixedBottomBarProps> = ({
  currentTab,
  onSelectTab,
  cartCount,
  cartSubtotal,
  onOpenCart
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      {/* Floating Cart Reminder Banner when items are in cart */}
      {cartCount > 0 && (
        <div className="bg-[#173d2e] px-4 py-2 text-white">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d7ef8d] text-[10px] font-black text-[#173d2e]">
                {cartCount}
              </span>
              <span className="text-xs font-bold">
                ₹{cartSubtotal.toFixed(0)} • Local Quick Delivery
              </span>
            </div>
            <button
              onClick={onOpenCart}
              className="flex items-center gap-1.5 rounded-full bg-[#d7ef8d] px-3 py-1 text-xs font-black text-[#173d2e] hover:bg-[#cbe675]"
            >
              <span>View Cart</span>
              <ShoppingBag size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Main Tab Bar */}
      <div className="mx-auto flex max-w-[1500px] items-center justify-around px-2 py-2">
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-extrabold transition-colors ${
            currentTab === 'home' ? 'text-[#173d2e]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home size={20} className={currentTab === 'home' ? 'stroke-[2.5]' : ''} />
          <span>Shop</span>
        </button>

        <button
          onClick={() => onSelectTab('search')}
          className={`flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-extrabold transition-colors ${
            currentTab === 'search' ? 'text-[#173d2e]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Search size={20} className={currentTab === 'search' ? 'stroke-[2.5]' : ''} />
          <span>Search</span>
        </button>

        <button
          onClick={() => onSelectTab('merchants')}
          className={`flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-extrabold transition-colors ${
            currentTab === 'merchants' ? 'text-[#173d2e]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Store size={20} className={currentTab === 'merchants' ? 'stroke-[2.5]' : ''} />
          <span>Merchants</span>
        </button>

        <button
          onClick={() => onSelectTab('suggestions')}
          className={`flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-extrabold transition-colors ${
            currentTab === 'suggestions' ? 'text-[#173d2e]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sparkles size={20} className={currentTab === 'suggestions' ? 'stroke-[2.5]' : ''} />
          <span>Suggestions</span>
        </button>

        <button
          onClick={() => onSelectTab('orders')}
          className={`flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-extrabold transition-colors ${
            currentTab === 'orders' ? 'text-[#173d2e]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User size={20} className={currentTab === 'orders' ? 'stroke-[2.5]' : ''} />
          <span>My Orders</span>
        </button>
      </div>
    </div>
  );
};
