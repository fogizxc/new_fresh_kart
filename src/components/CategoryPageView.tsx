import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Store,
  ShoppingBag,
  Heart,
  Plus,
  Minus,
  SlidersHorizontal,
  Sparkles,
  MapPin,
  Check,
  ChevronDown
} from 'lucide-react';
import type { ApiProduct, ApiShop } from '../services/api';
import { BLINKIT_GRID_CATEGORIES } from './BlinkitCategoryRail';

interface CategoryPageViewProps {
  categoryName: string;
  onBack: () => void;
  onSelectCategory: (categoryName: string) => void;
  products: ApiProduct[];
  shops: ApiShop[];
  selectedShopId: string;
  onSelectShop: (shopId: string) => void;
  cart: Record<string, number>;
  liked: string[];
  onLike: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  onUpdateQuantity?: (productId: string, qty: number) => void;
  onOpenCart: () => void;
  subtotal: number;
  cartCount: number;
}

// Category fallback emojis for non-image items
const CATEGORY_EMOJIS: Record<string, string> = {
  Fruits: '🥭',
  Vegetables: '🥬',
  'Dairy & Eggs': '🥛',
  Pantry: '🍞',
  Snacks: '🥜',
  Beverages: '🥤',
  Household: '🧼'
};

// Category mapping helper
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Fruits & Vegetables': ['Fruits', 'Vegetables', 'tomato', 'potato', 'onion', 'apple', 'banana', 'spinach', 'coriander', 'lemon', 'orange'],
  'Dairy, Bread & Eggs': ['Dairy & Eggs', 'Pantry', 'milk', 'bread', 'egg', 'paneer', 'butter', 'curd', 'cheese', 'yogurt', 'amul'],
  'Cold Drinks & Juices': ['Beverages', 'cola', 'juice', 'soda', 'drink', 'water', 'pepsi', 'coke', 'thums', 'sprite', 'fanta', 'energy'],
  'Snacks & Munchies': ['Snacks', 'chips', 'munchies', 'namkeen', 'bhujia', 'crisps', 'popcorn', 'lays', 'kurkure', 'peanut'],
  'Breakfast & Instant Food': ['Pantry', 'Snacks', 'noodle', 'maggi', 'oats', 'cereal', 'cornflakes', 'poha', 'upma', 'pasta', 'muesli'],
  'Sweet Tooth': ['Snacks', 'Dairy & Eggs', 'chocolate', 'sweet', 'ice cream', 'dessert', 'candy', 'halwa', 'gulab', 'cadbury', 'cookie'],
  'Bakery & Biscuits': ['Pantry', 'Snacks', 'biscuit', 'cookie', 'rusk', 'toast', 'cake', 'bakery', 'oreo', 'parle', 'bourbon'],
  'Tea, Coffee & Milk Drinks': ['Beverages', 'Pantry', 'Dairy & Eggs', 'tea', 'coffee', 'chai', 'horlicks', 'bournvita', 'nescafe', 'bru', 'green tea'],
  'Atta, Rice & Dal': ['Pantry', 'atta', 'flour', 'rice', 'dal', 'pulse', 'wheat', 'chana', 'rajma', 'basmati', 'urad', 'moong', 'toor'],
  'Masala, Oil & More': ['Pantry', 'oil', 'masala', 'spice', 'salt', 'sugar', 'ghee', 'mustard', 'turmeric', 'chilli', 'jeera', 'hing'],
  'Sauces & Spreads': ['Pantry', 'ketchup', 'sauce', 'mayo', 'spread', 'jam', 'peanut butter', 'honey', 'chutney', 'dip'],
  'Chicken, Meat & Fish': ['Pantry', 'Dairy & Eggs', 'chicken', 'meat', 'fish', 'egg', 'prawn', 'mutton'],
  'Organic & Healthy Living': ['Pantry', 'Fruits', 'Vegetables', 'organic', 'healthy', 'honey', 'jaggery', 'seeds', 'nuts', 'almond', 'dry fruits'],
  'Baby Care': ['Household', 'Dairy & Eggs', 'baby', 'diaper', 'wipes', 'cerelac', 'lotion'],
  'Pharma & Wellness': ['Household', 'balm', 'wellness', 'bandage', 'vitamin', 'tablet', 'cough', 'antiseptic', 'dettol'],
  'Cleaning Essentials': ['Household', 'cleaner', 'detergent', 'soap', 'dishwash', 'harpic', 'surf', 'vim', 'floor', 'bleach'],
  'Home & Office': ['Household', 'battery', 'foil', 'tissue', 'bulb', 'tape', 'freshener', 'notebook', 'pen'],
  'Personal Care': ['Household', 'shampoo', 'paste', 'brush', 'soap', 'deodorant', 'face wash', 'cream', 'razor', 'colgate'],
  'Pet Care': ['Pantry', 'Household', 'pedigree', 'whiskas', 'dog', 'cat', 'pet', 'kibble'],
  'Paan Corner': ['Snacks', 'Beverages', 'paan', 'mukhwas', 'mint', 'soda', 'lighter']
};

