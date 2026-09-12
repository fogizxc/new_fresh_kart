import React from 'react';

export type BlinkitCategory =
  | 'All'
  | 'Vegetables'
  | 'Fruits'
  | 'Dairy & Eggs'
  | 'Pantry'
  | 'Snacks'
  | 'Beverages'
  | 'Household';

interface BlinkitCategoryRailProps {
  selectedCategory: BlinkitCategory;
  onSelectCategory: (cat: BlinkitCategory) => void;
}

const CATEGORY_ITEMS: Array<{
  id: BlinkitCategory;
  label: string;
  emoji: string;
  color: string;
}> = [
  { id: 'All', label: 'All Items', emoji: '🛍️', color: 'from-slate-100 to-slate-200' },
  { id: 'Vegetables', label: 'Vegetables', emoji: '🥦', color: 'from-green-100 to-emerald-200' },
  { id: 'Fruits', label: 'Fresh Fruits', emoji: '🍎', color: 'from-amber-100 to-orange-200' },
  { id: 'Dairy & Eggs', label: 'Dairy & Eggs', emoji: '🥛', color: 'from-blue-100 to-cyan-200' },
  { id: 'Pantry', label: 'Atta & Pantry', emoji: '🌾', color: 'from-yellow-100 to-amber-200' },
  { id: 'Snacks', label: 'Munchies & Chips', emoji: '🍿', color: 'from-orange-100 to-rose-200' },
  { id: 'Beverages', label: 'Cold Drinks & Juice', emoji: '🥤', color: 'from-purple-100 to-indigo-200' },
  { id: 'Household', label: 'Cleaning & Home', emoji: '🧼', color: 'from-teal-100 to-emerald-200' }
];

export const BlinkitCategoryRail: React.FC<BlinkitCategoryRailProps> = ({
  selectedCategory,
  onSelectCategory
}) => {
  return (
    <section className="mx-auto max-w-[1500px] px-4 pt-8 sm:px-6 lg:px-8">
      <div className="mb-4">
        <h2 className="text-2xl font-black tracking-tight text-[#173d2e]">Shop by Category</h2>
        <p className="text-xs text-[#6e7f76]">
          Handpicked essentials catalogued for fast 15-minute quick delivery
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {CATEGORY_ITEMS.map(item => {
          const isSelected = selectedCategory === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectCategory(item.id)}
              className={`group flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-150 ${
                isSelected
                  ? 'border-[#173d2e] bg-[#173d2e] text-white shadow-md scale-[1.02]'
                  : 'border-slate-200/70 bg-white text-[#203229] hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl shadow-inner mb-2 transition-transform group-hover:scale-110 ${
                  isSelected ? 'bg-white/20' : item.color
                }`}
              >
                {item.emoji}
              </div>
              <span
                className={`text-xs font-black text-center truncate w-full ${
                  isSelected ? 'text-white' : 'text-[#173d2e]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
