import React, { useState } from 'react';
import {
  ChefHat,
  Clock,
  Flame,
  Plus,
  ShoppingBag,
  Sparkles,
  Users,
  X,
  Check,
  CheckCircle2,
  Info
} from 'lucide-react';
import { RECIPE_BUNDLES, type RecipeBundle, type RecipeIngredient } from '../data/recipes';
import type { ApiProduct } from '../services/api';
import { addItemToCart } from '../services/cart';

interface RecipeBundlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ApiProduct[];
  selectedShopId?: string | null;
  onAddedToCart: () => void;
  flash: (msg: string) => void;
}

export const RecipeBundlesModal: React.FC<RecipeBundlesModalProps> = ({
  isOpen,
  onClose,
  products,
  selectedShopId,
  onAddedToCart,
  flash
}) => {
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeBundle>(RECIPE_BUNDLES[0]);
  const [selectedIngredients, setSelectedIngredients] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    RECIPE_BUNDLES[0].ingredients.forEach(ing => {
      map[ing.name] = true;
    });
    return map;
  });

  if (!isOpen) return null;

  const handleSelectRecipe = (recipe: RecipeBundle) => {
    setSelectedRecipe(recipe);
    const map: Record<string, boolean> = {};
    recipe.ingredients.forEach(ing => {
      map[ing.name] = true;
    });
    setSelectedIngredients(map);
  };

  const toggleIngredient = (name: string) => {
    setSelectedIngredients(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  // Find matching catalog product or use default price
  const getProductForIngredient = (ing: RecipeIngredient) => {
    const found = products.find(p =>
      p.name.toLowerCase().includes(ing.productKeyword.toLowerCase())
    );
    return found;
  };

  // Calculate bundle total for selected ingredients
  const activeIngredients = selectedRecipe.ingredients.filter(
    ing => selectedIngredients[ing.name]
  );

  const bundleTotal = activeIngredients.reduce((sum, ing) => {
    const prod = getProductForIngredient(ing);
    return sum + (prod?.sellingPrice ?? ing.defaultPrice);
  }, 0);

  const handleAddBundleToCart = () => {
    let addedCount = 0;
    for (const ing of activeIngredients) {
      const prod = getProductForIngredient(ing);
      if (prod) {
        addItemToCart(prod.id, 1, prod.shopId || selectedShopId || undefined, false);
        addedCount++;
      } else {
        // Fallback to any available product in same category or first product
        const fallback = products.find(p => p.category === ing.category) || products[0];
        if (fallback) {
          addItemToCart(fallback.id, 1, fallback.shopId || selectedShopId || undefined, false);
          addedCount++;
        }
      }
    }

    onAddedToCart();
    flash(`Added ${addedCount} ingredients for ${selectedRecipe.title} to cart!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-black/10 my-6">
        {/* Header */}
        <div className="bg-[#173d2e] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d7ef8d] text-[#173d2e]">
              <ChefHat size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">1-Click Cook: Recipe Bundles</h3>
              <p className="text-xs text-emerald-200">
                Pick a recipe, check off what you need, and get all fresh ingredients delivered together
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Recipe Selection Tabs */}
        <div className="flex gap-2 overflow-x-auto p-4 bg-[#f8faf8] border-b border-black/5">
          {RECIPE_BUNDLES.map(r => {
            const isSelected = r.id === selectedRecipe.id;
            return (
              <button
                key={r.id}
                onClick={() => handleSelectRecipe(r)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-[#173d2e] text-white border-[#173d2e] shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>{r.badge === 'Popular Kit' ? '🔥' : r.badge === 'Morning Special' ? '☀️' : '🥘'}</span>
                <span>{r.title}</span>
              </button>
            );
          })}
        </div>

        {/* Recipe Detail Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 max-h-[65vh] overflow-y-auto">
          {/* Left Column: Photo & Details */}
          <div className="md:col-span-5 p-6 border-b md:border-b-0 md:border-r border-black/5 space-y-4">
            <div className="relative h-48 w-full overflow-hidden rounded-2xl shadow-inner bg-gray-100">
              <img
                src={selectedRecipe.imageUrl}
                alt={selectedRecipe.title}
                className="h-full w-full object-cover"
              />
              <span className="absolute top-3 left-3 rounded-full bg-[#173d2e]/90 backdrop-blur-xs px-3 py-1 text-[10px] font-black text-white">
                {selectedRecipe.badge}
              </span>
            </div>

            <div>
              <h4 className="text-lg font-black text-gray-900 leading-snug">
                {selectedRecipe.title}
              </h4>
              <p className="text-xs text-gray-500 mt-1">{selectedRecipe.tagline}</p>
            </div>

            {/* Quick Badges */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-[#f4f7f4] p-2.5 text-center border border-black/5">
                <div className="flex items-center justify-center gap-1 text-[#3c7257] text-xs font-black">
                  <Clock size={13} />
                  <span>{selectedRecipe.prepTime}</span>
                </div>
                <span className="text-[10px] text-gray-500 font-bold">Prep Time</span>
              </div>
              <div className="rounded-xl bg-[#f4f7f4] p-2.5 text-center border border-black/5">
                <div className="flex items-center justify-center gap-1 text-[#3c7257] text-xs font-black">
                  <Users size={13} />
                  <span>{selectedRecipe.servings} People</span>
                </div>
                <span className="text-[10px] text-gray-500 font-bold">Servings</span>
              </div>
              <div className="rounded-xl bg-[#f4f7f4] p-2.5 text-center border border-black/5">
                <div className="flex items-center justify-center gap-1 text-[#3c7257] text-xs font-black">
                  <Flame size={13} />
                  <span>{selectedRecipe.difficulty}</span>
                </div>
                <span className="text-[10px] text-gray-500 font-bold">Difficulty</span>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">{selectedRecipe.description}</p>

            {/* Chef's Secret Tip */}
            <div className="rounded-2xl bg-amber-50/80 p-3.5 border border-amber-200/60">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                <Sparkles size={14} className="text-amber-600" />
                <span>Chef's Secret Tip</span>
              </div>
              <p className="mt-1 text-[11px] text-amber-800 leading-relaxed font-medium">
                {selectedRecipe.chefTip}
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Ingredient Checklist */}
          <div className="md:col-span-7 p-6 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h5 className="text-sm font-black text-gray-900">Fresh Ingredients Checklist</h5>
                  <p className="text-[11px] text-gray-500">
                    Uncheck anything you already have in your pantry
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-800 border border-emerald-200">
                  {activeIngredients.length} of {selectedRecipe.ingredients.length} items
                </span>
              </div>

              {/* Ingredients List */}
              <div className="mt-3 space-y-2 max-h-[38vh] overflow-y-auto pr-1">
                {selectedRecipe.ingredients.map(ing => {
                  const isChecked = Boolean(selectedIngredients[ing.name]);
                  const catalogItem = getProductForIngredient(ing);
                  const price = catalogItem?.sellingPrice ?? ing.defaultPrice;

                  return (
                    <div
                      key={ing.name}
                      onClick={() => toggleIngredient(ing.name)}
                      className={`flex items-center justify-between rounded-xl p-3 border transition cursor-pointer ${
                        isChecked
                          ? 'border-emerald-900/20 bg-[#f9fbf9]'
                          : 'border-gray-200 bg-gray-50/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                            isChecked
                              ? 'border-[#173d2e] bg-[#173d2e] text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check size={13} className="stroke-[3]" />}
                        </button>
                        <span className="text-lg">{ing.icon || '🛒'}</span>
                        <div>
                          <p className="text-xs font-black text-gray-900">{ing.name}</p>
                          <p className="text-[10px] text-gray-500">
                            {ing.quantity} • {ing.category}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-gray-900">₹{price}</span>
                        {catalogItem && (
                          <span className="block text-[9px] font-bold text-emerald-700">In Stock</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Total & 1-Click Action */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 font-bold">Bundle Total</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-[#173d2e]">₹{bundleTotal}</span>
                    <span className="text-xs text-gray-400 line-through">
                      ₹{Math.round(bundleTotal * 1.15)}
                    </span>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-sm">
                      Save 15%
                    </span>
                  </div>
                </div>

                <button
                  disabled={activeIngredients.length === 0}
                  onClick={handleAddBundleToCart}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#173d2e] px-6 py-3 text-xs font-black text-white hover:bg-[#20523e] transition shadow-md active:scale-95 disabled:opacity-50"
                >
                  <ShoppingBag size={16} />
                  <span>Add {activeIngredients.length} Items to Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
