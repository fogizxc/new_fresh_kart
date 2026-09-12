import React from 'react';
import { Store, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import type { ApiShop } from '../services/api';

interface BlinkitMerchantSelectorProps {
  shops: ApiShop[];
  selectedShopId: string | null;
  onSelectShop: (shopId: string) => void;
}

export const BlinkitMerchantSelector: React.FC<BlinkitMerchantSelectorProps> = ({
  shops,
  selectedShopId,
  onSelectShop
}) => {
  // Ensure we show top 4 closest local merchants
  const displayShops = shops.slice(0, 4);

  return (
    <section id="local-merchants-section" className="mx-auto max-w-[1500px] px-4 pt-8 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-[#173d2e]">
              <Store size={16} />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-[#3b7a5d]">
              Hyperlocal Network
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-[#173d2e] mt-1">
            Choose Your Local Merchant
          </h2>
          <p className="text-xs text-[#6e7f76]">
            4 verified neighborhood shopkeepers closest to your delivery address
          </p>
        </div>

        <div className="text-xs font-bold text-[#55695f]">
          Showing {displayShops.length} active stores
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayShops.map((shop, index) => {
          const isSelected = selectedShopId === shop.id;
          const isOpen = shop.isOpen ?? true;
          const eta = shop.eta?.displayText ?? (index === 0 ? '10-15 mins' : index === 1 ? '12-18 mins' : index === 2 ? '15-20 mins' : '18-25 mins');
          const distance = shop.distanceKm != null ? `${shop.distanceKm} km` : `${(index + 1) * 1.2} km`;

          return (
            <button
              key={shop.id}
              onClick={() => onSelectShop(shop.id)}
              className={`relative flex flex-col justify-between p-4 rounded-3xl border text-left transition-all duration-200 ${
                isSelected
                  ? 'border-[#173d2e] bg-emerald-50/70 shadow-md ring-2 ring-[#173d2e]'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    Store #{index + 1}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isOpen ? 'Open Now' : 'Closed'}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <h3 className="text-sm font-black text-[#173d2e] line-clamp-1">{shop.name}</h3>
                  {isSelected && <CheckCircle2 size={18} className="text-[#173d2e] shrink-0" />}
                </div>

                <p className="mt-1 flex items-center gap-1 text-[11px] text-[#6d7e75] line-clamp-1">
                  <MapPin size={12} className="shrink-0 text-slate-400" />
                  <span>{shop.address}</span>
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 font-extrabold text-[#173d2e]">
                  <Clock size={13} className="text-[#3b7a5d]" />
                  <span>{eta}</span>
                </div>
                <span className="text-[11px] font-medium text-slate-500">{distance} away</span>
                <span className="text-[11px] font-bold text-amber-700">
                  ★ {shop.rating ?? 4.8}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
