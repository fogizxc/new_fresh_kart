import { useMemo, useState } from 'react';
import { FileText, Printer, Search, ShoppingCart, Trash2 } from 'lucide-react';
import type { ApiOrder, ApiProduct } from '../services/api';

type POSLine = { product: ApiProduct; quantity: number };

type ShopkeeperPOSProps = {
  products: ApiProduct[];
  orders: ApiOrder[];
};

const money = (value: number) => `₹${value.toFixed(2)}`;

export function ShopkeeperPOS({ products, orders }: ShopkeeperPOSProps) {
  const [mode, setMode] = useState<'pos' | 'orders'>('pos');
  const [query, setQuery] = useState('');
  const [lines, setLines] = useState<POSLine[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);

  const visibleProducts = useMemo(() => products.filter(product =>
    !query || `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase())
  ), [products, query]);

  const subtotal = lines.reduce((sum, line) => sum + line.product.sellingPrice * line.quantity, 0);

  const addProduct = (product: ApiProduct) => {
    setLines(current => {
      const existing = current.find(line => line.product.id === product.id);
      if (existing) return current.map(line => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line);
      return [...current, { product, quantity: 1 }];
    });
  };

  const printInvoice = (order?: ApiOrder) => {
    if (!order && lines.length === 0) return;
    const printable = order ? `Order #${order.id}` : 'Walk-in POS Sale';
    window.document.title = printable;
    window.print();
  };

  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#5c8a6f]">Shopkeeper tools</p>
          <h1 className="text-2xl font-black text-[#173d2e]">POS & Billing</h1>
          <p className="text-sm text-slate-500">Create walk-in bills or print invoices for received orders.</p>
        </div>
        <div className="flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-black/5">
          <button onClick={() => setMode('pos')} className={`rounded-xl px-4 py-2 text-sm font-bold ${mode === 'pos' ? 'bg-[#173d2e] text-white' : 'text-slate-600'}`}><ShoppingCart size={15} className="mr-2 inline" />Walk-in POS</button>
          <button onClick={() => setMode('orders')} className={`rounded-xl px-4 py-2 text-sm font-bold ${mode === 'orders' ? 'bg-[#173d2e] text-white' : 'text-slate-600'}`}><FileText size={15} className="mr-2 inline" />Received orders</button>
        </div>
      </div>

      {mode === 'pos' ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="relative mb-4"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search inventory..." className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-[#5c8a6f]" /></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map(product => <button key={product.id} onClick={() => addProduct(product)} className="rounded-2xl border border-slate-100 p-3 text-left transition hover:border-[#5c8a6f] hover:shadow-sm"><p className="font-bold text-[#173d2e]">{product.name}</p><p className="mt-1 text-xs text-slate-500">{product.category}</p><p className="mt-2 font-black">{money(product.sellingPrice)}</p></button>)}
            </div>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 text-lg font-black text-[#173d2e]">Current bill</h2>
            <div className="space-y-3">{lines.map(line => <div key={line.product.id} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3"><div className="min-w-0"><p className="truncate text-sm font-bold">{line.product.name}</p><p className="text-xs text-slate-500">{money(line.product.sellingPrice)} × {line.quantity}</p></div><div className="flex items-center gap-1"><button onClick={() => setLines(current => current.map(item => item.product.id === line.product.id ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item).filter(item => item.quantity > 0))} className="rounded-lg bg-slate-100 px-2 py-1">−</button><button onClick={() => addProduct(line.product)} className="rounded-lg bg-slate-100 px-2 py-1">+</button></div></div>)}</div>
            <div className="mt-5 space-y-3"><input value={customerName} onChange={event => setCustomerName(event.target.value)} placeholder="Customer name" className="w-full rounded-xl border border-slate-200 px-3 py-2" /><input value={customerPhone} onChange={event => setCustomerPhone(event.target.value)} placeholder="Customer phone" className="w-full rounded-xl border border-slate-200 px-3 py-2" /></div>
            <div className="mt-5 flex items-center justify-between border-t pt-4"><span className="font-bold">Total</span><span className="text-xl font-black">{money(subtotal)}</span></div>
            <div className="mt-4 flex gap-2"><button onClick={() => printInvoice()} disabled={!lines.length} className="flex flex-1 items-center justify-center rounded-xl bg-[#173d2e] px-3 py-3 text-sm font-black text-white disabled:opacity-40"><Printer size={16} className="mr-2" />Generate & print</button><button onClick={() => setLines([])} className="rounded-xl bg-slate-100 px-3"><Trash2 size={16} /></button></div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">{orders.length === 0 ? <div className="rounded-3xl bg-white p-8 text-center text-slate-500">No received orders found.</div> : orders.map(order => <div key={order.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-black text-[#173d2e]">Order #{order.id}</p><p className="text-sm text-slate-500">{String((order as any).status || 'Received')}</p></div><button onClick={() => { setSelectedOrder(order); printInvoice(order); }} className="rounded-xl bg-[#173d2e] px-4 py-2 text-sm font-bold text-white"><Printer size={15} className="mr-2 inline" />Print invoice</button></div></div>)}</div>
      )}

      {selectedOrder && <div className="mt-5 rounded-2xl bg-white p-5 ring-1 ring-black/5"><h2 className="font-black">Selected order details</h2><pre className="mt-3 overflow-auto text-xs text-slate-600">{JSON.stringify(selectedOrder, null, 2)}</pre></div>}
    </section>
  );
}
