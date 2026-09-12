import React from 'react';
import { Sparkles, TrendingUp, Zap, ThumbsUp, ShoppingBag, ArrowRight } from 'lucide-react';
import type { ApiProduct } from '../services/api';

interface BlinkitSuggestionsProps {
  products: ApiProduct[];
  onAddToCart: (id: string) => void;
  onBrowseCategory: (cat: string) => void;
}

export const BlinkitSuggestions: React.FC<BlinkitSuggestionsProps> = ({
  products,
  onAddToCart,
  onBrowseCategory
}) => {
  // Curated smart suggestions
  const morningEssentials = products.filter(p =>
    ['Dairy & Eggs', 'Pantry'].includes(p.category) || p.name.toLowerCase().includes('milk') || p.name.toLowerCase().includes('bread')
  );

  const freshGreensAndProduce = products.filter(p =>
    ['Vegetables', 'Fruits'].includes(p.category)
  );

  const quickMunchies = products.filter(p =>
    ['Snacks', 'Beverages'].includes(p.category)
  );

  return (
    <section className="mx-auto max-w-[1500px] px-4 pt-10 sm:px-6 lg:px-8">
      <div className="rounded-[32px] bg-gradient-to-r from-emerald-900 to-[#173d2e] p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d7ef8d] text-[#173d2e]">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Smart Suggestions & Daily Bundles
              </h3>
              <p className="text-xs text-emerald-200">
                Recommended by AI based on popular 15-minute quick delivery orders in your area
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold text-[#d7ef8d] backdrop-blur-sm">
              <TrendingUp size={14} /> High Frequency Combos
            </span>
          </div>
        </div>

        {/* Suggestion Rail 1: Breakfast & Morning Routine */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-[#d7ef8d]" />
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                Morning Routine (Milk, Bread & Protein)
              </h4>
            </div>
            <button
              onClick={() => onBrowseCategory('Dairy & Eggs')}
              className="text-xs font-bold text-[#d7ef8d] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {morningEssentials.slice(0, 4).map(p => (
              <div
                key={p.id}
                className="flex flex-col justify-between rounded-2xl bg-white/10 p-3 backdrop-blur-sm border border-white/10"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 overflow-hidden text-2xl">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      '🥛'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-white">{p.name}</p>
                    <p className="text-[10px] text-emerald-200">{p.unit}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
                  <span className="text-sm font-black text-[#d7ef8d]">₹{p.sellingPrice}</span>
                  <button
                    onClick={() => onAddToCart(p.id)}
                    className="flex items-center gap-1 rounded-xl bg-white px-2.5 py-1 text-xs font-black text-[#173d2e] hover:bg-[#d7ef8d]"
                  >
                    <ShoppingBag size={12} />
                    <span>+ Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestion Rail 2: Evening Tea & Snack Boosters */}
        <div className="mt-6 border-t border-white/10 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ThumbsUp size={16} className="text-[#d7ef8d]" />
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                Evening Munchies & Sips
              </h4>
            </div>
            <button
              onClick={() => onBrowseCategory('Snacks')}
              className="text-xs font-bold text-[#d7ef8d] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickMunchies.slice(0, 4).map(p => (
              <div
                key={p.id}
                className="flex flex-col justify-between rounded-2xl bg-white/10 p-3 backdrop-blur-sm border border-white/10"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 overflow-hidden text-2xl">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      '🍿'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-white">{p.name}</p>
                    <p className="text-[10px] text-emerald-200">{p.unit}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
                  <span className="text-sm font-black text-[#d7ef8d]">₹{p.sellingPrice}</span>
                  <button
                    onClick={() => onAddToCart(p.id)}
                    className="flex items-center gap-1 rounded-xl bg-white px-2.5 py-1 text-xs font-black text-[#173d2e] hover:bg-[#d7ef8d]"
                  >
                    <ShoppingBag size={12} />
                    <span>+ Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
