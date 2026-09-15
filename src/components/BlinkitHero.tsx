import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ShoppingCart, Tag } from 'lucide-react';
import type { ApiProduct } from '../services/api';

interface BlinkitHeroProps {
  onShopNow?: () => void;
  deliveryMinutes?: string;
  products?: ApiProduct[];
  onAddToCart?: (id: string) => void;
}

export const BlinkitHero: React.FC<BlinkitHeroProps> = ({
  products = [],
  onAddToCart
}) => {
  // Top deals sorted by highest savings/discounts from project catalog
  const topDeals = useMemo(() => {
    if (!products || products.length === 0) return [];
    return [...products]
      .map(p => {
        const discountAmount = Math.max(0, p.mrp - p.sellingPrice);
        const discountPercent = p.mrp > 0 ? Math.round((discountAmount / p.mrp) * 100) : 0;
        return {
          ...p,
          discountAmount,
          discountPercent: discountPercent > 0 ? discountPercent : 15
        };
      })
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, 7);
  }, [products]);

  // All slides are full-screen product hero slides
  const totalSlides = topDeals.length;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Touch and Mouse swipe / slide gesture tracking
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);
  const isDragging = useRef<boolean>(false);

  // Auto sliding carousel on loop every 4 seconds
  useEffect(() => {
    if (totalSlides <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % totalSlides);
    }, 4000);

    return () => clearInterval(timer);
  }, [totalSlides, isPaused]);

  const prevSlide = () => {
    if (totalSlides === 0) return;
    setCurrentSlide(prev => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const nextSlide = () => {
    if (totalSlides === 0) return;
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  };

  // Handle Swipe Gesture detection
  const handleSwipe = (start: number, end: number) => {
    const minSwipeDistance = 45;
    const diff = start - end;
    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        // Swiped Left -> Go Next
        nextSlide();
      } else {
        // Swiped Right -> Go Prev
        prevSlide();
      }
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      handleSwipe(touchStartX.current, touchEndX.current);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const onMouseDown = (e: React.MouseEvent) => {
    mouseStartX.current = e.clientX;
    isDragging.current = true;
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (isDragging.current && mouseStartX.current !== null) {
      handleSwipe(mouseStartX.current, e.clientX);
    }
    isDragging.current = false;
    mouseStartX.current = null;
  };

  const activeProduct = topDeals[currentSlide] || topDeals[0] || null;

  if (!activeProduct) {
    return null;
  }

  return (
    <div 
      className="mx-auto max-w-[1500px] px-4 pt-4 sm:px-6 lg:px-8 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        setIsPaused(false);
        isDragging.current = false;
      }}
    >
      <div 
        className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#173d2e] via-[#1b4837] to-[#0f281e] text-white shadow-xl min-h-[380px] sm:min-h-[440px] flex flex-col justify-between cursor-grab active:cursor-grabbing"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      >
        {/* Ambient decorative glow elements */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl z-10" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl z-10" />

        {/* FULL-SCREEN PRODUCT DEAL SLIDE */}
        <div 
          key={activeProduct.id}
          className="relative z-10 flex-1 min-h-[380px] sm:min-h-[440px] w-full overflow-hidden transition-opacity duration-500 animate-fadeIn flex flex-col justify-end"
        >
          {/* FULL SCREEN BACKGROUND PRODUCT IMAGE */}
          <div className="absolute inset-0 z-0">
            {activeProduct.imageUrl ? (
              <img
                src={activeProduct.imageUrl}
                alt={activeProduct.name}
                draggable={false}
                className="h-full w-full object-cover object-center transform scale-100 transition-transform duration-700 hover:scale-105 pointer-events-none select-none"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-emerald-950/80">
                <span className="text-8xl opacity-30">🛒</span>
              </div>
            )}
            {/* Refined directional gradients for contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
          </div>

          {/* TOP LEFT BADGE: DISCOUNT ONLY */}
          <div className="absolute top-5 left-5 sm:left-10 z-20 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white shadow-lg">
              <Tag size={12} />
              <span>{activeProduct.discountPercent}% OFF</span>
            </span>
          </div>

          {/* BOTTOM ROW: TEXT & PRICE ON LEFT, CART ICON BUTTON ON RIGHT CORNER (ALWAYS SAME LINE) */}
          <div className="relative z-20 p-5 sm:p-8 flex flex-row items-end justify-between gap-3 w-full">
            {/* TEXT ON LEFT BOTTOM */}
            <div className="flex-1 min-w-0 pr-2">
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-[#d7ef8d]">
                {activeProduct.category}
              </span>

              <h2 className="mt-0.5 text-lg sm:text-2xl font-black text-white tracking-tight drop-shadow-md truncate sm:whitespace-normal">
                {activeProduct.name}
              </h2>

              {/* Amount / Price on the same line */}
              <div className="mt-1.5 flex flex-nowrap items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black text-[#d7ef8d] drop-shadow-md whitespace-nowrap">
                  ₹{activeProduct.sellingPrice}
                </span>
                {activeProduct.mrp > activeProduct.sellingPrice && (
                  <span className="text-sm sm:text-base font-bold text-white/60 line-through whitespace-nowrap">
                    ₹{activeProduct.mrp}
                  </span>
                )}
                {activeProduct.discountAmount > 0 && (
                  <span className="rounded-lg bg-emerald-500/30 backdrop-blur-sm border border-emerald-400/40 px-2 py-0.5 text-[11px] sm:text-xs font-bold text-emerald-200 whitespace-nowrap">
                    Save ₹{activeProduct.discountAmount}
                  </span>
                )}
              </div>
            </div>

            {/* CART ICON BUTTON FIXED IN RIGHT BOTTOM CORNER */}
            <div className="shrink-0 pb-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart?.(activeProduct.id);
                }}
                className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#d7ef8d] text-[#173d2e] shadow-2xl shadow-black/70 hover:bg-[#c9e672] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                aria-label={`Add ${activeProduct.name} to cart`}
                title="Add to cart"
              >
                <ShoppingCart size={22} className="stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
