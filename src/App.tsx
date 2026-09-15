import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Heart, LogOut, MapPin, Plus, ShoppingBag, Store, ShieldCheck, Sparkles, AlertCircle, ChefHat, ChevronRight, FileText, Milk, Zap } from 'lucide-react';
import { api, type ApiAddress, type ApiDeliverySlot, type ApiOrder, type ApiProduct, type ApiShop, type PaymentMethod, type Role } from './services/api';
import { OperationsDashboard } from './components/OperationsDashboard';
import { DeliveryDashboard } from './components/DeliveryDashboard';
import { CustomerOrders } from './components/CustomerOrders';
import { MultiShopCartModal } from './components/MultiShopCartModal';
import { BlinkitSearchBar } from './components/BlinkitSearchBar';
import { LocationModal } from './components/LocationModal';
import { BlinkitHero } from './components/BlinkitHero';
import { BlinkitMerchantSelector } from './components/BlinkitMerchantSelector';
import { BlinkitCategoryRail, type BlinkitCategory } from './components/BlinkitCategoryRail';
import { BlinkitFixedBottomBar, type BottomNavTab } from './components/BlinkitFixedBottomBar';
import { BlinkitFooter } from './components/BlinkitFooter';
import { MenuDrawerModal } from './components/MenuDrawerModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { RecipeBundlesModal } from './components/RecipeBundlesModal';
import { SmartQuickListModal } from './components/SmartQuickListModal';
import { CategoryPageView } from './components/CategoryPageView';
import {
  cartUpdatedEventName,
  loadCart,
  saveCart,
  getCartShopId,
  addItemToCart,
  clearCart
} from './services/cart';

type ViewRole = Extract<Role, 'customer' | 'shopkeeper' | 'employee' | 'admin'>;
const emoji: Record<string, string> = {
  Fruits: '🥭',
  Vegetables: '🥬',
  'Dairy & Eggs': '🥛',
  Pantry: '🍞',
  Snacks: '🥜',
  Beverages: '🥥',
  Household: '🧴'
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load Razorpay Checkout'));
    document.head.appendChild(script);
  });
}

function roleFromStorage(): ViewRole {
  const role = localStorage.getItem('freshcart_role');
  return role === 'shopkeeper' || role === 'employee' || role === 'admin' ? role : 'customer';
}

function isAuthFailure(error: unknown) {
  return (
    error instanceof Error &&
    /authentication required|invalid credentials|token|unauthorized|\b401\b/i.test(error.message)
  );
}

