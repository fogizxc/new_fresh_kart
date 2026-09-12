import { useState } from 'react';
import {
  Boxes,
  Building2,
  ClipboardCheck,
  FileSpreadsheet,
  History,
  PackageCheck,
  Truck,
  Warehouse
} from 'lucide-react';
import { BatchInventoryView } from './BatchInventoryView';
import { StockMovementsLedger } from './StockMovementsLedger';
import { StockTransfersView } from './StockTransfersView';
import { PhysicalAuditView } from './PhysicalAuditView';
import { SuppliersView } from './SuppliersView';
import { PurchaseOrdersView } from './PurchaseOrdersView';
import { GoodsReceiptView } from './GoodsReceiptView';
import type { ApiPurchaseOrder } from '../../services/erpApi';
import type { ApiProduct, ApiShop } from '../../services/api';

type Props = {
  products: ApiProduct[];
  shops: ApiShop[];
  role: string;
  flash: (message: string) => void;
};

export function ErpWorkspace({ products, shops, role, flash }: Props) {
  const [activePhase, setActivePhase] = useState<'inventory' | 'procurement'>('inventory');
  const [invSubTab, setInvSubTab] = useState<'batches' | 'movements' | 'transfers' | 'audits'>('batches');
  const [procSubTab, setProcSubTab] = useState<'suppliers' | 'pos' | 'grn'>('suppliers');
  const [grnTargetPo, setGrnTargetPo] = useState<ApiPurchaseOrder | null>(null);

  const handleOpenGrnForPo = (po: ApiPurchaseOrder) => {
    setActivePhase('procurement');
    setProcSubTab('grn');
    setGrnTargetPo(po);
  };

  return (
    <div className="space-y-6">
      {/* Primary Phase Header Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-[#173d2e] p-6 text-white shadow-lg">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#d7ef8d]">
            <Warehouse size={14} /> Enterprise Operations Suite
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Supply Chain & Inventory ERP</h1>
          <p className="mt-1 text-xs text-white/70">
            End-to-end FEFO batch management, inter-shop logistics, vendor procurement, and dockside goods receipt.
          </p>
        </div>

        {/* Phase Toggle */}
        <div className="flex rounded-2xl bg-black/20 p-1.5 backdrop-blur-sm">
          <button
            onClick={() => setActivePhase('inventory')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
              activePhase === 'inventory'
                ? 'bg-[#d7ef8d] text-[#173d2e] shadow-md'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Boxes size={16} />
            <span>Phase 1: Inventory ERP</span>
          </button>
          <button
            onClick={() => setActivePhase('procurement')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
              activePhase === 'procurement'
                ? 'bg-[#d7ef8d] text-[#173d2e] shadow-md'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Building2 size={16} />
            <span>Phase 2: Procurement ERP</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-black/10 pb-2">
        {activePhase === 'inventory' ? (
          <>
            <button
              onClick={() => setInvSubTab('batches')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
                invSubTab === 'batches'
                  ? 'bg-[#173d2e] text-white shadow-sm'
                  : 'bg-white text-[#55675d] hover:bg-[#f2f6f3]'
              }`}
            >
              <Boxes size={15} />
              <span>Batches & Expiry (FEFO)</span>
            </button>
            <button
              onClick={() => setInvSubTab('movements')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
                invSubTab === 'movements'
                  ? 'bg-[#173d2e] text-white shadow-sm'
                  : 'bg-white text-[#55675d] hover:bg-[#f2f6f3]'
              }`}
            >
              <History size={15} />
              <span>Stock Movements Ledger</span>
            </button>
            <button
              onClick={() => setInvSubTab('transfers')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
                invSubTab === 'transfers'
                  ? 'bg-[#173d2e] text-white shadow-sm'
                  : 'bg-white text-[#55675d] hover:bg-[#f2f6f3]'
              }`}
            >
              <Truck size={15} />
              <span>Inter-Shop Transfers</span>
            </button>
            <button
              onClick={() => setInvSubTab('audits')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
                invSubTab === 'audits'
                  ? 'bg-[#173d2e] text-white shadow-sm'
                  : 'bg-white text-[#55675d] hover:bg-[#f2f6f3]'
              }`}
            >
              <ClipboardCheck size={15} />
              <span>Physical Count & Reconciliation</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setProcSubTab('suppliers')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
                procSubTab === 'suppliers'
                  ? 'bg-[#173d2e] text-white shadow-sm'
                  : 'bg-white text-[#55675d] hover:bg-[#f2f6f3]'
              }`}
            >
              <Building2 size={15} />
              <span>Suppliers & Payments</span>
            </button>
            <button
              onClick={() => setProcSubTab('pos')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
                procSubTab === 'pos'
                  ? 'bg-[#173d2e] text-white shadow-sm'
                  : 'bg-white text-[#55675d] hover:bg-[#f2f6f3]'
              }`}
            >
              <FileSpreadsheet size={15} />
              <span>Purchase Orders</span>
            </button>
            <button
              onClick={() => setProcSubTab('grn')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
                procSubTab === 'grn'
                  ? 'bg-[#173d2e] text-white shadow-sm'
                  : 'bg-white text-[#55675d] hover:bg-[#f2f6f3]'
              }`}
            >
              <PackageCheck size={15} />
              <span>Goods Receipts (GRN)</span>
            </button>
          </>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="pt-1">
        {activePhase === 'inventory' && (
          <>
            {invSubTab === 'batches' && (
              <BatchInventoryView products={products} shops={shops} role={role} flash={flash} />
            )}
            {invSubTab === 'movements' && <StockMovementsLedger flash={flash} />}
            {invSubTab === 'transfers' && (
              <StockTransfersView products={products} shops={shops} role={role} flash={flash} />
            )}
            {invSubTab === 'audits' && (
              <PhysicalAuditView products={products} shops={shops} role={role} flash={flash} />
            )}
          </>
        )}

        {activePhase === 'procurement' && (
          <>
            {procSubTab === 'suppliers' && <SuppliersView flash={flash} />}
            {procSubTab === 'pos' && (
              <PurchaseOrdersView
                products={products}
                shops={shops}
                role={role}
                flash={flash}
                onOpenGrnForPo={handleOpenGrnForPo}
              />
            )}
            {procSubTab === 'grn' && (
              <GoodsReceiptView
                shops={shops}
                role={role}
                flash={flash}
                preselectedPo={grnTargetPo}
                onClearPreselectedPo={() => setGrnTargetPo(null)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
