import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react';
import { Activity, AlertTriangle, Banknote, Barcode, Boxes, CheckCircle2, Database, FileSpreadsheet, PackageCheck, RefreshCw, ScanLine, Truck, Upload, Users, IndianRupee, Warehouse, Edit3, ChevronDown, Check, XCircle, PackageX } from 'lucide-react';
import { api, type ApiAttendance, type ApiNotification, type ApiOrder, type ApiOrderItem, type ApiProduct, type ApiShop, type ApiUser } from '../services/api';
import { adminApproveCsv, adminRejectCsv, adminSalesImports, submitShopkeeperCsv } from '../services/shopkeeperApi';
import { ErpWorkspace } from './erp/ErpWorkspace';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { CashZReportModal } from './CashZReportModal';
import { ItemSubstitutionModal } from './ItemSubstitutionModal';
import { FefoExpiryManager } from './FefoExpiryManager';
import { StockUpdateModal } from './StockUpdateModal';
import { ClearInventoryModal } from './ClearInventoryModal';
import { ShopkeeperInventoryExcel } from './ShopkeeperInventoryExcel';
import { ShopkeeperStaffManager } from './ShopkeeperStaffManager';

type Mode = 'shopkeeper' | 'admin';
type Props = { mode: Mode; orders: ApiOrder[]; onRefresh: () => Promise<void>; flash: (message: string) => void };
const stages = ['PLACED', 'ACCEPTED', 'PICKING', 'PACKING', 'READY'] as const;
type ImportRow = { referenceId:string; shopId:string; fileName:string; rowCount:number; status:string; submittedBy:string; submittedAt:string };
async function scopedRequest<T>(path:string, options:RequestInit={}):Promise<T>{const token=localStorage.getItem('freshcart_token');const headers=new Headers(options.headers);headers.set('Content-Type','application/json');if(token)headers.set('Authorization',`Bearer ${token}`);const response=await fetch(`/api${path}`,{...options,headers});if(!response.ok){const body=await response.json().catch(()=>null) as {error?:string}|null;throw new Error(body?.error||`Request failed (${response.status})`);}return response.json() as Promise<T>;}

