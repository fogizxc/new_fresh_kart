import React from 'react';
import { Truck, ShieldCheck, Zap, ArrowRight, Sparkles } from 'lucide-react';
import type { ApiProduct } from '../services/api';

interface BlinkitHeroProps {
  onShopNow: () => void;
  featuredProducts: ApiProduct[];
  onAddToCart: (id: string) => void;
  deliveryMinutes?: string;
}

export const BlinkitHero: React.FC<BlinkitHeroProps> = ({
  onShopNow,
  featuredProducts,
  onAddToCart,
  deliveryMinutes = '10-15 mins'
}) => {
  return (
    <div className="mx-auto max-w-[1500px] px-4 pt-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#173d2e] via-[#1b4837] to-[#0f281e] p-6 text-white shadow-xl sm:p-10 lg:p-12">
        {/* Decorative background glows */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-6 xl:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 backdrop-blur-md border border-white/15 text-xs font-bold text-[#d7ef8d]">
              <Zap size={15} className="text-[#d7ef8d]" />
              <span>Superfast Hyperlocal • Direct from Local Shopkeepers</span>
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-5xl leading-[1.1]">
              Daily Groceries & Essentials Delivered in{' '}
              <span className="text-[#d7ef8d] underline decoration-[#d7ef8d]/30 underline-offset-8">
                {deliveryMinutes}
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-emerald-100/90 sm:text-base">
              Order directly from authentic neighborhood grocers, kirana stores, and farm-fresh dairy counters.
              Zero warehouse middlemen, pure local freshness.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                onClick={onShopNow}
                className="flex items-center gap-2 rounded-2xl bg-[#d7ef8d] px-6 py-3.5 text-sm font-black text-[#173d2e] shadow-lg shadow-black/20 hover:bg-[#c9e672] transition-transform active:scale-95"
              >
                <span>Shop Neighborhood Picks</span>
                <ArrowRight size={17} />
              </button>

              <div className="flex items-center gap-3 text-xs text-white/80">
                <div className="flex items-center gap-1">
                  <Truck size={14} className="text-[#d7ef8d]" />
                  <span>Free above ₹499</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <ShieldCheck size={14} className="text-[#d7ef8d]" />
                  <span>Verified Quality</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Featured Product Highlights */}
          <div className="lg:col-span-6 xl:col-span-5">
            <div className="rounded-3xl bg-white/10 p-4 sm:p-5 backdrop-blur-lg border border-white/15 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs font-bold">
                <div className="flex items-center gap-1.5 text-[#d7ef8d]">
                  <Sparkles size={15} />
                  <span>Trending on Big Display</span>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] text-emerald-200">
                  Instant Stock
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                {featuredProducts.slice(0, 4).map(product => (
                  <div
                    key={product.id}
                    className="group relative flex flex-col justify-between rounded-2xl bg-white/15 p-3 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all text-white"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white/10 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-3xl">🥬</span>
                      )}
                      <span className="absolute bottom-1 right-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold">
                        {product.unit}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <p className="truncate text-xs font-black text-white">{product.name}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-sm font-black text-[#d7ef8d]">₹{product.sellingPrice}</span>
                        <button
                          onClick={() => onAddToCart(product.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-[#173d2e] font-black hover:bg-[#d7ef8d] transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
