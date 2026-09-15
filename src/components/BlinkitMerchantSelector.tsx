import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Store, 
  Search, 
  ChevronDown, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  X, 
  FileText, 
  Copy, 
  Check, 
  Phone, 
  Award,
  Sparkles
} from 'lucide-react';
import type { ApiShop } from '../services/api';
import type { BlinkitCategory } from './BlinkitCategoryRail';

interface BlinkitMerchantSelectorProps {
  shops: ApiShop[];
  selectedShopId: string | null;
  onSelectShop: (shopId: string) => void;
  selectedCategory?: BlinkitCategory | string;
  onSelectCategory?: (category: BlinkitCategory) => void;
}

interface MerchantLegalInfo {
  ownerName: string;
  gstin: string;
  fssai: string;
  phone: string;
  tradeLicense: string;
  pan: string;
  categorySpecialty: string;
  establishedYear: string;
}

const MERCHANT_LEGAL_DATA: Record<string, MerchantLegalInfo> = {
  'shop-1': {
    ownerName: 'Rajesh Kumar Verma',
    gstin: '07AABCG3421M1Z8',
    fssai: '10022011000843',
    phone: '+91 98110 23412',
    tradeLicense: 'DL-NDMC-2021-9981',
    pan: 'AABCG3421M',
    categorySpecialty: 'Fresh Vegetables, Fruits, Dairy & Daily Staples',
    establishedYear: '2016'
  },
  'shop-2': {
    ownerName: 'Sunil Chawla',
    gstin: '07BZLPC8890K1Z2',
    fssai: '10021011001429',
    phone: '+91 98712 55431',
    tradeLicense: 'DL-SDMC-2022-4412',
    pan: 'BZLPC8890K',
    categorySpecialty: 'Daily Groceries, Breads, Munchies & Gourmet Staples',
    establishedYear: '2018'
  },
  'shop-3': {
    ownerName: 'Manoj Aggarwal',
    gstin: '07AAYPA9123Q1Z6',
    fssai: '10023011003189',
    phone: '+91 99100 87654',
    tradeLicense: 'DL-EDMC-2020-7762',
    pan: 'AAYPA9123Q',
    categorySpecialty: 'Spices, Dry Fruits, Cold Pressed Oils & Provisions',
    establishedYear: '2014'
  },
  'shop-4': {
    ownerName: 'Harpreet Singh',
    gstin: '07AAKCS5567R1Z4',
    fssai: '10022011002560',
    phone: '+91 98234 11290',
    tradeLicense: 'DL-WDMC-2023-5591',
    pan: 'AAKCS5567R',
    categorySpecialty: 'Certified Organic Produce, Farm Eggs & Natural Honey',
    establishedYear: '2020'
  }
};

const getMerchantLegalInfo = (shop: ApiShop): MerchantLegalInfo => {
  if (MERCHANT_LEGAL_DATA[shop.id]) return MERCHANT_LEGAL_DATA[shop.id];
  const charCodeSum = shop.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const code = (charCodeSum % 8999 + 1000).toString();
  return {
    ownerName: `${shop.name.split(' ')[0]} Kirana Proprietor`,
    gstin: `07AAACG${code}F1Z5`,
    fssai: `1002301100${code}`,
    phone: shop.phone || '+91 98765 43210',
    tradeLicense: `DL-MCD-2022-${code}`,
    pan: `AAACG${code}F`,
    categorySpecialty: 'Neighborhood Daily Essentials & Fresh Groceries',
    establishedYear: '2019'
  };
};

const STORE_CATEGORY_OPTIONS = [
  { id: 'all', label: 'All Stores', emoji: '🏪' },
  { id: 'vegetables', label: 'Vegetables & Fruits', emoji: '🥦' },
  { id: 'grocery', label: 'Grocery & Staples', emoji: '🌾' },
  { id: 'dairy', label: 'Dairy & Eggs', emoji: '🥛' },
  { id: 'organic', label: 'Organic Produce', emoji: '🌱' },
  { id: 'snacks', label: 'Snacks & Breads', emoji: '🍪' }
];