export const CategoryPageView: React.FC<CategoryPageViewProps> = ({
  categoryName,
  onBack,
  onSelectCategory,
  products,
  shops,
  selectedShopId,
  onSelectShop,
  cart,
  liked,
  onLike,
  onAddToCart,
  onUpdateQuantity,
  onOpenCart,
  subtotal,
  cartCount
}) => {
  const [internalQuery, setInternalQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recommended' | 'price-asc' | 'price-desc' | 'discount'>('recommended');
  const [showAllStores, setShowAllStores] = useState(false);

  // Find category artwork if available
  const categoryMeta = useMemo(() => {
    return BLINKIT_GRID_CATEGORIES.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
  }, [categoryName]);

  const activeShop = useMemo(() => {
    return shops.find(s => s.id === selectedShopId) || shops[0];
  }, [shops, selectedShopId]);

  // Matching logic
  const categoryProducts = useMemo(() => {
    const isAll = categoryName === 'All';
    const keywords = CATEGORY_KEYWORDS[categoryName] || [categoryName];

    let list = products.filter(p => {
      // Store filter
      if (!showAllStores && selectedShopId && p.shopId !== selectedShopId) {
        return false;
      }

      if (isAll) return true;

      // Check direct category match
      if (p.category === categoryName) return true;

      // Check keywords match
      const pName = p.name.toLowerCase();
      const pCat = p.category.toLowerCase();

      const matchedKeyword = keywords.some(k => {
        const lowerK = k.toLowerCase();
        return pCat === lowerK || pName.includes(lowerK);
      });

      return matchedKeyword;
    });

    // If active store has fewer than 2 items, and user didn't explicitly toggle showAllStores,
    // fallback gracefully to showing all neighborhood stores' items for this category
    if (list.length < 2 && !showAllStores && selectedShopId) {
      const allStoresList = products.filter(p => {
        if (isAll) return true;
        if (p.category === categoryName) return true;
        const pName = p.name.toLowerCase();
        const pCat = p.category.toLowerCase();
        return keywords.some(k => {
          const lowerK = k.toLowerCase();
          return pCat === lowerK || pName.includes(lowerK);
        });
      });
      if (allStoresList.length > list.length) {
        list = allStoresList;
      }
    }

    // Filter by internal search query
    if (internalQuery.trim()) {
      const q = internalQuery.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q)
      );
    }

    // Sorting
    const sorted = [...list];
    if (sortBy === 'price-asc') {
      sorted.sort((a, b) => a.sellingPrice - b.sellingPrice);
    } else if (sortBy === 'price-desc') {
      sorted.sort((a, b) => b.sellingPrice - a.sellingPrice);
    } else if (sortBy === 'discount') {
      sorted.sort((a, b) => {
        const discA = a.mrp > a.sellingPrice ? (a.mrp - a.sellingPrice) / a.mrp : 0;
        const discB = b.mrp > b.sellingPrice ? (b.mrp - b.sellingPrice) / b.mrp : 0;
        return discB - discA;
      });
    }

    return sorted;
  }, [products, categoryName, selectedShopId, showAllStores, internalQuery, sortBy]);

  const ArtComponent = categoryMeta?.Art;

  return (
    <div className="min-h-screen bg-[#f8faf9] pb-28 pt-2">
      {/* 1. TOP STICKY BAR: BACK BUTTON & QUICK ACTIONS */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="mx-auto max-w-[1500px] px-4 py-2.5 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#173d2e] hover:text-white text-[#173d2e] font-extrabold text-xs transition-colors cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span className="hidden xs:inline">Back</span>
            </button>

            {/* Clickable App Logo to return to main screen */}
            <div
              onClick={onBack}
              title="Return to FreshCart Home"
              className="flex items-center gap-1.5 cursor-pointer group select-none"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#173d2e] text-base shadow-2xs group-hover:scale-105 group-hover:bg-[#123024] transition-all">
                🌿
              </div>
              <span className="hidden md:inline text-sm font-black tracking-tight text-[#173d2e] uppercase font-sans group-hover:text-emerald-800 transition-colors">
                FreshCart
              </span>
            </div>

            <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black text-[#173d2e] truncate max-w-[140px] sm:max-w-xs md:max-w-md">
                  {categoryName}
                </h1>
                <span className="text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {categoryProducts.length} items
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium truncate hidden sm:block">
                Delivered in {activeShop?.eta?.displayText ?? '10-15 mins'} from {activeShop?.name}
              </p>
            </div>
          </div>

          {/* QUICK CART ACCESS */}
          <button
            type="button"
            onClick={onOpenCart}
            className="flex items-center gap-2 rounded-xl bg-[#173d2e] px-3 sm:px-4 py-1.5 text-white shadow-xs hover:bg-[#123024] cursor-pointer shrink-0"
          >
            <ShoppingBag size={16} />
            <span className="text-xs font-black">
              ₹{subtotal.toFixed(0)}
            </span>
            {cartCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d7ef8d] px-1 text-[9px] font-black text-[#173d2e]">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* 2. HORIZONTAL CATEGORIES QUICK SELECTOR STRIP */}
        <div className="px-4 pb-2 pt-1 border-t border-slate-100 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 mx-auto max-w-[1500px]">
            <button
              type="button"
              onClick={() => onSelectCategory('All')}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                categoryName === 'All'
                  ? 'bg-[#173d2e] text-[#d7ef8d] ring-1 ring-[#173d2e] shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-[#173d2e]'
              }`}
            >
              🛍️ All Categories
            </button>
            {BLINKIT_GRID_CATEGORIES.map(cat => {
              const isActive = cat.name.toLowerCase() === categoryName.toLowerCase();
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.name)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#173d2e] text-[#d7ef8d] ring-1 ring-[#173d2e] shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-[#173d2e]'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 pt-4 sm:px-6 lg:px-8 space-y-4">
        {/* 3. HERO CATEGORY BANNER */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#eef6f2] via-[#e6f1ec] to-[#dbeef5] p-4 sm:p-6 border border-emerald-900/10 shadow-xs">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1 sm:space-y-1.5 max-w-xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-white/80 px-2.5 py-0.5 rounded-full inline-block">
                Instant Delivery Store
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#173d2e] tracking-tight">
                {categoryName}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 line-clamp-2">
                Freshly procured daily essentials delivered to your doorstep in 10-15 minutes.
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-[#173d2e]">
                <span className="flex items-center gap-1 bg-white/90 px-2.5 py-1 rounded-lg shadow-2xs">
                  <Store size={13} className="text-emerald-700" />
                  <span>{activeShop?.name}</span>
                </span>
                <span className="flex items-center gap-1 bg-white/90 px-2.5 py-1 rounded-lg shadow-2xs text-emerald-800">
                  <Sparkles size={13} />
                  <span>Verified Fresh Stock</span>
                </span>
              </div>
            </div>

            {/* ARTWORK DISPLAY */}
            {ArtComponent && (
              <div className="hidden sm:flex w-24 h-24 md:w-32 md:h-32 shrink-0 bg-white/80 rounded-2xl p-2 items-center justify-center shadow-xs">
                <div className="w-full h-full flex items-center justify-center">
                  <ArtComponent />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. SEARCH WITHIN CATEGORY & SORT BAR */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={internalQuery}
              onChange={e => setInternalQuery(e.target.value)}
              placeholder={`Search within ${categoryName}...`}
              className="w-full rounded-xl bg-slate-50 pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#173d2e]"
            />
            {internalQuery && (
              <button
                onClick={() => setInternalQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <div className="flex items-center gap-1 text-[11px] font-extrabold text-slate-500 pl-1">
              <SlidersHorizontal size={13} />
              <span>Sort:</span>
            </div>
            {(
              [
                { id: 'recommended', label: 'Popular' },
                { id: 'price-asc', label: 'Price: Low' },
                { id: 'price-desc', label: 'Price: High' },
                { id: 'discount', label: 'Discounts' }
              ] as const
            ).map(opt => (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  sortBy === opt.id
                    ? 'bg-[#173d2e] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5. 3 PRODUCTS IN A HORIZONTAL LINE GRID */}
        {categoryProducts.length > 0 ? (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:gap-6">
            {categoryProducts.map(p => {
              const inCartQty = cart[p.id] || 0;
              const isLiked = liked.includes(p.id);
              const discountPercent = p.mrp > p.sellingPrice 
                ? Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100) 
                : 0;
              const shopOwner = shops.find(s => s.id === p.shopId);

              return (
                <article
                  key={p.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 p-2.5 sm:p-4 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <div>
                    {/* PRODUCT IMAGE & BADGES */}
                    <div className="relative aspect-square w-full overflow-hidden rounded-xl sm:rounded-2xl bg-[#f4f7f2] flex items-center justify-center text-3xl sm:text-5xl">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <span>{CATEGORY_EMOJIS[p.category] ?? '🛒'}</span>
                      )}

                      {/* LIKE BUTTON */}
                      <button
                        type="button"
                        onClick={() => onLike(p.id)}
                        className="absolute right-1.5 top-1.5 sm:right-2.5 sm:top-2.5 rounded-lg sm:rounded-xl bg-white/90 p-1 sm:p-2 text-[#517362] shadow-xs hover:bg-white transition-colors cursor-pointer"
                        aria-label="Favorite product"
                      >
                        <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} className="sm:w-4 sm:h-4 text-rose-600" />
                      </button>

                      {/* UNIT BADGE */}
                      <span className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 rounded-md sm:rounded-lg bg-white/95 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-black text-slate-700 shadow-xs">
                        {p.unit}
                      </span>

                      {/* DISCOUNT BADGE */}
                      {discountPercent > 0 && (
                        <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 rounded-md sm:rounded-lg bg-[#173d2e] px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-black text-[#d7ef8d] shadow-xs">
                          {discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    {/* DETAILS */}
                    <div className="mt-2 sm:mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">
                          {p.category}
                        </span>
                        {shopOwner && shopOwner.id !== selectedShopId && (
                          <span className="text-[8px] font-bold text-emerald-800 bg-emerald-50 px-1 rounded truncate max-w-[80px]">
                            {shopOwner.name}
                          </span>
                        )}
                      </div>
                      <h4 className="mt-0.5 sm:mt-1 line-clamp-2 min-h-[30px] sm:min-h-10 text-xs sm:text-sm md:text-base font-black leading-tight sm:leading-snug text-[#173d2e]">
                        {p.name}
                      </h4>
                    </div>
                  </div>

                  {/* PRICE & ADD ACTION */}
                  <div className="mt-2.5 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 border-t border-slate-100 pt-2 sm:pt-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm sm:text-base md:text-lg font-black text-[#173d2e]">
                        ₹{p.sellingPrice}
                      </span>
                      {p.mrp > p.sellingPrice && (
                        <span className="text-[9px] sm:text-xs text-slate-400 line-through">
                          ₹{p.mrp}
                        </span>
                      )}
                    </div>

                    {inCartQty > 0 ? (
                      <div className="flex h-7 sm:h-9 items-center justify-between rounded-lg sm:rounded-xl bg-[#173d2e] px-1.5 text-white font-black text-xs shadow-xs w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity ? onUpdateQuantity(p.id, inCartQty - 1) : onAddToCart(p.id)}
                          className="p-1 hover:text-[#d7ef8d] cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-2 text-[11px] sm:text-xs font-black">{inCartQty}</span>
                        <button
                          type="button"
                          onClick={() => onAddToCart(p.id)}
                          className="p-1 hover:text-[#d7ef8d] cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={!p.stock}
                        onClick={() => onAddToCart(p.id)}
                        className="flex h-7 sm:h-9 items-center justify-center gap-1 rounded-lg sm:rounded-xl bg-emerald-50 px-2 sm:px-3 text-[10px] sm:text-xs font-black text-[#173d2e] border border-emerald-200/90 hover:bg-[#173d2e] hover:text-white transition-all active:scale-95 disabled:opacity-40 cursor-pointer w-full sm:w-auto"
                      >
                        <Plus size={12} className="sm:w-3.5 sm:h-3.5" />
                        <span>ADD</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-12 text-center border border-dashed border-slate-200 space-y-3">
            <p className="text-base font-black text-[#173d2e]">
              No products found in "{categoryName}"
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              We couldn't find items matching your search. Try switching to another category or browse all available catalog items.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => onSelectCategory('All')}
                className="rounded-xl bg-[#173d2e] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#123024]"
              >
                View All Categories
              </button>
              <button
                type="button"
                onClick={onBack}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Return to Store Home
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM BACK BUTTON */}
        <div className="pt-6 pb-4 text-center">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-[#173d2e] text-[#173d2e] font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Store Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
