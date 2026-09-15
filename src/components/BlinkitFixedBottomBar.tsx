import React from 'react';
import { Home, Store, CalendarSync, User, Menu, ShieldCheck } from 'lucide-react';

export type BottomNavTab = 'home' | 'merchants' | 'subscriptions' | 'orders' | 'menu' | 'super-admin';

interface BlinkitFixedBottomBarProps {
  currentTab: BottomNavTab;
  onSelectTab: (tab: BottomNavTab) => void;
  cartCount: number;
  cartSubtotal: number;
  onOpenCart: () => void;
  showSuperAdmin?: boolean;
}

export const BlinkitFixedBottomBar: React.FC<BlinkitFixedBottomBarProps> = ({
  currentTab,
  onSelectTab,
  cartCount,
  cartSubtotal,
  onOpenCart,
  showSuperAdmin = false
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      {cartCount > 0 && (
        <div className="bg-[#173d2e] px-4 py-2 text-white">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d7ef8d] text-[10px] font-black text-[#173d2e]">{cartCount}</span>
              <span className="text-xs font-bold">₹{cartSubtotal.toFixed(0)} • Local Quick Delivery</span>
            </div>
            <button onClick={onOpenCart} className="flex items-center gap-1.5 rounded-full bg-[#d7ef8d] px-3.5 py-1 text-xs font-black text-[#173d2e] hover:bg-[#cbe675] cursor-pointer">View Cart</button>
          </div>
        </div>
      )}
      <div className="mx-auto flex max-w-[1500px] items-center justify-around px-2 py-2">
        <button onClick={() => onSelectTab('home')} className={`flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-extrabold transition-colors cursor-pointer ${currentTab === 'home' ? 'text-[#173d2e]' : 'text-slate-400 hover:text-slate-600'}`}><Home size={20} /><span>Shop</span></button>
        <button onClick={() => onSelectTab('merchants')} className={`flex flex-col items-center gap-1 px-2 sm:px-3 py-1 text-[11px] font-extrabold transition-colors cursor-pointer ${currentTab === 'merchants' ? 'text-[#173d2e]' : 'text-slate-400 hover:text-slate-600'}`}><Store size={20} /><span>Merchants</span></button>
        <button onClick={() => onSelectTab('subscriptions')} className={`flex flex-col items-center gap-1 px-2 sm:px-3 py-1 text-[11px] font-extrabold transition-colors cursor-pointer ${currentTab === 'subscriptions' ? 'text-[#173d2e]' : 'text-slate-400 hover:text-slate-600'}`}><CalendarSync size={20} /><span className="hidden sm:inline">Daily Subscription</span><span className="sm:hidden">Daily Sub</span></button>
        <button onClick={() => onSelectTab('orders')} className={`flex flex-col items-center gap-1 px-2 sm:px-3 py-1 text-[11px] font-extrabold transition-colors cursor-pointer ${currentTab === 'orders' ? 'text-[#173d2e]' : 'text-slate-400 hover:text-slate-600'}`}><User size={20} /><span>My Orders</span></button>
        {showSuperAdmin && <button onClick={() => onSelectTab('super-admin')} className={`flex flex-col items-center gap-1 px-2 sm:px-3 py-1 text-[11px] font-extrabold transition-colors cursor-pointer ${currentTab === 'super-admin' ? 'text-[#173d2e]' : 'text-slate-400 hover:text-slate-600'}`}><ShieldCheck size={20} /><span>Super Admin</span></button>}
        <button onClick={() => onSelectTab('menu')} className={`flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-extrabold transition-colors cursor-pointer ${currentTab === 'menu' ? 'text-[#173d2e]' : 'text-slate-400 hover:text-slate-600'}`}><Menu size={20} /><span>Menu</span></button>
      </div>
    </div>
  );
};