export function OperationsDashboard({ mode, orders, onRefresh, flash }: Props) {
 const [products,setProducts]=useState<ApiProduct[]>([]); const [shops,setShops]=useState<ApiShop[]>([]); const [staff,setStaff]=useState<ApiUser[]>([]); const [notifications,setNotifications]=useState<ApiNotification[]>([]); const [attendance,setAttendance]=useState<ApiAttendance[]>([]); const [imports,setImports]=useState<ImportRow[]>([]); const [busy,setBusy]=useState<string|null>(null); const [tab,setTab]=useState<'orders'|'inventory'|'erp'|'fefo'|'staff'|'people'|'imports'>('orders');
 const [inventoryView, setInventoryView] = useState<'excel' | 'cards'>('excel');
 const [showScanner, setShowScanner] = useState(false);
 const [showZReport, setShowZReport] = useState(false);
 const [substitutingOrder, setSubstitutingOrder] = useState<ApiOrder | null>(null);
 const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
 const [showClearInventory, setShowClearInventory] = useState(false);

 const load=async()=>{try{const fetchedShops=await api.shops().catch(()=>[]);setShops(fetchedShops);if(mode==='admin'){const [p,s,a,n,i]=await Promise.all([api.adminProducts(),api.adminStaff(),api.attendance(),api.notifications(),adminSalesImports<ImportRow[]>()]);setProducts(p);setStaff(s);setAttendance(a);setNotifications(n);setImports(i);}else{const [p,a,n]=await Promise.all([scopedRequest<ApiProduct[]>('/shopkeeper-portal/products'),api.attendance(),api.notifications()]);setProducts(p);setAttendance(a);setNotifications(n);}}catch(error){flash(error instanceof Error?error.message:'Unable to load operations');}};
 useEffect(()=>{void load();},[mode]);
 const refresh=async()=>{await Promise.all([onRefresh(),load()]);flash('Workspace refreshed');};
 const activeOrders=orders.filter(o=>!['DELIVERED','CANCELLED'].includes(o.status)); const deliveredRevenue=orders.filter(o=>o.status==='DELIVERED').reduce((sum,o)=>sum+o.total,0); const lowStock=products.filter(p=>p.stock<=p.minStock);
 const advance=async(order:ApiOrder)=>{const next:Record<string,string>={PLACED:'ACCEPTED',ACCEPTED:'PICKING',PICKING:'PACKING',PACKING:'READY'};const target=next[order.status];if(!target)return;setBusy(order.id);try{await api.updateOrderStatus(order.id,target as ApiOrder['status']);await refresh();flash(`${order.id} → ${target}`);}catch(error){flash(error instanceof Error?error.message:'Order update failed');}finally{setBusy(null);}};
 
 const updateStock=async(product:ApiProduct,delta:number)=>{
   setEditingProduct(product);
 };

 const handleConfirmStockUpdate = async (productId: string, newStock: number, active: boolean, password: string) => {
   setBusy(`stock-${productId}`);
   try {
     if (mode === 'shopkeeper') {
       await scopedRequest(`/shopkeeper-portal/products/${productId}/stock`, {
         method: 'PATCH',
         body: JSON.stringify({ stock: newStock, active, password })
       });
     } else {
       await scopedRequest(`/shopkeeper-portal/products/${productId}/stock`, {
         method: 'PATCH',
         body: JSON.stringify({ stock: newStock, active, password })
       });
     }
     await load();
     await onRefresh();
   } catch (error) {
     throw error;
   } finally {
     setBusy(null);
   }
 };

 const uploadCsv=async(event:ChangeEvent<HTMLInputElement>)=>{const file=event.target.files?.[0];event.target.value='';if(!file)return;if(!file.name.toLowerCase().endsWith('.csv')){flash('Please choose a CSV file');return;}setBusy('csv');try{const result=await submitShopkeeperCsv<{referenceId:string;rowCount:number;status:string}>(file.name,await file.text());flash(`CSV submitted for admin approval: ${result.referenceId}`);}catch(error){flash(error instanceof Error?error.message:'CSV upload failed');}finally{setBusy(null);}};
 const approveImport=async(referenceId:string)=>{setBusy(referenceId);try{const result=await adminApproveCsv<{appliedRows:number}>(referenceId);flash(`Approved ${referenceId}: ${result.appliedRows} catalogue rows published`);await load();}catch(error){flash(error instanceof Error?error.message:'Approval failed');}finally{setBusy(null);}};
 const rejectImport=async(referenceId:string)=>{setBusy(referenceId);try{await adminRejectCsv(referenceId,'Rejected by owner during review');flash(`${referenceId} rejected`);await load();}catch(error){flash(error instanceof Error?error.message:'Rejection failed');}finally{setBusy(null);}};

 const handleApplySubstitution = async (orderId: string, oldItem: ApiOrderItem, newItem: ApiProduct) => {
   setBusy(`stock-${newItem.id}`);
   try {
     const newStock = Math.max(0, newItem.stock - oldItem.quantity);
     await api.updateStock(newItem.id, newStock);
     flash(`Order ${orderId}: Replaced ${oldItem.name} with ${newItem.name}`);
     await refresh();
   } catch (error) {
     flash(error instanceof Error ? error.message : 'Substitution stock update failed');
   } finally {
     setBusy(null);
   }
 };

 const handleTriggerBackup = async () => {
   try {
     setBusy('backup');
     const res = await scopedRequest<{ ok: boolean; backup: any }>('/admin/backups/trigger', { method: 'POST' });
     if (res.ok) {
       flash(`Snapshot ${res.backup.id} created! Total records: ${res.backup.totalDocuments}`);
     }
   } catch (err) {
     flash(err instanceof Error ? err.message : 'Backup trigger failed');
   } finally {
     setBusy(null);
   }
 };

 return <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8">
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div>
      <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#819087]">{mode==='admin'?'Owner / Admin ERP':'Shopkeeper / Store portal'}</p>
      <h1 className="heading mt-1 text-3xl font-extrabold text-[#173d2e]">{mode==='admin'?'Network control center':'My store operations'}</h1>
      <p className="mt-1 text-sm text-[#74837a]">{mode==='admin'?'Review store data, approvals, supply chain and live operations.':'Your shop only — inventory, orders, ERP and sales uploads.'}</p>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      {mode === 'admin' && (
        <button
          disabled={busy === 'backup'}
          onClick={handleTriggerBackup}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-[#edf4ee] px-4 py-3 text-xs font-black text-[#173d2e] border border-[#cfe3d3] hover:bg-[#dcefe0] transition disabled:opacity-50"
        >
          <Database size={16} />
          <span>{busy === 'backup' ? 'Backing up...' : 'Snapshot Backup'}</span>
        </button>
      )}
      <button
        onClick={() => setShowScanner(true)}
        className="inline-flex items-center gap-1.5 rounded-2xl bg-[#eaf4ec] px-4 py-3 text-xs font-black text-[#173d2e] border border-[#cfe3d3] hover:bg-[#dcefe0] transition"
      >
        <Barcode size={16} />
        <span>Scan Barcode / SKU</span>
      </button>
      <button
        onClick={() => setShowZReport(true)}
        className="inline-flex items-center gap-1.5 rounded-2xl bg-[#f7f8f3] px-4 py-3 text-xs font-black text-[#2f5e46] border border-[#d6dfd7] hover:bg-[#ebf0e8] transition"
      >
        <Banknote size={16} />
        <span>Day-End Z-Report</span>
      </button>
      <button onClick={()=>void refresh()} className="inline-flex items-center gap-2 rounded-2xl bg-[#173d2e] px-4 py-3 text-xs font-extrabold text-white">
        <RefreshCw size={16}/>Refresh
      </button>
    </div>
  </div>
  <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Kpi icon={<PackageCheck/>} label="Active orders" value={String(activeOrders.length)} sub="need attention"/><Kpi icon={<IndianRupee/>} label="Delivered sales" value={`₹${deliveredRevenue.toFixed(0)}`} sub="completed orders"/><Kpi icon={<AlertTriangle/>} label="Low stock" value={String(lowStock.length)} sub="at or below minimum"/><Kpi icon={<Users/>} label="Team" value={String(staff.length)} sub={mode==='admin'?'connected staff':'assigned staff'}/></section>
  <div className="mt-7 flex gap-2 overflow-x-auto"><Tab active={tab==='orders'} onClick={()=>setTab('orders')}>Orders</Tab><Tab active={tab==='inventory'} onClick={()=>setTab('inventory')}>Inventory</Tab><Tab active={tab==='erp'} onClick={()=>setTab('erp')}>Supply Chain & ERP</Tab><Tab active={tab==='fefo'} onClick={()=>setTab('fefo')}>Expiry & FEFO Clearance</Tab><Tab active={tab==='staff'} onClick={()=>setTab('staff')}>Staff</Tab><Tab active={tab==='people'} onClick={()=>setTab('people')}>People & alerts</Tab><Tab active={tab==='imports'} onClick={()=>setTab('imports')}>{mode==='admin'?`CSV approvals ${imports.length?`(${imports.length})`:''}`:'Sales CSV'}</Tab></div>
  {tab==='staff'&&<section className="mt-4"><ShopkeeperStaffManager flash={flash} mode={mode} shopName={shops[0]?.name} shopAddress={shops[0]?.address} /></section>}
  {tab==='erp'&&<section className="mt-4"><ErpWorkspace products={products} shops={shops} role={mode} flash={flash}/></section>}
  {tab==='fefo'&&<section className="mt-4"><FefoExpiryManager flash={flash}/></section>}
  {tab==='orders'&&<section className="mt-4 grid gap-5 lg:grid-cols-[1fr_340px]"><div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><h2 className="heading text-xl font-extrabold text-[#173d2e]">Order pipeline</h2><p className="mt-1 text-xs text-[#7d8c83]">Move each order through the operational stages.</p></div><Activity className="text-[#5d836b]" size={20}/></div><div className="mt-4 space-y-3">{activeOrders.map(o=><OrderRow key={o.id} order={o} busy={busy===o.id} onAdvance={()=>void advance(o)} onSubstitute={()=>setSubstitutingOrder(o)} mode={mode}/>)}{!activeOrders.length&&<Empty text="No active orders right now."/>}</div></div><div className="rounded-3xl bg-[#173d2e] p-5 text-white shadow-sm"><div className="flex items-center gap-2"><Truck size={19}/><h2 className="font-extrabold">Fulfilment pulse</h2></div><div className="mt-5 space-y-4">{stages.map(stage=>{const count=orders.filter(o=>o.status===stage).length;return <div key={stage}><div className="flex justify-between text-xs"><span className="text-white/65">{stage.replace('_',' ')}</span><b>{count}</b></div><div className="mt-2 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-[#d7ef8d]" style={{width:`${Math.min(100,count*18)}%`}}/></div></div>})}</div></div></section>}
  {tab==='inventory'&&(
    <section className="mt-4">
      {inventoryView === 'excel' ? (
        <ShopkeeperInventoryExcel
          products={products}
          onRefresh={async () => {
            await load();
            await onRefresh();
          }}
          flash={flash}
          mode={mode}
          onOpenScanner={() => setShowScanner(true)}
          onOpenErp={() => setTab('erp')}
          onOpenClear={() => setShowClearInventory(true)}
          onSwitchToCards={() => setInventoryView('cards')}
        />
      ) : (
        <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="heading text-xl font-extrabold text-[#173d2e]">
                {mode==='shopkeeper'?'My store inventory (Cards View)':'Network inventory (Cards View)'}
              </h2>
              <p className="mt-1 text-xs text-[#7d8c83]">
                Switch to Excel view anytime to manage product discounts, amounts, stock levels, and toggle availability.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setInventoryView('excel')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#107c41] text-white px-3 py-1.5 text-xs font-black shadow-xs hover:bg-[#0c6233] transition cursor-pointer"
              >
                <FileSpreadsheet size={14} />
                <span>Excel Spreadsheet View</span>
              </button>
              <button onClick={()=>setShowScanner(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-900 border border-emerald-200 hover:bg-emerald-100 cursor-pointer">
                <ScanLine size={14}/><span>Scan Barcode</span>
              </button>
              <button onClick={()=>setTab('erp')} className="inline-flex items-center gap-1.5 rounded-xl bg-[#173d2e] px-3 py-1.5 text-xs font-black text-white hover:bg-[#1f4e3c] cursor-pointer">
                <Warehouse size={14}/><span>Advanced ERP (Batches & POs)</span>
              </button>
              {products.length > 0 && (
                <button onClick={()=>setShowClearInventory(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-800 border border-rose-200 hover:bg-rose-100 transition cursor-pointer" title="Zero out all stock or purge catalog">
                  <PackageX size={14}/><span>Clear Inventory</span>
                </button>
              )}
              <Boxes className="text-[#5d836b]"/>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {products.map(p=>(
              <div key={p.id} className={`rounded-2xl border p-4 ${p.stock<=p.minStock?'border-[#e8c6a5] bg-[#fffaf4]':'border-black/5 bg-[#fafbf8]'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-extrabold text-[#203229]">{p.name}</div>
                    <div className="mt-1 text-xs text-[#7b8981]">{p.category} • {p.unit}</div>
                    <div className="mt-0.5 text-[10px] font-mono text-gray-400">SKU: {p.sku || p.id}</div>
                    <div className="mt-1 text-xs font-bold text-emerald-800">
                      ₹{p.sellingPrice} {p.mrp && p.mrp > p.sellingPrice ? <span className="line-through text-gray-400 text-[11px] font-normal">₹{p.mrp}</span> : null}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${((p.active ?? true) && p.stock > 0) ? 'bg-emerald-100 text-emerald-800' : !(p.active ?? true) ? 'bg-gray-200 text-gray-700' : 'bg-rose-100 text-rose-800'}`}>
                      {!(p.active ?? true) ? '⚫ Turned Off' : p.stock > 0 ? '🟢 Available' : '🔴 Out of Stock'}
                    </span>
                    {p.stock<=p.minStock&&<span className="flex items-center gap-1 text-[10px] font-bold text-[#c77b38]"><AlertTriangle size={13}/> Low</span>}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xl font-extrabold text-[#173d2e]">{p.stock}</span>
                    <span className="ml-1 text-xs text-[#89958e]">in stock</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInventoryView('excel')}
                      className="inline-flex items-center gap-1 rounded-xl bg-gray-100 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-200 transition cursor-pointer"
                    >
                      <FileSpreadsheet size={12}/>
                      <span>Excel</span>
                    </button>
                    {(mode==='shopkeeper'||mode==='admin')&&<button onClick={()=>setEditingProduct(p)} className="inline-flex items-center gap-1.5 rounded-xl bg-[#173d2e] px-3 py-2 text-xs font-black text-white hover:bg-[#123024] shadow-xs active:scale-95 transition cursor-pointer"><Edit3 size={13}/><span>Update Stock</span></button>}
                  </div>
                </div>
              </div>
            ))}
            {!products.length&&<div className="py-12 text-center rounded-2xl border border-dashed border-gray-200 bg-[#fafcf9] col-span-full"><PackageX className="mx-auto mb-2 text-gray-400" size={28}/><p className="text-sm font-bold text-[#45574c]">No products in your store inventory</p><p className="mt-1 text-xs text-gray-400">Upload a CSV or receive a PO transfer to populate your catalogue.</p></div>}
          </div>
        </div>
      )}
    </section>
  )}
  {tab==='people'&&<section className="mt-4 grid gap-5 lg:grid-cols-2"><Panel title="Notifications"><div className="space-y-3">{notifications.slice(0,8).map(n=><div key={n.id} className="rounded-2xl bg-[#fafbf8] p-4"><div className="text-sm font-extrabold text-[#203229]">{n.title}</div><div className="mt-1 text-xs leading-5 text-[#718078]">{n.message}</div></div>)}{!notifications.length&&<Empty text="No notifications."/>}</div></Panel><Panel title="Attendance"><div className="space-y-3">{attendance.slice(0,8).map(a=><div key={a.id} className="flex items-center justify-between rounded-2xl bg-[#fafbf8] p-4"><div><div className="text-sm font-extrabold text-[#203229]">{a.date}</div><div className="mt-1 text-xs text-[#718078]">{a.checkIn?new Date(a.checkIn).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):'—'} → {a.checkOut?new Date(a.checkOut).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):'open'}</div></div><span className="rounded-full bg-[#edf3ee] px-3 py-1 text-[10px] font-extrabold text-[#47715a]">{a.status}</span></div>)}{!attendance.length&&<Empty text="No attendance records."/>}</div></Panel></section>}
  {tab==='imports'&&mode==='shopkeeper'&&<section className="mt-4 grid gap-5 lg:grid-cols-[1fr_360px]">
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf1ea] text-[#3b795b]">
            <FileSpreadsheet size={20}/>
          </div>
          <div>
            <h2 className="heading text-xl font-extrabold text-[#173d2e]">Upload sales / inventory CSV</h2>
            <p className="mt-1 text-xs leading-5 text-[#718078]">
              Upload your catalog spreadsheet to update prices, stock, and new products. Submitted batches go for review and will be published once approved.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const sample = "sku,barcode,name,category,unit,mrp,selling_price,cost_price,stock,min_stock,image_url\n" +
              "SKU-MILK-500,8901234567890,Amul Taaza Homogenised Milk,Dairy & Eggs,500ml,30,28,25,45,10,https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80\n" +
              "SKU-BREAD-400,8901234567891,Harvest Gold White Bread,Bakery & Biscuits,400g,45,40,35,30,8,https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80\n" +
              "SKU-APPLE-1KG,8901234567892,Fresh Shimla Apples,Fresh Produce,1kg,180,160,130,25,5,https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80";
            const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sample_inventory_template.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            flash('Downloaded sample_inventory_template.csv');
          }}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
        >
          <FileSpreadsheet size={14}/>
          <span>Download Sample CSV</span>
        </button>
      </div>

      <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d9e4da] bg-[#fafcf9] px-6 py-10 text-center hover:bg-[#f5f9f3] transition">
        <Upload size={24} className="text-[#4c8b67]"/>
        <span className="mt-3 text-sm font-extrabold text-[#315b43]">
          {busy === 'csv' ? 'Uploading & parsing CSV...' : 'Choose CSV file (.csv)'}
        </span>
        <span className="mt-1 text-[11px] text-[#86948c]">Maximum 5 MB • 1 to 5,000 product rows</span>
        <input type="file" accept=".csv,text/csv" className="hidden" onChange={uploadCsv} disabled={busy === 'csv'} />
      </label>

      <div className="mt-6 rounded-2xl bg-[#fafbf8] border border-black/5 p-4 text-xs text-[#52645a]">
        <p className="font-bold text-[#173d2e] mb-1.5">Supported column headers in your CSV:</p>
        <p className="font-mono text-[11px] leading-relaxed text-emerald-900 bg-white/80 p-2.5 rounded-xl border border-emerald-950/10">
          name, category, unit, mrp, selling_price, cost_price, stock, min_stock, sku, barcode, image_url
        </p>
        <p className="mt-2 text-[11px] text-[#718078]">
          Only <b>name</b> (or <b>sku</b>) is strictly required per item; other missing fields will default gracefully.
        </p>
      </div>
    </div>

    <div className="rounded-3xl bg-[#173d2e] p-6 text-white flex flex-col justify-between">
      <div>
        <h3 className="font-extrabold text-base">Approval workflow</h3>
        <div className="mt-4 space-y-4 text-xs leading-5 text-white/75">
          <div><b className="text-white">1. Upload</b><br/>Private upload tagged to your active store.</div>
          <div><b className="text-white">2. Auto-Validation</b><br/>Headers, numbers, and pricing sanity checks.</div>
          <div><b className="text-white">3. Admin / Store Review</b><br/>Review changes prior to network distribution.</div>
          <div><b className="text-white">4. Publish to Catalogue</b><br/>Syncs directly into online store inventory.</div>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-white/10 text-[11px] text-white/60">
        Need help? Click the sample button above to test with pre-formatted inventory data.
      </div>
    </div>
  </section>}
  {tab==='imports'&&mode==='admin'&&<section className="mt-4 rounded-3xl bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="heading text-xl font-extrabold text-[#173d2e]">Pending CSV approvals</h2><p className="mt-1 text-xs text-[#7d8c83]">Nothing is published until you approve it.</p></div><FileSpreadsheet className="text-[#5d836b]"/></div><div className="mt-5 space-y-3">{imports.map(item=><div key={item.referenceId} className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-[#fafbf8] p-4"><div className="min-w-[180px] flex-1"><div className="text-sm font-extrabold text-[#203229]">{item.fileName}</div><div className="mt-1 text-xs text-[#7d8c83]">{item.referenceId} • {item.rowCount} rows • Shop {item.shopId}</div></div><span className="rounded-full bg-[#fff4de] px-3 py-1 text-[10px] font-extrabold text-[#9a6a24]">PENDING REVIEW</span><div className="flex gap-2"><button disabled={busy===item.referenceId} onClick={()=>void rejectImport(item.referenceId)} className="rounded-xl border border-[#e3c8c1] bg-white px-3 py-2 text-xs font-extrabold text-[#a04d3e]">Reject</button><button disabled={busy===item.referenceId} onClick={()=>void approveImport(item.referenceId)} className="rounded-xl bg-[#173d2e] px-3 py-2 text-xs font-extrabold text-white">{busy===item.referenceId?'Processing…':'Approve & publish'}</button></div></div>)}{!imports.length&&<Empty text="No pending CSV approvals."/>}</div></section>}

  {editingProduct && (
    <StockUpdateModal
      product={editingProduct}
      isOpen={Boolean(editingProduct)}
      onClose={() => setEditingProduct(null)}
      onConfirm={handleConfirmStockUpdate}
      flash={flash}
    />
  )}

  {showScanner && (
    <BarcodeScannerModal
      products={products}
      onUpdateStock={updateStock}
      onClose={() => setShowScanner(false)}
      flash={flash}
    />
  )}

  {showZReport && (
    <CashZReportModal
      orders={orders}
      shop={shops[0]}
      onClose={() => setShowZReport(false)}
    />
  )}

  {substitutingOrder && (
    <ItemSubstitutionModal
      order={substitutingOrder}
      products={products}
      onClose={() => setSubstitutingOrder(null)}
      onApplySubstitution={handleApplySubstitution}
      flash={flash}
    />
  )}

  {showClearInventory && (
    <ClearInventoryModal
      products={products}
      isOpen={showClearInventory}
      onClose={() => setShowClearInventory(false)}
      onSuccess={async () => {
        await load();
        await onRefresh();
      }}
      flash={flash}
      shopTitle={shops[0]?.name || (mode === 'shopkeeper' ? 'My Store' : 'Active Shop')}
    />
  )}
 </main>;
}

function OrderRow({order,busy,onAdvance,onSubstitute,mode}:{order:ApiOrder;busy:boolean;onAdvance:()=>void;onSubstitute:()=>void;mode:Mode;key?:any}){
  const next:Record<string,string>={PLACED:'Accept',ACCEPTED:'Start picking',PICKING:'Start packing',PACKING:'Mark ready'};
  const canSubstitute = order.status === 'ACCEPTED' || order.status === 'PICKING';

  return <div className="rounded-2xl border border-black/5 bg-[#fafbf8] p-4">
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf1ea] text-[#3c7358]">
        <PackageCheck size={18}/>
      </div>
      <div className="min-w-[180px] flex-1">
        <div className="text-sm font-extrabold text-[#203229]">{order.id}</div>
        <div className="mt-1 text-xs text-[#7d8b83]">{order.items.reduce((s,i)=>s+i.quantity,0)} items • ₹{order.total} • {order.paymentMethod}</div>
      </div>
      <span className="rounded-full bg-[#edf3ee] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#47715a]">{order.status.replaceAll('_',' ')}</span>
      
      {canSubstitute && (
        <button
          onClick={onSubstitute}
          className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-black text-amber-900 hover:bg-amber-100 transition"
        >
          Substitute Items
        </button>
      )}

      {mode==='shopkeeper'&&next[order.status]&&<button disabled={busy} onClick={onAdvance} className="rounded-xl bg-[#173d2e] px-3 py-2 text-xs font-extrabold text-white disabled:opacity-50">{busy?'Updating…':next[order.status]}</button>}
    </div>
    <div className="mt-3 flex gap-1">{stages.map(stage=><div key={stage} className={`h-1.5 flex-1 rounded-full ${stages.indexOf(stage)<=stages.indexOf(order.status as typeof stages[number])?'bg-[#5d836b]':'bg-[#e6ebe6]'}`}/>)}</div>
  </div>;
}

function Kpi({icon,label,value,sub}:{icon:ReactNode;label:string;value:string;sub:string}){return <div className="rounded-3xl bg-white p-5 shadow-sm"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf1ea] text-[#3c7358]">{icon}</div><div className="mt-4 text-xs font-bold text-[#7d8c83]">{label}</div><div className="mt-1 text-2xl font-extrabold text-[#173d2e]">{value}</div><div className="mt-1 text-xs text-[#8a968f]">{sub}</div></div>}
function Tab({active,children,onClick}:{active:boolean;children:ReactNode;onClick:()=>void}){return <button onClick={onClick} className={`rounded-xl px-4 py-2 text-xs font-extrabold ${active?'bg-[#173d2e] text-white':'bg-white text-[#617169]'}`}>{children}</button>}
function Panel({title,children}:{title:string;children:ReactNode}){return <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6"><h2 className="heading text-xl font-extrabold text-[#173d2e]">{title}</h2><div className="mt-4">{children}</div></div>}
function Empty({text}:{text:string}){return <div className="py-10 text-center text-sm text-[#7d8c83]"><CheckCircle2 className="mx-auto mb-2 text-[#7ca486]" size={22}/>{text}</div>}

