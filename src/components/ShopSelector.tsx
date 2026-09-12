import React from 'react';
import { Store, Clock, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { ApiShop } from '../services/api';

interface ShopSelectorProps {
  shops: ApiShop[];
  selectedShopId: string | null;
  onSelectShop: (shopId: string) => void;
  cartItemCount: number;
}

export const ShopSelector: React.FC<ShopSelectorProps> = ({
  shops,
  selectedShopId,
  onSelectShop,
  cartItemCount
}) => {
  if (!shops || shops.length === 0) return null;

  return (
    <div className="mx-auto max-w-[1500px] px-4 pt-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white p-4 shadow-sm border border-emerald-950/5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-[#173d2e]">
              <Store size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#173d2e]">Choose Your Local Merchant</h2>
              <p className="text-[11px] text-[#718279]">
                Delivering from authentic neighborhood storekeepers within minutes
              </p>
            </div>
          </div>
          {cartItemCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-800 border border-amber-200">
              <AlertCircle size={14} />
              <span>Cart locked to current shop ({cartItemCount} items)</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => {
            const isSelected = selectedShopId === shop.id;
            const isOpen = shop.isOpen ?? true;
            const etaText = shop.eta?.displayText ?? '15-25 mins';
            const distanceText = shop.distanceKm != null ? `${shop.distanceKm} km away` : 'Nearby';

            return (
              <button
                key={shop.id}
                onClick={() => onSelectShop(shop.id)}
                className={`relative flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-[#173d2e] bg-emerald-50/50 shadow-sm ring-1 ring-[#173d2e]'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-[#173d2e]">{shop.name}</span>
                    {isSelected && (
                      <CheckCircle2 size={16} className="text-[#173d2e] shrink-0" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      isOpen
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isOpen ? 'Open Now' : 'Closed'}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-1 text-[11px] text-[#6d7e75]">
                  <MapPin size={12} className="shrink-0" />
                  <span className="truncate">{shop.address}</span>
                </div>

                <div className="mt-2.5 flex w-full items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-semibold text-[#485950]">
                  <div className="flex items-center gap-1">
                    <Clock size={13} className="text-[#3b7a5d]" />
                    <span>{etaText}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{distanceText}</span>
                  {shop.rating != null && (
                    <span className="text-[10px] font-bold text-amber-700">
                      ★ {shop.rating} ({shop.reviewCount ?? 0})
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
