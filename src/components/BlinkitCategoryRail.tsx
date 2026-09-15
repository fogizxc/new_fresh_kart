import React, { useRef, useEffect } from 'react';
import {
  PaanCornerArt,
  DairyBreadEggsArt,
  FruitsVegArt,
  ColdDrinksJuiceArt,
  SnacksMunchiesArt,
  BreakfastInstantFoodArt,
  SweetToothArt,
  BakeryBiscuitsArt,
  TeaCoffeeArt,
  AttaRiceDalArt,
  MasalaOilArt,
  SaucesSpreadsArt,
  ChickenMeatFishArt,
  OrganicHealthyArt,
  BabyCareArt,
  PharmaWellnessArt,
  CleaningEssentialsArt,
  HomeOfficeArt,
  PersonalCareArt,
  PetCareArt
} from './categoryIllustrations';

export type BlinkitCategory =
  | 'All'
  | 'Vegetables'
  | 'Fruits'
  | 'Dairy & Eggs'
  | 'Pantry'
  | 'Snacks'
  | 'Beverages'
  | 'Household'
  | string;

interface BlinkitCategoryRailProps {
  selectedCategory: BlinkitCategory;
  onSelectCategory: (cat: BlinkitCategory) => void;
}

const CATEGORY_ITEMS: Array<{
  id: BlinkitCategory;
  label: string;
  emoji: string;
  bgColor: string;
}> = [
  { id: 'All', label: 'All Items', emoji: '🛍️', bgColor: 'bg-emerald-50 text-emerald-950 hover:bg-emerald-100' },
  { id: 'Vegetables', label: 'Vegetables', emoji: '🥦', bgColor: 'bg-green-50 text-green-950 hover:bg-green-100' },
  { id: 'Fruits', label: 'Fresh Fruits', emoji: '🍎', bgColor: 'bg-rose-50 text-rose-950 hover:bg-rose-100' },
  { id: 'Dairy & Eggs', label: 'Dairy & Eggs', emoji: '🥛', bgColor: 'bg-blue-50 text-blue-950 hover:bg-blue-100' },
  { id: 'Pantry', label: 'Atta & Pantry', emoji: '🌾', bgColor: 'bg-amber-50 text-amber-950 hover:bg-amber-100' },
  { id: 'Snacks', label: 'Munchies & Chips', emoji: '🍿', bgColor: 'bg-orange-50 text-orange-950 hover:bg-orange-100' },
  { id: 'Beverages', label: 'Cold Drinks & Juice', emoji: '🥤', bgColor: 'bg-purple-50 text-purple-950 hover:bg-purple-100' },
  { id: 'Household', label: 'Cleaning & Home', emoji: '🧼', bgColor: 'bg-teal-50 text-teal-950 hover:bg-teal-100' }
];

export const BLINKIT_GRID_CATEGORIES = [
  // ROW 1
  { id: 'paan-corner', name: 'Paan Corner', Art: PaanCornerArt },
  { id: 'dairy-bread-eggs', name: 'Dairy, Bread & Eggs', Art: DairyBreadEggsArt },
  { id: 'fruits-vegetables', name: 'Fruits & Vegetables', Art: FruitsVegArt },
  { id: 'cold-drinks-juices', name: 'Cold Drinks & Juices', Art: ColdDrinksJuiceArt },
  { id: 'snacks-munchies', name: 'Snacks & Munchies', Art: SnacksMunchiesArt },
  { id: 'breakfast-instant-food', name: 'Breakfast & Instant Food', Art: BreakfastInstantFoodArt },
  { id: 'sweet-tooth', name: 'Sweet Tooth', Art: SweetToothArt },
  { id: 'bakery-biscuits', name: 'Bakery & Biscuits', Art: BakeryBiscuitsArt },
  { id: 'tea-coffee-milk', name: 'Tea, Coffee & Milk Drinks', Art: TeaCoffeeArt },
  { id: 'atta-rice-dal', name: 'Atta, Rice & Dal', Art: AttaRiceDalArt },
  // ROW 2
  { id: 'masala-oil-more', name: 'Masala, Oil & More', Art: MasalaOilArt },
  { id: 'sauces-spreads', name: 'Sauces & Spreads', Art: SaucesSpreadsArt },
  { id: 'chicken-meat-fish', name: 'Chicken, Meat & Fish', Art: ChickenMeatFishArt },
  { id: 'organic-healthy', name: 'Organic & Healthy Living', Art: OrganicHealthyArt },
  { id: 'baby-care', name: 'Baby Care', Art: BabyCareArt },
  { id: 'pharma-wellness', name: 'Pharma & Wellness', Art: PharmaWellnessArt },
  { id: 'cleaning-essentials', name: 'Cleaning Essentials', Art: CleaningEssentialsArt },
  { id: 'home-office', name: 'Home & Office', Art: HomeOfficeArt },
  { id: 'personal-care', name: 'Personal Care', Art: PersonalCareArt },
  { id: 'pet-care', name: 'Pet Care', Art: PetCareArt }
];