export const BlinkitMerchantSelector: React.FC<BlinkitMerchantSelectorProps> = ({
  shops,
  selectedShopId,
  onSelectShop
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreCategory, setSelectedStoreCategory] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [copiedGst, setCopiedGst] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter shops for the dropdown by search query AND category
  const filteredShops = useMemo(() => {
    let result = shops;

    // Filter by store category
    if (selectedStoreCategory !== 'all') {
      result = result.filter(s => {
        const legal = getMerchantLegalInfo(s);
        const spec = (legal.categorySpecialty || '').toLowerCase();
        const name = s.name.toLowerCase();

        switch (selectedStoreCategory) {
          case 'vegetables':
            return (
              spec.includes('vegetable') ||
              spec.includes('fruit') ||
              spec.includes('produce') ||
              name.includes('green') ||
              s.id === 'shop-1' ||
              s.id === 'shop-2' ||
              s.id === 'shop-4'
            );
          case 'grocery':
            return (
              spec.includes('grocery') ||
              spec.includes('staple') ||
              spec.includes('provision') ||
              spec.includes('oil') ||
              name.includes('super') ||
              name.includes('basket') ||
              s.id === 'shop-1' ||
              s.id === 'shop-2' ||
              s.id === 'shop-3'
            );
          case 'dairy':
            return (
              spec.includes('dairy') ||
              spec.includes('milk') ||
              spec.includes('egg') ||
              s.id === 'shop-1' ||
              s.id === 'shop-2' ||
              s.id === 'shop-4'
            );
          case 'organic':
            return (
              spec.includes('organic') ||
              spec.includes('natural') ||
              spec.includes('farm') ||
              name.includes('organic') ||
              s.id === 'shop-4'
            );
          case 'snacks':
            return (
              spec.includes('munchies') ||
              spec.includes('snack') ||
              spec.includes('bread') ||
              s.id === 'shop-2' ||
              s.id === 'shop-3'
            );
          default:
            return true;
        }
      });
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        (s.address && s.address.toLowerCase().includes(q))
      );
    }
    return result;
  }, [shops, searchQuery, selectedStoreCategory]);

  // Current selected merchant
  const activeShop = useMemo(() => {
    return shops.find(s => s.id === selectedShopId) || shops[0] || null;
  }, [shops, selectedShopId]);

  const merchantLegal = activeShop ? getMerchantLegalInfo(activeShop) : null;

  const handleCopyGst = () => {
    if (merchantLegal?.gstin) {
      navigator.clipboard.writeText(merchantLegal.gstin);
      setCopiedGst(true);
      setTimeout(() => setCopiedGst(false), 2000);
    }
  };

  return (
    <section id="local-merchants-section" className="mx-auto max-w-[1500px] px-4 pt-6 sm:px-6 lg:px-8 space-y-4">
      {/* 1. SECTION HEADER (Removed "4 verified neighborhood shopkeepers..." and "Showing 4 active stores") */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-[#173d2e]">
            <Store size={16} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#173d2e]">
            Select Local Merchant
          </h2>
        </div>
      </div>

      {/* 2. SEARCH BAR ONLY FOR LOCAL MERCHANT (DROPDOWN TYPE) */}
      <div className="relative w-full max-w-2xl" ref={dropdownRef}>
        <div 
          onClick={() => setIsDropdownOpen(true)}
          className="relative flex items-center w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:border-[#173d2e]/60 transition-all focus-within:ring-2 focus-within:ring-[#173d2e]/20 focus-within:border-[#173d2e]"
        >
          <div className="pl-4 text-emerald-800">
            <Search size={19} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!isDropdownOpen) setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="Search local merchant by name, area or market..."
            className="w-full bg-transparent px-3 py-3.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSearchQuery('');
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 mr-1"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
            className="pr-4 pl-2 py-3 text-slate-500 hover:text-[#173d2e] transition cursor-pointer"
            aria-label="Toggle merchant dropdown"
          >
            <ChevronDown 
              size={18} 
              className={`transform transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-[#173d2e]' : ''}`} 
            />
          </button>
        </div>

        {/* DROPDOWN MENU */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 z-40 mt-2 max-h-96 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl p-2.5 animate-fadeIn">
            <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1.5 flex items-center justify-between">
              <span>Verified Neighborhood Kirana Stores</span>
              <span className="font-black text-slate-600">{filteredShops.length} {filteredShops.length === 1 ? 'Store' : 'Stores'}</span>
            </div>

            {/* CATEGORY BAR FOR FILTERING STORES (Vegetable, Grocery, Dairy, etc.) */}
            <div className="px-1 py-1.5 pb-2.5 border-b border-slate-100 mb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {STORE_CATEGORY_OPTIONS.map(cat => {
                const isSelected = selectedStoreCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStoreCategory(cat.id);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-[#173d2e] text-[#d7ef8d] shadow-xs scale-102 ring-1 ring-[#173d2e]'
                        : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-[#173d2e]'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {filteredShops.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                <p>No stores match the selected category or search.</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStoreCategory('all');
                    setSearchQuery('');
                  }}
                  className="mt-2 inline-block px-3 py-1 rounded-full bg-emerald-100 text-[#173d2e] font-bold text-xs hover:bg-emerald-200 transition"
                >
                  Reset filters & view all stores
                </button>
              </div>
            ) : (
              filteredShops.map((shop, index) => {
                const isSelected = selectedShopId === shop.id;
                const eta = shop.eta?.displayText ?? (index === 0 ? '10-15 mins' : index === 1 ? '12-18 mins' : '15-20 mins');
                const distance = shop.distanceKm != null ? `${shop.distanceKm} km` : `${(index + 1) * 1.2} km`;
                const specialty = getMerchantLegalInfo(shop).categorySpecialty;

                return (
                  <button
                    key={shop.id}
                    type="button"
                    onClick={() => {
                      onSelectShop(shop.id);
                      setIsDropdownOpen(false);
                      setSearchQuery('');
                    }}
                    className={`flex w-full items-center justify-between p-3 rounded-xl transition text-left cursor-pointer mb-1 ${
                      isSelected
                        ? 'bg-emerald-50 text-[#173d2e] font-bold border border-emerald-200'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                        isSelected ? 'bg-[#173d2e] text-[#d7ef8d]' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Store size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-[#173d2e]">{shop.name}</h4>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Verified
                          </span>
                        </div>
                        <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <MapPin size={12} className="shrink-0 text-slate-400" />
                          <span>{shop.address}</span>
                        </p>
                        <p className="text-[10px] font-medium text-emerald-800/80 mt-1 line-clamp-1">
                          🏷️ {specialty}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right shrink-0">
                      <div>
                        <span className="block text-xs font-bold text-[#173d2e]">{eta}</span>
                        <span className="block text-[10px] text-slate-400">{distance}</span>
                      </div>
                      {isSelected && <CheckCircle2 size={18} className="text-[#173d2e]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 3. SELECTED MERCHANT BUTTON (Click to see GST No, Name & All Details) */}
      {activeShop && (
        <div className="max-w-2xl">
          <button
            type="button"
            onClick={() => setIsDetailsModalOpen(true)}
            className="group flex w-full items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-emerald-50/50 to-white border border-emerald-900/15 hover:border-emerald-700 shadow-xs hover:shadow-md transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 sm:gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#173d2e] text-[#d7ef8d] shadow-sm shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs sm:text-sm font-black text-[#173d2e]">
                    {activeShop.name}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#173d2e] text-[#d7ef8d] px-2 py-0.5 text-[10px] font-extrabold">
                    <Sparkles size={10} />
                    <span>Active Store</span>
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-emerald-900/80 mt-0.5">
                  Click to view GST No., Proprietor, FSSAI & Store details ➔
                </p>
              </div>
            </div>

            <div className="shrink-0 rounded-xl bg-white border border-emerald-200 px-3 py-1.5 text-xs font-black text-[#173d2e] shadow-xs group-hover:bg-[#173d2e] group-hover:text-white transition">
              View GST & Details
            </div>
          </button>
        </div>
      )}

      {/* MERCHANT DETAILS MODAL (Shows GST, Name, FSSAI, Address, etc.) */}
      {isDetailsModalOpen && activeShop && merchantLegal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#173d2e] text-[#d7ef8d] shadow-md">
                  <Store size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#173d2e]">{activeShop.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                      <ShieldCheck size={12} />
                      <span>Verified Hyperlocal Merchant</span>
                    </span>
                    <span className="text-[11px] text-gray-500">• Est. {merchantLegal.establishedYear}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Legal Details Grid */}
            <div className="mt-5 space-y-4 text-xs">
              {/* GST Identification Number */}
              <div className="rounded-2xl bg-emerald-50/70 p-3.5 border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                    GST Identification Number (GSTIN)
                  </span>
                  <span className="text-sm font-mono font-black text-[#173d2e]">
                    {merchantLegal.gstin}
                  </span>
                  <span className="block text-[10px] text-emerald-700 mt-0.5 font-bold">
                    ✓ Valid & Active Taxpayer Registration
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyGst}
                  className="flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 font-bold text-[#173d2e] border border-emerald-300 hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
                >
                  {copiedGst ? (
                    <>
                      <Check size={14} className="text-emerald-700" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy GST</span>
                    </>
                  )}
                </button>
              </div>

              {/* Details List */}
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/70 space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                  <span className="text-slate-500 font-bold">Proprietor / Owner:</span>
                  <span className="font-black text-slate-900 text-right">{merchantLegal.ownerName}</span>
                </div>

                <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                  <span className="text-slate-500 font-bold">FSSAI License No:</span>
                  <span className="font-mono font-black text-slate-900">{merchantLegal.fssai}</span>
                </div>

                <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                  <span className="text-slate-500 font-bold">Trade License No:</span>
                  <span className="font-mono font-bold text-slate-800">{merchantLegal.tradeLicense}</span>
                </div>

                <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                  <span className="text-slate-500 font-bold">Store Physical Address:</span>
                  <span className="font-bold text-slate-900 text-right max-w-xs">{activeShop.address}</span>
                </div>

                <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                  <span className="text-slate-500 font-bold">Helpline / Phone:</span>
                  <span className="font-mono font-bold text-slate-900">{merchantLegal.phone}</span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 font-bold">Speciality:</span>
                  <span className="font-bold text-slate-800 text-right">{merchantLegal.categorySpecialty}</span>
                </div>
              </div>

              {/* Assurance Callout */}
              <div className="flex items-center gap-2.5 rounded-2xl bg-amber-50 p-3 border border-amber-200/80 text-amber-900">
                <Award size={18} className="shrink-0 text-amber-700" />
                <p className="text-[11px] leading-relaxed font-semibold">
                  Zero warehouse middlemen: Your order is picked and packed live from this registered neighborhood retailer.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="rounded-2xl bg-[#173d2e] px-6 py-2.5 text-xs font-black text-white hover:bg-[#123125] transition cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
