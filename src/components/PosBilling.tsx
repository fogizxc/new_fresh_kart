import { useMemo, useState } from 'react';
import { Printer, Plus, Minus, Trash2, ReceiptText, Save, Loader2 } from 'lucide-react';
import type { ApiOrder, ApiProduct } from '../services/api';

type Props = { products: ApiProduct[]; orders: ApiOrder[]; shopName?: string; shopAddress?: string; flash?: (message: string) => void };
type Customer = { name: string; phone: string; address: string };
type InvoiceResponse = { invoice?: { invoiceNumber?: string }; message?: string };

export function PosBilling({ products, orders, shopName = 'FreshCart Partner Store', shopAddress = '', flash }: Props) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customer, setCustomer] = useState<Customer>({ name: '', phone: '', address: '' });
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const cartItems = useMemo(() => Object.entries(cart).map(([id, quantity]) => ({ product: products.find(p => p.id === id), quantity: Number(quantity) })).filter((x): x is { product: ApiProduct; quantity: number } => Boolean(x.product && x.quantity > 0)), [cart, products]);
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const total = Math.max(0, subtotal + tax - discount);

  const add = (id: string) => setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const change = (id: string, delta: number) => setCart(prev => { const next = Math.max(0, (prev[id] || 0) + delta); const copy = { ...prev }; if (next) copy[id] = next; else delete copy[id]; return copy; });
  const remove = (id: string) => setCart(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
  const loadOrder = (id: string) => { const order = orders.find(o => o.id === id); if (!order) return; const next: Record<string, number> = {}; order.items.forEach(item => { next[item.productId] = item.quantity; }); setCart(next); setSelectedOrderId(id); setCustomer({ name: `Customer ${order.customerId.slice(0, 8)}`, phone: '', address: '' }); setTax(0); setDiscount(order.discount || 0); setInvoiceNumber(''); };
  const saveInvoice = async () => {
    if (!cartItems.length) { flash?.('Add at least one item before saving the invoice'); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem('freshcart_token');
      const response = await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ orderId: selectedOrderId || undefined, customer: { name: customer.name || 'Walk-in Customer', phone: customer.phone, address: customer.address }, shopName, shopAddress, items: cartItems.map(({ product, quantity }) => ({ productId: product.id, name: product.name, unit: product.unit, quantity, unitPrice: product.sellingPrice })), subtotal, tax, discount, total }) });
      const result = await response.json().catch(() => ({})) as InvoiceResponse & { error?: string };
      if (!response.ok) throw new Error(result.error || 'Invoice could not be saved');
      setInvoiceNumber(result.invoice?.invoiceNumber || ''); flash?.('Invoice saved successfully');
    } catch (error) { flash?.(error instanceof Error ? error.message : 'Invoice could not be saved'); } finally { setSaving(false); }
  };
  const printBill = () => { window.print(); flash?.('Print dialog opened for the bill'); };
  const displayInvoice = invoiceNumber || selectedOrderId || `POS-${Date.now().toString().slice(-8)}`;

  return <section className="mt-4 grid gap-5 xl:grid-cols-[1fr_420px] print:block">
    <div className="rounded-3xl bg-white p-5 shadow-sm print:hidden"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-widest text-[#5d836b]">Counter billing</p><h2 className="text-2xl font-black text-[#173d2e]">POS & Billing</h2><p className="text-xs text-slate-500">Select products to create an in-store customer bill.</p></div><ReceiptText className="text-[#5d836b]"/></div><div className="mt-4 grid gap-2 sm:grid-cols-2"><input value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} placeholder="Customer name" className="rounded-xl border p-3 text-sm"/><input value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} placeholder="Customer phone" className="rounded-xl border p-3 text-sm"/><input value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} placeholder="Customer address" className="rounded-xl border p-3 text-sm sm:col-span-2"/></div><div className="mt-5 grid max-h-[480px] gap-2 overflow-y-auto sm:grid-cols-2">{products.map(p => <button key={p.id} disabled={!p.active || p.stock <= 0} onClick={() => add(p.id)} className="flex items-center justify-between rounded-2xl border p-3 text-left hover:border-[#5d836b] disabled:opacity-40"><span><b className="block text-sm text-[#173d2e]">{p.name}</b><small className="text-xs text-slate-500">{p.unit} • ₹{p.sellingPrice}</small></span><Plus size={17}/></button>)}</div></div>
    <div className="rounded-3xl bg-white p-5 shadow-sm print:shadow-none"><div className="flex items-center justify-between gap-2 print:hidden"><h3 className="text-lg font-black text-[#173d2e]">Bill preview</h3><div className="flex gap-2"><button disabled={saving} onClick={() => void saveInvoice()} className="inline-flex items-center gap-2 rounded-xl bg-[#d7ef8d] px-3 py-2 text-xs font-black text-[#173d2e] disabled:opacity-50">{saving ? <Loader2 size={15} className="animate-spin"/> : <Save size={15}/>}Save bill</button><button onClick={printBill} className="inline-flex items-center gap-2 rounded-xl bg-[#173d2e] px-3 py-2 text-xs font-black text-white"><Printer size={15}/>Print bill</button></div></div><div id="freshcart-print-bill" className="mt-4 text-sm text-slate-800"><div className="border-b pb-3"><h1 className="text-xl font-black">{shopName}</h1><p className="text-xs">{shopAddress}</p><p className="mt-2 text-xs">Invoice: {displayInvoice}</p><p className="text-xs">Date: {new Date().toLocaleString()}</p></div><div className="border-b py-3 text-xs"><b>Bill to:</b><p>{customer.name || 'Walk-in Customer'}</p><p>{customer.phone}</p><p>{customer.address || 'Address not provided'}</p></div><div className="py-3">{cartItems.map(item => <div key={item.product.id} className="flex items-center justify-between border-b py-2"><div className="min-w-0"><p className="font-bold">{item.product.name}</p><p className="text-xs">₹{item.product.sellingPrice} × {item.quantity}</p></div><div className="flex items-center gap-2 print:hidden"><button onClick={() => change(item.product.id, -1)}><Minus size={14}/></button><button onClick={() => change(item.product.id, 1)}><Plus size={14}/></button><button onClick={() => remove(item.product.id)}><Trash2 size={14}/></button></div><b>₹{(item.product.sellingPrice * item.quantity).toFixed(2)}</b></div>)}{!cartItems.length && <p className="py-8 text-center text-xs text-slate-400">No items selected.</p>}</div><div className="space-y-2 border-t pt-3 text-sm"><div className="flex justify-between"><span>Subtotal</span><b>₹{subtotal.toFixed(2)}</b></div><div className="flex justify-between items-center print:hidden"><label>Tax</label><input type="number" value={tax} onChange={e => setTax(Number(e.target.value) || 0)} className="w-24 rounded border p-1 text-right"/></div><div className="flex justify-between items-center print:hidden"><label>Discount</label><input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value) || 0)} className="w-24 rounded border p-1 text-right"/></div><div className="flex justify-between text-lg font-black"><span>Grand Total</span><span>₹{total.toFixed(2)}</span></div></div><p className="mt-5 text-center text-[10px] text-slate-500">Thank you for shopping with {shopName}.</p></div></div>
    <div className="rounded-3xl bg-white p-5 shadow-sm print:hidden"><h3 className="font-black text-[#173d2e]">Received online order → bill</h3><select value={selectedOrderId} onChange={e => loadOrder(e.target.value)} className="mt-3 w-full rounded-xl border p-3 text-sm"><option value="">Select received order</option>{orders.filter(o => !['CANCELLED'].includes(o.status)).map(o => <option key={o.id} value={o.id}>{o.id} • ₹{o.total} • {o.status}</option>)}</select><p className="mt-2 text-xs text-slate-500">Choose an order to load its items into the printable invoice, then verify the customer address and contact details before saving and printing.</p></div>
  </section>;
}