export const BlinkitCategoryRail: React.FC<BlinkitCategoryRailProps> = ({
  selectedCategory,
  onSelectCategory
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const hasMovedRef = useRef(false);
  const animationFrameRef = useRef<number>();

  // Continuous smooth auto-slide loop using requestAnimationFrame
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let lastTimestamp = performance.now();

    const tick = (now: number) => {
      const delta = Math.min(now - lastTimestamp, 50); // cap max delta to prevent big jumps
      lastTimestamp = now;

      if (!isInteractingRef.current && !isDraggingRef.current && el) {
        // Auto scroll step (speed: ~0.75px per frame)
        el.scrollLeft += (delta / 16) * 0.75;

        // Tripled items enable seamless infinite looping
        const singleSetWidth = el.scrollWidth / 3;
        if (el.scrollLeft >= singleSetWidth * 2) {
          el.scrollLeft -= singleSetWidth;
        } else if (el.scrollLeft <= 0) {
          el.scrollLeft += singleSetWidth;
        }
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Initial centering so left scroll is also seamless
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      const singleSetWidth = el.scrollWidth / 3;
      el.scrollLeft = singleSetWidth;
    }
  }, []);

  // Mouse drag handlers to allow user to slide it manually
  const onMouseDown = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftStartRef.current = el.scrollLeft;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
    }
    el.scrollLeft = scrollLeftStartRef.current - walk;
  };

  const onMouseUp = () => {
    isDraggingRef.current = false;
  };

  const onMouseLeave = () => {
    isDraggingRef.current = false;
    isInteractingRef.current = false;
  };

  return (
    <section className="mx-auto max-w-[1500px] px-4 pt-6 sm:px-6 lg:px-8">
      {/* Top title */}
      <div className="mb-3">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#173d2e]">
          Shop by Category
        </h2>
      </div>

      {/* HORIZONTAL LOGOS RAIL - NO OUTSIDE BOX, JUST THE LOGOS */}
      <div className="relative w-full overflow-hidden">
        <div
          ref={containerRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onMouseEnter={() => { isInteractingRef.current = true; }}
          onTouchStart={() => { isInteractingRef.current = true; }}
          onTouchEnd={() => { 
            setTimeout(() => { isInteractingRef.current = false; }, 600); 
          }}
          className="no-scrollbar flex items-start gap-3 sm:gap-4.5 overflow-x-auto py-1.5 cursor-grab active:cursor-grabbing select-none"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Triplicate array for smooth continuous infinite loop */}
          {[...CATEGORY_ITEMS, ...CATEGORY_ITEMS, ...CATEGORY_ITEMS].map((item, idx) => {
            const isSelected = selectedCategory === item.id;
            return (
              <button
                key={`${item.id}-${idx}`}
                type="button"
                onClick={() => {
                  if (!hasMovedRef.current) {
                    onSelectCategory(item.id);
                  }
                }}
                className="group flex flex-col items-center gap-1.5 shrink-0 text-center transition-transform hover:scale-105 active:scale-95 cursor-pointer bg-transparent border-0 p-0 focus:outline-none"
                style={{ width: '64px' }}
              >
                {/* Circular Logo Avatar (Smaller, refined icon) */}
                <div
                  className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full text-xl sm:text-2xl shadow-xs transition-all duration-200 ${item.bgColor} ${
                    isSelected
                      ? 'ring-2 ring-[#173d2e] ring-offset-2 scale-105 shadow-md'
                      : 'hover:shadow-md'
                  }`}
                >
                  <span className="transform transition-transform group-hover:scale-110">
                    {item.emoji}
                  </span>
                </div>

                {/* Clean label directly under the logo */}
                <span
                  className={`text-[10px] sm:text-[11px] leading-tight font-extrabold transition-colors line-clamp-2 ${
                    isSelected ? 'text-[#173d2e] font-black underline decoration-2 decoration-[#3b7a5d]' : 'text-slate-700 group-hover:text-[#173d2e]'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 20 CATEGORY TILES UNDER THE SCROLLING BAR - 5 IN A LINE ON PHONE SCREEN */}
      <div className="mt-5 sm:mt-7 pt-4 sm:pt-6 border-t border-slate-200/70">
        <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 lg:grid-cols-10 gap-x-2 sm:gap-x-3 md:gap-x-3.5 gap-y-3 sm:gap-y-4">
          {BLINKIT_GRID_CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.name;
            const ArtComponent = cat.Art;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onSelectCategory(cat.name);
                }}
                className="group flex flex-col items-center text-center cursor-pointer transition-transform hover:-translate-y-0.5 active:scale-95 focus:outline-none"
              >
                {/* Tile with soft ice-blue background matching the user's reference */}
                <div
                  className={`w-full aspect-square max-w-[106px] rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 flex items-center justify-center transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#e0effa] ring-2 ring-[#173d2e] shadow-sm scale-105'
                      : 'bg-[#eef5fa] hover:bg-[#e4eff8] shadow-2xs group-hover:shadow-xs'
                  }`}
                >
                  <div className="w-full h-full flex items-center justify-center pointer-events-none select-none">
                    <ArtComponent />
                  </div>
                </div>

                {/* Title label centered under the tile */}
                <span
                  className={`mt-1 sm:mt-1.5 text-[9px] sm:text-[11px] md:text-xs leading-tight font-bold text-center line-clamp-2 px-0.5 min-h-[26px] sm:min-h-[30px] flex items-center justify-center transition-colors ${
                    isSelected ? 'text-[#173d2e] font-black' : 'text-slate-700 group-hover:text-[#173d2e]'
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
