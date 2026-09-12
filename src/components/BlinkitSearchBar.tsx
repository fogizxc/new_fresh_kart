import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock, Trash2, ArrowRight, X } from 'lucide-react';
import type { ApiProduct } from '../services/api';

interface BlinkitSearchBarProps {
  query: string;
  onQueryChange: (val: string) => void;
  products: ApiProduct[];
  onSelectProduct: (p: ApiProduct) => void;
  onAddToCart: (p: ApiProduct) => void;
}

const SEARCH_HISTORY_KEY = 'freshcart_search_history';

// Typo tolerance and fuzzy match algorithm
function calculateMatch(needle: string, target: string): { matches: boolean; score: number } {
  const n = needle.trim().toLowerCase();
  const t = target.toLowerCase();
  if (!n) return { matches: false, score: 0 };

  // Exact prefix match gets highest score
  if (t.startsWith(n)) {
    return { matches: true, score: 200 - n.length };
  }

  // Word prefix match (e.g., "Full Cream Milk" matches "mi")
  const words = t.split(/[\s\-()]+/);
  for (const word of words) {
    if (word.startsWith(n)) {
      return { matches: true, score: 150 };
    }
  }

  // Substring match
  if (t.includes(n)) {
    return { matches: true, score: 100 - t.indexOf(n) };
  }

  // Typo tolerance: Levenshtein distance <= 2 for short words
  if (n.length >= 3) {
    for (const word of words) {
      if (Math.abs(word.length - n.length) <= 2) {
        let diff = 0;
        const len = Math.min(word.length, n.length);
        for (let i = 0; i < len; i++) {
          if (word[i] !== n[i]) diff++;
        }
        diff += Math.abs(word.length - n.length);
        if (diff <= 2) {
          return { matches: true, score: 60 - diff * 10 };
        }
      }
    }
  }

  return { matches: false, score: 0 };
}

export const BlinkitSearchBar: React.FC<BlinkitSearchBarProps> = ({
  query,
  onQueryChange,
  products,
  onSelectProduct,
  onAddToCart
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      return stored ? JSON.parse(stored) : ['Milk', 'Mint', 'Bread', 'Mangoes'];
    } catch {
      return ['Milk', 'Mint', 'Bread', 'Mangoes'];
    }
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveToHistory = (term: string) => {
    const cleaned = term.trim();
    if (!cleaned) return;
    const next = [cleaned, ...history.filter(h => h.toLowerCase() !== cleaned.toLowerCase())].slice(0, 8);
    setHistory(next);
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
    } catch {}
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch {}
  };

  // Instant Suggestions & Typo-tolerance matches
  const matchedSuggestions = React.useMemo(() => {
    if (!query.trim()) return [];
    const trimmed = query.trim();

    const scored = products.map(p => {
      const nameMatch = calculateMatch(trimmed, p.name);
      const categoryMatch = calculateMatch(trimmed, p.category);
      const skuMatch = calculateMatch(trimmed, p.sku);
      const maxScore = Math.max(nameMatch.score, categoryMatch.score * 0.8, skuMatch.score * 0.6);
      const matches = nameMatch.matches || categoryMatch.matches || skuMatch.matches;
      return { product: p, matches, score: maxScore };
    });

    return scored
      .filter(item => item.matches)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(item => item.product);
  }, [query, products]);

  // Prefix matching categories or suggested keywords e.g. "mi" -> "Milk", "Mint"
  const quickKeywordSuggestions = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const suggestionsSet = new Set<string>();

    products.forEach(p => {
      p.name.split(/[\s\-()]+/).forEach(w => {
        if (w.toLowerCase().startsWith(q) && w.length >= 2) {
          suggestionsSet.add(w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
        }
      });
    });

    return Array.from(suggestionsSet).slice(0, 4);
  }, [query, products]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search
          size={18}
          className="pointer-events-none absolute left-3.5 text-[#3b7a5d] sm:left-4"
        />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={e => {
            onQueryChange(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && query.trim()) {
              saveToHistory(query.trim());
              setIsOpen(false);
            }
          }}
          placeholder='Search "milk", "mint", "bread", "mangoes"...'
          className="h-11 w-full rounded-2xl border border-emerald-950/10 bg-white pl-10 pr-10 text-xs font-semibold text-[#173d2e] shadow-sm outline-none transition-all placeholder:text-[#88988f] focus:border-[#173d2e] focus:ring-2 focus:ring-[#173d2e]/10 sm:h-12 sm:pl-11 sm:text-sm"
        />
        {query && (
          <button
            onClick={() => {
              onQueryChange('');
            }}
            className="absolute right-3 rounded-full p-1 text-slate-400 hover:bg-slate-100"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Dropdown Suggestions Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[80vh] overflow-y-auto rounded-3xl border border-slate-100 bg-white p-4 shadow-2xl animate-in fade-in duration-150">
          {/* Quick autocomplete keywords when typing */}
          {quickKeywordSuggestions.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1">
                Suggested:
              </span>
              {quickKeywordSuggestions.map(kw => (
                <button
                  key={kw}
                  onClick={() => {
                    onQueryChange(kw);
                    saveToHistory(kw);
                  }}
                  className="rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-[#173d2e] hover:bg-emerald-100"
                >
                  {kw}
                </button>
              ))}
            </div>
          )}

          {/* Results matching typo or instant prefix */}
          {query.trim() ? (
            <div>
              <div className="flex items-center justify-between pb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Products matching "{query}"
                </span>
                <span className="text-[11px] font-bold text-emerald-700">
                  {matchedSuggestions.length} items found
                </span>
              </div>

              {matchedSuggestions.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {matchedSuggestions.map(p => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between py-2.5 hover:bg-slate-50/80 px-2 rounded-xl transition-colors cursor-pointer"
                      onClick={() => {
                        saveToHistory(p.name);
                        onSelectProduct(p);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-base overflow-hidden">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            '🛒'
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-extrabold text-[#173d2e]">{p.name}</p>
                          <p className="text-[10px] text-slate-500">
                            {p.unit} • ₹{p.sellingPrice} {p.mrp > p.sellingPrice && <span className="line-through text-slate-400">₹{p.mrp}</span>}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          saveToHistory(p.name);
                          onAddToCart(p);
                        }}
                        className="ml-2 rounded-xl bg-[#173d2e] px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-[#123024] shrink-0"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No instant matches for "{query}". Try checking common items below!
                </div>
              )}
            </div>
          ) : (
            /* Search History when search box is empty */
            <div>
              {history.length > 0 && (
                <div>
                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      <Clock size={13} />
                      <span>Recent Searches</span>
                    </div>
                    <button
                      onClick={clearHistory}
                      className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 size={12} />
                      <span>Clear</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 py-2">
                    {history.map(item => (
                      <button
                        key={item}
                        onClick={() => {
                          onQueryChange(item);
                        }}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-[#173d2e] hover:bg-slate-100 hover:border-slate-300"
                      >
                        <span>{item}</span>
                        <ArrowRight size={11} className="text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular quick categories */}
              <div className="mt-3 border-t border-slate-100 pt-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Trending Essentials
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {['Milk & Dairy', 'Fresh Mint & Greens', 'Brown Bread', 'Chips & Snacks'].map(item => (
                    <button
                      key={item}
                      onClick={() => {
                        onQueryChange(item.split(' ')[0]);
                        saveToHistory(item.split(' ')[0]);
                      }}
                      className="rounded-xl bg-emerald-50/60 p-2.5 text-left text-xs font-extrabold text-[#173d2e] hover:bg-emerald-100 transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