export default function App() {
  const [role] = useState<ViewRole>(() => roleFromStorage());
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [shops, setShops] = useState<ApiShop[]>([]);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(() => getCartShopId());

  // Location state
  const [deliveryLocation, setDeliveryLocation] = useState('Connaught Place, Central Delhi');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Search, Category, Active Navigation Tab
  const [category, setCategory] = useState<BlinkitCategory>('All');
  const [viewingCategory, setViewingCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<BottomNavTab>('home');

  const [cart, setCart] = useState<Record<string, number>>(() => loadCart());
  const [liked, setLiked] = useState<string[]>([]);
  const [checkout, setCheckout] = useState(false);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);

  // Single-shop conflict modal state
  const [conflictModal, setConflictModal] = useState<{
    isOpen: boolean;
    pendingProductId: string;
    currentShopId: string;
    newShopId: string;
  }>({
    isOpen: false,
    pendingProductId: '',
    currentShopId: '',
    newShopId: ''
  });

  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isQuickListModalOpen, setIsQuickListModalOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2500);
  };

  useEffect(() => {
    const sync = () => {
      setCart(loadCart());
      setSelectedShopId(getCartShopId());
    };
    window.addEventListener(cartUpdatedEventName(), sync);
    return () => window.removeEventListener(cartUpdatedEventName(), sync);
  }, []);

  useEffect(() => {
    let alive = true;
    const token = localStorage.getItem('freshcart_token');
    if (!token) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        await api.me();
      } catch (error) {
        if (isAuthFailure(error)) {
          localStorage.removeItem('freshcart_token');
          localStorage.removeItem('freshcart_role');
          window.dispatchEvent(new Event('freshcart:auth_changed'));
          return;
        }
        console.warn('FreshCart session check postponed:', error);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const hasToken = Boolean(localStorage.getItem('freshcart_token'));
      const fetchOrders = hasToken
        ? role === 'customer'
          ? api.customerOrders()
          : api.orders()
        : Promise.resolve([]);

      const results = await Promise.allSettled([
        api.products(),
        api.shops({ lat: 28.6304, lng: 77.2177 }),
        fetchOrders
      ]);
      if (!alive) return;
      const [productsResult, shopsResult, ordersResult] = results;
      if (productsResult.status === 'fulfilled') {
        setProducts(productsResult.value);
      } else console.warn('FreshCart products bootstrap postponed:', productsResult.reason);
      if (shopsResult.status === 'fulfilled') {
        setShops(shopsResult.value);
        if (!selectedShopId && shopsResult.value.length > 0) {
          setSelectedShopId(shopsResult.value[0].id);
        }
      } else console.warn('FreshCart shops bootstrap postponed:', shopsResult.reason);
      if (ordersResult.status === 'fulfilled') setOrders(ordersResult.value);
      else console.warn('FreshCart orders bootstrap postponed:', ordersResult.reason);
    })();
    return () => {
      alive = false;
    };
  }, [role]);

  // Primary catalog filtering matching selected merchant, category, and query
  const filtered = useMemo(() => {
    return products.filter(p => {
      let matchesCategory = category === 'All';
      if (!matchesCategory) {
        if (p.category === category) {
          matchesCategory = true;
        } else {
          // Category mapping for Blinkit 20 grid categories to catalog items
          const catMap: Record<string, string[]> = {
            'Dairy, Bread & Eggs': ['Dairy & Eggs', 'Pantry'],
            'Fruits & Vegetables': ['Fruits', 'Vegetables'],
            'Cold Drinks & Juices': ['Beverages'],
            'Snacks & Munchies': ['Snacks'],
            'Breakfast & Instant Food': ['Pantry', 'Snacks'],
            'Sweet Tooth': ['Snacks', 'Dairy & Eggs'],
            'Bakery & Biscuits': ['Pantry', 'Snacks'],
            'Tea, Coffee & Milk Drinks': ['Beverages', 'Pantry', 'Dairy & Eggs'],
            'Atta, Rice & Dal': ['Pantry'],
            'Masala, Oil & More': ['Pantry'],
            'Sauces & Spreads': ['Pantry'],
            'Organic & Healthy Living': ['Pantry', 'Fruits', 'Vegetables'],
            'Cleaning Essentials': ['Household'],
            'Home & Office': ['Household'],
            'Personal Care': ['Household'],
            'Pet Care': ['Pantry', 'Household'],
            'Baby Care': ['Household', 'Dairy & Eggs'],
            'Pharma & Wellness': ['Household'],
            'Paan Corner': ['Snacks', 'Beverages'],
            'Chicken, Meat & Fish': ['Pantry', 'Dairy & Eggs']
          };
          const mapped = catMap[category];
          if (mapped && mapped.includes(p.category)) {
            matchesCategory = true;
          } else if (
            p.name.toLowerCase().includes(category.toLowerCase()) ||
            p.category.toLowerCase().includes(category.toLowerCase()) ||
            category.toLowerCase().includes(p.category.toLowerCase())
          ) {
            matchesCategory = true;
          }
        }
      }
      const matchesQuery = !query || p.name.toLowerCase().includes(query.toLowerCase());
      const matchesShop = !selectedShopId || p.shopId === selectedShopId;
      return matchesCategory && matchesQuery && matchesShop;
    });
  }, [products, category, query, selectedShopId]);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, quantity]) => ({
          product: products.find(p => p.id === id),
          quantity
        }))
        .filter(
          (x): x is { product: ApiProduct; quantity: number } =>
            Boolean(x.product && (x.quantity as number) > 0)
        ),
    [cart, products]
  );
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (id: string) => {
    const product = products.find(p => p.id === id);
    const itemShopId = product?.shopId || selectedShopId || undefined;
    const result = addItemToCart(id, 1, itemShopId, false);

    if (!result.success && result.conflict) {
      setConflictModal({
        isOpen: true,
        pendingProductId: id,
        currentShopId: result.conflict.currentShopId,
        newShopId: result.conflict.newShopId
      });
    } else {
      setCart(loadCart());
      flash(`Added ${product?.name || 'item'} to cart`);
    }
  };

  const handleClearAndSwitch = () => {
    if (conflictModal.pendingProductId) {
      const product = products.find(p => p.id === conflictModal.pendingProductId);
      addItemToCart(conflictModal.pendingProductId, 1, conflictModal.newShopId, true);
      setSelectedShopId(conflictModal.newShopId);
      setCart(loadCart());
      flash(`Cart refreshed with ${product?.name || 'item'}`);
    }
    setConflictModal({ isOpen: false, pendingProductId: '', currentShopId: '', newShopId: '' });
  };

  const handleKeepCurrent = () => {
    setConflictModal({ isOpen: false, pendingProductId: '', currentShopId: '', newShopId: '' });
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {}
    localStorage.removeItem('freshcart_token');
    localStorage.removeItem('freshcart_role');
    window.dispatchEvent(new Event('freshcart:auth_changed'));
  };

  const refreshOrders = async () =>
    setOrders(role === 'customer' ? await api.customerOrders() : await api.orders());

  const currentShopName =
    shops.find(s => s.id === (conflictModal.currentShopId || getCartShopId()))?.name || 'current store';
  const newShopName = shops.find(s => s.id === conflictModal.newShopId)?.name || 'new store';
  const activeSelectedShop = shops.find(s => s.id === selectedShopId) || shops[0];

  return (
    <div className="min-h-screen bg-[#f7f8f4] text-[#203229] pb-24">
      {/* 
        ============================================================
        TOP BAR: APP NAME IN THE CENTER
        ============================================================
      */}
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur-md shadow-xs">
        {/* Tier 1: Centered App Name */}
        <div className="border-b border-slate-100 py-2.5 px-4">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between">
            {/* Left side: Leaf Logo & 15-Min Delivery badge (Click to return to main screen) */}
            <div
              onClick={() => {
                setActiveTab('home');
                setCategory('All');
                setViewingCategory(null);
                setQuery('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              title="FreshCart Home"
              className="flex items-center gap-2.5 cursor-pointer group select-none"
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#173d2e] text-lg shadow-sm select-none group-hover:scale-105 group-hover:bg-[#123024] transition-all"
              >
                🌿
              </div>
              <div className="text-xs font-black text-[#173d2e] group-hover:text-emerald-800 transition-colors">
                <span className="hidden sm:inline">15-Min Delivery</span>
              </div>
            </div>

            {/* APP NAME IN THE CENTER (Click to return to main screen) */}
            <div
              onClick={() => {
                setActiveTab('home');
                setCategory('All');
                setViewingCategory(null);
                setQuery('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              title="FreshCart Home"
              className="flex items-center cursor-pointer select-none text-center group"
            >
              <div>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-[#173d2e] uppercase font-sans group-hover:text-emerald-800 transition-colors">
                  FreshCart
                </span>
                <span className="hidden md:inline ml-2 text-[10px] font-extrabold uppercase tracking-widest text-[#5c8a6f]">
                  • Local & Fast
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden rounded-xl bg-slate-100 px-2.5 py-1 text-[11px] font-black capitalize text-[#315245] sm:inline">
                {role === 'admin' ? 'Admin ERP' : role === 'employee' ? 'Rider' : 'Customer'}
              </span>
              <button
                onClick={() => void logout()}
                title="Sign out"
                className="rounded-xl p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* 
          ============================================================
          TIER 2: UNDER IT SEARCH BAR, LEFT SIDE LOCATION LOGO, SIDE OF SEARCH BAR CART OPTION
          (Hidden when viewing a specific Category Page, visible on home/other screens)
          ============================================================
        */}
        {role === 'customer' && !viewingCategory && (
          <div className="mx-auto max-w-[1500px] px-4 py-2.5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* ON THE LEFT SIDE OF SEARCH BAR: LOCATION LOGO ONLY, CLICK TO SEE/CHANGE LOCATION */}
              <button
                id="location-picker-button"
                onClick={() => setIsLocationModalOpen(true)}
                title="Click to view or change your delivery location"
                className="group flex h-11 sm:h-12 items-center gap-1.5 rounded-2xl border border-emerald-950/10 bg-emerald-50/70 px-3 sm:px-4 text-xs font-black text-[#173d2e] shadow-xs hover:bg-emerald-100 hover:border-emerald-300 transition-all shrink-0"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#173d2e] text-white">
                  <MapPin size={15} />
                </div>
                <div className="hidden text-left md:block max-w-[140px] truncate">
                  <p className="text-[9px] font-black uppercase tracking-wider text-[#3b7a5d]">
                    Delivery Area
                  </p>
                  <p className="truncate text-xs font-extrabold text-[#173d2e]">{deliveryLocation}</p>
                </div>
              </button>

              {/* CENTER: SEARCH BAR WITH TYPO SEARCH & SEARCH HISTORY */}
              <div className="flex-1 min-w-0">
                <BlinkitSearchBar
                  query={query}
                  onQueryChange={val => {
                    setQuery(val);
                    if (val && activeTab !== 'home') setActiveTab('home');
                    if (val && viewingCategory) setViewingCategory(null);
                  }}
                  products={products}
                  onSelectProduct={p => {
                    handleAddToCart(p.id);
                  }}
                  onAddToCart={p => {
                    handleAddToCart(p.id);
                  }}
                />
              </div>

              {/* SIDE OF SEARCH BAR: CART OPTION */}
              <button
                id="header-cart-button"
                onClick={() => setCheckout(true)}
                className="relative flex h-11 sm:h-12 items-center gap-2 rounded-2xl bg-[#173d2e] px-3.5 sm:px-5 text-white shadow-md hover:bg-[#123024] transition-transform active:scale-95 shrink-0"
              >
                <div className="relative">
                  <ShoppingBag size={18} />
                  {count > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d7ef8d] px-1 text-[9px] font-black text-[#173d2e]">
                      {count}
                    </span>
                  )}
                </div>
                <div className="hidden sm:block text-left text-xs font-black">
                  <p className="leading-tight">₹{subtotal.toFixed(0)}</p>
                  <p className="text-[9px] text-emerald-200 font-bold">{count} items</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 
        ============================================================
        ROLE SWITCH: EMPLOYEE / ADMIN vs CUSTOMER
        ============================================================
      */}
      {role === 'employee' ? (
        <DeliveryDashboard flash={flash} />
      ) : role === 'admin' || role === 'shopkeeper' ? (
        <OperationsDashboard orders={orders} mode={role} onRefresh={refreshOrders} flash={flash} />
      ) : activeTab === 'orders' ? (
        <div className="pt-4">
          <CustomerOrders flash={flash} />
        </div>
      ) : activeTab === 'merchants' ? (
        <div className="pt-4">
          <BlinkitMerchantSelector
            shops={shops}
            selectedShopId={selectedShopId}
            onSelectShop={id => {
              setSelectedShopId(id);
              flash(`Selected ${shops.find(s => s.id === id)?.name || 'store'}`);
              setActiveTab('home');
            }}
            selectedCategory={category}
            onSelectCategory={cat => {
              setCategory(cat);
              setViewingCategory(cat);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      ) : viewingCategory ? (
        <CategoryPageView
          categoryName={viewingCategory}
          onBack={() => {
            setViewingCategory(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSelectCategory={cat => {
            setViewingCategory(cat);
            setCategory(cat);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          products={products}
          shops={shops}
          selectedShopId={selectedShopId}
          onSelectShop={id => {
            setSelectedShopId(id);
            flash(`Selected store: ${shops.find(s => s.id === id)?.name || 'store'}`);
          }}
          cart={cart}
          liked={liked}
          onLike={id =>
            setLiked(liked.includes(id) ? liked.filter(x => x !== id) : [...liked, id])
          }
          onAddToCart={handleAddToCart}
          onUpdateQuantity={(id, qty) => {
            if (qty <= 0) {
              const updated = { ...cart };
              delete updated[id];
              setCart(updated);
              saveCart(updated);
            } else {
              const updated = { ...cart, [id]: qty };
              setCart(updated);
              saveCart(updated);
            }
          }}
          onOpenCart={() => setCheckout(true)}
          subtotal={subtotal}
          cartCount={count}
        />
      ) : (
        /* 
          ============================================================
          PRIMARY BLINKIT / ZEPTO HOMEPAGE WORKFLOW:
          1. Hero Screen displaying products on big screen
          2. Choose your local merchant (4 closest local merchants)
          3. Shop by category option
          4. Some common items / Fresh Picks
          5. Smart Suggestions
          6. Contact us & all necessary footer options
          ============================================================
        */
        <main className="space-y-4">
          {/* SECTION 1: HERO SCREEN WHERE PRODUCTS DISPLAY ON BIG SCREEN */}
          <BlinkitHero
            onShopNow={() => {
              document.getElementById('fresh-picks')?.scrollIntoView({ behavior: 'smooth' });
            }}
            deliveryMinutes={activeSelectedShop?.eta?.displayText ?? '10-15 mins'}
            products={products}
            onAddToCart={handleAddToCart}
          />

          {/* SECTION 2: CHOOSE YOUR LOCAL MERCHANT */}
          <BlinkitMerchantSelector
            shops={shops}
            selectedShopId={selectedShopId}
            onSelectShop={id => {
              setSelectedShopId(id);
              flash(`Selected store: ${shops.find(s => s.id === id)?.name || 'store'}`);
            }}
            selectedCategory={category}
            onSelectCategory={cat => {
              setCategory(cat);
              setViewingCategory(cat);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />

          {/* Active store indicator banner */}
          <div className="mx-auto max-w-[1500px] px-4 pt-2 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-3.5 border border-emerald-950/5 shadow-xs">
              <div className="flex items-center gap-2">
                <Store size={18} className="text-[#173d2e]" />
                <span className="text-xs font-black text-[#173d2e]">
                  Currently browsing inventory of{' '}
                  <span className="underline decoration-[#3b7a5d]">{activeSelectedShop?.name}</span>
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  {activeSelectedShop?.eta?.displayText ?? '15 mins'} ETA
                </span>
              </div>
              {count > 0 && (
                <div className="flex items-center gap-1 text-xs font-bold text-amber-800">
                  <AlertCircle size={14} />
                  <span>Cart locked to {currentShopName}</span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: SHOP BY CATEGORY OPTION */}
          <BlinkitCategoryRail
            selectedCategory={category}
            onSelectCategory={cat => {
              setCategory(cat);
              setViewingCategory(cat);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />

          {/* SECTION 4: SOME COMMON ITEMS / LIVE STORE INVENTORY */}
          <section id="fresh-picks" className="mx-auto max-w-[1500px] px-4 pt-8 sm:px-6 lg:px-8">
            <div className="border-b border-slate-200/70 pb-3 mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#6f8277]">
                {category === 'All' ? 'Everyday Essentials' : category}
              </span>
              <h3 className="text-2xl font-black tracking-tight text-[#173d2e]">
                Common Everyday Items & Fresh Picks
              </h3>
            </div>

            {filtered.length > 0 ? (
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:gap-6">
                {filtered.map(p => (
                  <ProductCard
                    key={p.id}
                    p={p}
                    liked={liked.includes(p.id)}
                    onLike={() =>
                      setLiked(liked.includes(p.id) ? liked.filter(x => x !== p.id) : [...liked, p.id])
                    }
                    add={() => handleAddToCart(p.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl bg-white p-12 text-center border border-dashed border-slate-200">
                <p className="text-sm font-bold text-slate-500">
                  No items in this category currently stocked at {activeSelectedShop?.name}.
                </p>
                <button
                  onClick={() => setCategory('All')}
                  className="mt-3 rounded-2xl bg-[#173d2e] px-4 py-2 text-xs font-extrabold text-white"
                >
                  View All Store Products
                </button>
              </div>
            )}
          </section>

          {/* SECTION 6: CONTACT US & NECESSARY OPTIONS FOOTER */}
          <BlinkitFooter />
        </main>
      )}

      {/* 
        ============================================================
        FIXED BOTTOM BAR: SWITCH TABS, QUICK SUGGESTIONS & CART BANNER
        ============================================================
      */}
      {role === 'customer' && (
        <BlinkitFixedBottomBar
          currentTab={isSubscriptionModalOpen ? 'subscriptions' : activeTab}
          onSelectTab={tab => {
            if (tab === 'cart') {
              setCheckout(true);
            } else if (tab === 'menu') {
              setIsMenuModalOpen(true);
            } else if (tab === 'subscriptions') {
              setIsSubscriptionModalOpen(true);
            } else {
              setActiveTab(tab);
              if (tab === 'home') {
                setViewingCategory(null);
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          cartCount={count}
          cartSubtotal={subtotal}
          onOpenCart={() => setCheckout(true)}
        />
      )}

      {/* MENU DRAWER MODAL (Holds Daily Subscriptions, Recipe Bundles, Smart Quick-List, etc.) */}
      <MenuDrawerModal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        onOpenSubscriptions={() => setIsSubscriptionModalOpen(true)}
        onOpenRecipes={() => setIsRecipeModalOpen(true)}
        onOpenQuickList={() => setIsQuickListModalOpen(true)}
        onOpenMerchants={() => {
          setActiveTab('merchants');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenOrders={() => {
          setActiveTab('orders');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenLocation={() => setIsLocationModalOpen(true)}
      />

      {/* LOCATION SELECTOR MODAL */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentAddress={deliveryLocation}
        onSelectAddress={(addr, coords) => {
          setDeliveryLocation(addr);
          flash(`Delivery address updated to ${addr}`);
          if (coords) {
            api.shops(coords).then(setShops).catch(() => {});
          }
        }}
      />

      {/* DAILY SUBSCRIPTION MODAL */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        products={products}
        flash={flash}
      />

      {/* 1-CLICK COOK RECIPE BUNDLES MODAL */}
      <RecipeBundlesModal
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
        products={products}
        selectedShopId={selectedShopId}
        onAddedToCart={() => {
          setCart(loadCart());
          setSelectedShopId(getCartShopId());
        }}
        flash={flash}
      />

      {/* SMART QUICK-LIST & VOICE MODAL */}
      <SmartQuickListModal
        isOpen={isQuickListModalOpen}
        onClose={() => setIsQuickListModalOpen(false)}
        products={products}
        selectedShopId={selectedShopId}
        onAddedToCart={() => {
          setCart(loadCart());
          setSelectedShopId(getCartShopId());
        }}
        flash={flash}
      />

      {/* CHECKOUT MODAL */}
      {checkout && (
        <Checkout
          cartItems={cartItems}
          subtotal={subtotal}
          shops={shops}
          close={() => setCheckout(false)}
          onSuccess={order => {
            clearCart();
            setCart({});
            setOrders(current => [order, ...current]);
            setCheckout(false);
            flash(`Order ${order.id} placed successfully! Rider dispatching soon.`);
          }}
        />
      )}

      {/* SINGLE-SHOP CONFLICT MODAL */}
      <MultiShopCartModal
        isOpen={conflictModal.isOpen}
        currentShopName={currentShopName}
        newShopName={newShopName}
        onClearAndSwitch={handleClearAndSwitch}
        onKeepCurrent={handleKeepCurrent}
      />

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#173d2e] px-5 py-3 text-xs font-black text-white shadow-2xl border border-white/20 animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </div>
  );
}

function ProductCard({
  p,
  liked,
  onLike,
  add
}: {
  p: ApiProduct;
  liked: boolean;
  onLike: () => void;
  add: () => void;
  key?: string;
}) {
  const discountPercent = p.mrp > p.sellingPrice 
    ? Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100) 
    : 0;

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 p-2.5 sm:p-4 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div>
        <div className="relative aspect-square w-full overflow-hidden rounded-xl sm:rounded-2xl bg-[#f4f7f2] flex items-center justify-center text-3xl sm:text-5xl">
          {p.imageUrl ? (
            <img
              src={p.imageUrl}
              alt={p.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <span>{emoji[p.category] ?? '🛒'}</span>
          )}
          <button
            onClick={onLike}
            className="absolute right-1.5 top-1.5 sm:right-2.5 sm:top-2.5 rounded-lg sm:rounded-xl bg-white/90 p-1 sm:p-2 text-[#517362] shadow-xs hover:bg-white transition-colors cursor-pointer"
            aria-label="Favorite product"
          >
            <Heart size={14} fill={liked ? 'currentColor' : 'none'} className="sm:w-4 sm:h-4" />
          </button>
          <span className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 rounded-md sm:rounded-lg bg-white/95 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-black text-slate-700 shadow-xs">
            {p.unit}
          </span>
          {discountPercent > 0 && (
            <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 rounded-md sm:rounded-lg bg-[#173d2e] px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-black text-[#d7ef8d] shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        <div className="mt-2 sm:mt-3">
          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">
            {p.category}
          </span>
          <h4 className="mt-0.5 sm:mt-1 line-clamp-2 min-h-[30px] sm:min-h-10 text-xs sm:text-sm md:text-base font-black leading-tight sm:leading-snug text-[#173d2e]">
            {p.name}
          </h4>
        </div>
      </div>

      <div className="mt-2.5 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 border-t border-slate-100 pt-2 sm:pt-3">
        <div className="flex items-baseline gap-1">
          <span className="text-sm sm:text-base md:text-lg font-black text-[#173d2e]">₹{p.sellingPrice}</span>
          {p.mrp > p.sellingPrice && (
            <span className="text-[9px] sm:text-xs text-slate-400 line-through">₹{p.mrp}</span>
          )}
        </div>
        <button
          disabled={!p.stock}
          onClick={add}
          className="flex h-7 sm:h-9 items-center justify-center gap-1 rounded-lg sm:rounded-xl bg-emerald-50 px-2 sm:px-3 text-[10px] sm:text-xs font-black text-[#173d2e] border border-emerald-200/90 hover:bg-[#173d2e] hover:text-white transition-all active:scale-95 disabled:opacity-40 cursor-pointer w-full sm:w-auto"
        >
          <Plus size={12} className="sm:w-3.5 sm:h-3.5" />
          <span>ADD</span>
        </button>
      </div>
    </article>
  );
}

function Checkout({
  cartItems,
  subtotal,
  shops,
  close,
  onSuccess
}: {
  cartItems: { product: ApiProduct; quantity: number }[];
  subtotal: number;
  shops: ApiShop[];
  close: () => void;
  onSuccess: (order: ApiOrder) => void;
}) {
  const [fulfilment, setFulfilment] = useState<'DELIVERY' | 'SELF_PICKUP'>('DELIVERY');
  const [addresses, setAddresses] = useState<ApiAddress[]>([]);
  const [slots, setSlots] = useState<ApiDeliverySlot[]>([]);
  const [addressId, setAddressId] = useState('');
  const [slotId, setSlotId] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('UPI');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newAddress, setNewAddress] = useState(false);
  const [line1, setLine1] = useState('');

  useEffect(() => {
    void Promise.all([api.addresses(), api.deliverySlots()])
      .then(([a, s]) => {
        setAddresses(a);
        setSlots(s);
        setAddressId(a.find(x => x.isDefault)?.id ?? a[0]?.id ?? '');
        setSlotId(s.find(x => x.active && x.booked < s.capacity)?.id ?? s[0]?.id ?? '');
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Unable to load checkout'));
  }, []);

  const shopId = cartItems[0]?.product.shopId ?? shops.find(s => s.active)?.id ?? '';
  const currentShop = shops.find(s => s.id === shopId);

  const submit = async () => {
    setError('');
    if (!cartItems.length) return setError('Your cart is empty.');
    if (!shopId) return setError('No store is available for this cart.');
    if (fulfilment === 'DELIVERY') {
      if (!addressId && !newAddress) return setError('Select a delivery address.');
      if (!slotId) return setError('Select a delivery slot.');
    }
    setSaving(true);
    try {
      // Real-time server-side cart inventory and merchant validation
      const validation = await api.validateCart(
        shopId,
        cartItems.map(x => ({ productId: x.product.id, quantity: x.quantity }))
      );
      if (!validation.valid) {
        throw new Error(
          validation.message || 'Cart items are no longer available in the requested quantities.'
        );
      }

      let order: ApiOrder;
      if (fulfilment === 'SELF_PICKUP') {
        order = await api.createPickupOrder({
          shopId,
          items: cartItems.map(x => ({ productId: x.product.id, quantity: x.quantity })),
          paymentMethod: payment === 'COD' ? 'PAY_AT_SHOP' : (payment as 'PAY_AT_SHOP' | 'UPI' | 'CARD')
        });
      } else {
        let selected = addressId;
        if (newAddress) {
          if (!line1.trim()) throw new Error('Enter the new delivery address.');
          const created = await api.addAddress({
            label: 'HOME',
            line1: line1.trim(),
            city: 'New Delhi',
            state: 'Delhi',
            postalCode: '110001',
            isDefault: addresses.length === 0
          });
          selected = created.id;
        }
        order = await api.createOrder({
          shopId,
          addressId: selected,
          deliverySlotId: slotId,
          paymentMethod: payment,
          items: cartItems.map(x => ({ productId: x.product.id, quantity: x.quantity }))
        });
      }

      if (payment !== 'COD' && (payment as string) !== 'PAY_AT_SHOP') {
        await loadRazorpay();
        const paymentOrder = await api.createPaymentOrder(order.id);
        await new Promise<void>((resolve, reject) => {
          if (!window.Razorpay) return reject(new Error('Razorpay Checkout is unavailable'));
          const checkoutInstance = new window.Razorpay({
            key: paymentOrder.keyId,
            amount: paymentOrder.amount,
            currency: paymentOrder.currency,
            name: 'FreshCart',
            description: `FreshCart order ${order.id}`,
            order_id: paymentOrder.orderId,
            handler: async (response: any) => {
              try {
                await api.verifyPayment({
                  orderId: order.id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature
                });
                resolve();
              } catch (e) {
                reject(e);
              }
            },
            modal: { ondismiss: () => reject(new Error('Payment was cancelled.')) }
          });
          checkoutInstance.open();
        });
      }
      onSuccess(order);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#f7f7f2] p-5 shadow-2xl sm:p-7 border border-slate-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#3b7a5d]">
              Quick Commerce Checkout
            </p>
            <h2 className="text-xl font-black text-[#173d2e]">Complete Your Order</h2>
            {currentShop && (
              <p className="mt-0.5 text-xs text-[#52655b]">
                Store: <strong>{currentShop.name}</strong> • ETA:{' '}
                {currentShop.eta?.displayText ?? '15-25 mins'}
              </p>
            )}
          </div>
          <button
            onClick={close}
            className="rounded-xl bg-white px-3 py-1.5 text-xs font-extrabold text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* FULFILMENT METHOD SELECTION */}
          <div>
            <label className="block text-xs font-extrabold text-[#315245] mb-2">
              Choose Order Fulfilment
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setFulfilment('DELIVERY');
                  if ((payment as string) === 'PAY_AT_SHOP') setPayment('UPI');
                }}
                className={`flex items-center gap-3 rounded-2xl p-3.5 text-left transition-all border ${
                  fulfilment === 'DELIVERY'
                    ? 'border-[#173d2e] bg-[#173d2e] text-white shadow-sm ring-2 ring-[#173d2e]/10'
                    : 'border-slate-200 bg-white text-[#315245] hover:bg-slate-50'
                }`}
              >
                <div className="text-2xl">🛵</div>
                <div>
                  <div className="text-xs font-black">Doorstep Delivery</div>
                  <div className={`text-[10px] ${fulfilment === 'DELIVERY' ? 'text-emerald-200' : 'text-slate-500'}`}>
                    15–25 min direct delivery
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFulfilment('SELF_PICKUP');
                  setPayment('PAY_AT_SHOP');
                }}
                className={`flex items-center gap-3 rounded-2xl p-3.5 text-left transition-all border ${
                  fulfilment === 'SELF_PICKUP'
                    ? 'border-[#173d2e] bg-[#173d2e] text-white shadow-sm ring-2 ring-[#173d2e]/10'
                    : 'border-slate-200 bg-white text-[#315245] hover:bg-slate-50'
                }`}
              >
                <div className="text-2xl">🏪</div>
                <div>
                  <div className="text-xs font-black">Self Pickup</div>
                  <div className={`text-[10px] ${fulfilment === 'SELF_PICKUP' ? 'text-emerald-200' : 'text-slate-500'}`}>
                    Pickup from store • ₹0 fee
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* DELIVERY OPTIONS: ADDRESS & SLOT */}
          {fulfilment === 'DELIVERY' ? (
            <>
              <label className="block text-xs font-extrabold text-[#315245]">
                Delivery Address
                <select
                  value={addressId}
                  onChange={e => {
                    setAddressId(e.target.value);
                    setNewAddress(!e.target.value);
                  }}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-semibold outline-none focus:border-[#173d2e]"
                >
                  <option value="">+ Add a new delivery address</option>
                  {addresses.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.label} — {a.line1}
                    </option>
                  ))}
                </select>
              </label>

              {newAddress && (
                <input
                  value={line1}
                  onChange={e => setLine1(e.target.value)}
                  placeholder="Flat / House / Floor / Locality landmark"
                  className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-semibold outline-none focus:border-[#173d2e]"
                />
              )}

              <label className="block text-xs font-extrabold text-[#315245]">
                Delivery Time Slot
                <select
                  value={slotId}
                  onChange={e => setSlotId(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-semibold outline-none focus:border-[#173d2e]"
                >
                  {slots
                    .filter(s => s.active && s.booked < s.capacity)
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.date} • {s.startTime}–{s.endTime} ({s.label})
                      </option>
                    ))}
                </select>
              </label>
            </>
          ) : (
            /* SELF PICKUP DETAILS */
            <div className="rounded-2xl bg-[#eef5e8] border border-emerald-200/80 p-4 text-xs">
              <div className="flex items-center gap-2 font-black text-[#173d2e]">
                <span className="text-base">🏪</span> Store Pickup Counter
              </div>
              <div className="mt-1.5 font-bold text-slate-800 text-sm">
                {currentShop?.name || 'Local FreshCart Partner Store'}
              </div>
              <div className="mt-0.5 text-xs text-slate-600">
                {typeof currentShop?.address === 'string' ? currentShop.address : 'Store Counter, Main Market, New Delhi'}
              </div>
              <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-white/80 p-2 text-[11px] font-bold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Order will be ready for pickup in 10–15 mins. A 6-digit pickup verification code will be generated on confirmation.
              </div>
            </div>
          )}

          {/* PAYMENT METHOD SELECTION */}
          <div>
            <div className="text-xs font-extrabold text-[#315245]">
              Payment Option {fulfilment === 'SELF_PICKUP' ? '(Store Pickup)' : '(Delivery)'}
            </div>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {fulfilment === 'DELIVERY'
                ? (['UPI', 'CARD', 'COD'] as PaymentMethod[]).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPayment(method)}
                      className={`rounded-2xl p-3 text-xs font-black transition-all ${
                        payment === method
                          ? 'bg-[#173d2e] text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-[#315245] hover:bg-slate-50'
                      }`}
                    >
                      {method === 'UPI' ? '⚡ UPI Instant' : method === 'CARD' ? '💳 Card' : '💵 Cash on Delivery'}
                    </button>
                  ))
                : (['PAY_AT_SHOP', 'UPI', 'CARD'] as PaymentMethod[]).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPayment(method)}
                      className={`rounded-2xl p-3 text-xs font-black transition-all ${
                        payment === method
                          ? 'bg-[#173d2e] text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-[#315245] hover:bg-slate-50'
                      }`}
                    >
                      {method === 'PAY_AT_SHOP'
                        ? '🏪 Pay at Store'
                        : method === 'UPI'
                        ? '⚡ UPI Instant'
                        : '💳 Card'}
                    </button>
                  ))}
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 p-3 text-xs font-bold text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between rounded-2xl bg-white p-4 border border-slate-200/60 shadow-xs">
            <div>
              <span className="text-xs font-bold text-slate-500">Total Payable</span>
              <p className="text-[10px] text-emerald-700 font-bold">
                {fulfilment === 'SELF_PICKUP'
                  ? '₹0 Delivery Fee • Store Pickup'
                  : 'Includes GST & Local Rider charges'}
              </p>
            </div>
            <span className="text-2xl font-black text-[#173d2e]">₹{subtotal.toFixed(0)}</span>
          </div>

          <button
            disabled={saving}
            onClick={() => void submit()}
            className="w-full rounded-2xl bg-[#173d2e] p-4 text-sm font-black text-white shadow-lg hover:bg-[#123024] disabled:opacity-50 transition-all active:scale-[0.99]"
          >
            {saving
              ? 'Processing Order…'
              : fulfilment === 'SELF_PICKUP'
              ? 'Confirm Store Pickup Order'
              : 'Place Hyperlocal Order Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
