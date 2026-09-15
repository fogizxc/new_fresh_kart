import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileSpreadsheet, Save, RotateCcw, Download, Search, Check, 
  AlertTriangle, Power, Percent, EyeOff, Plus, Minus, 
  ScanLine, Warehouse, PackageX, Sparkles, CheckCircle2, 
  RefreshCw, Image as ImageIcon, Upload, Link as LinkIcon,
  X, PlusCircle, Trash2, Camera, CornerDownRight,
  Calendar, CalendarDays, Clock
} from 'lucide-react';
import type { ApiProduct } from '../services/api';
import { 
  updateShopkeeperProduct, 
  batchUpdateShopkeeperProducts, 
  createShopkeeperProduct 
} from '../services/shopkeeperApi';

interface EditableRow {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  category: string;
  unit: string;
  mrp: number;
  sellingPrice: number;
  discountPercent: number;
  discountAmount: number;
  stock: number;
  minStock: number;
  active: boolean;
  imageUrl?: string;
  expiryDate?: string;
  isDirty: boolean;
  isSaving?: boolean;
}

interface Props {
  products: ApiProduct[];
  onRefresh: () => Promise<void>;
  flash: (message: string) => void;
  mode: 'shopkeeper' | 'admin';
  onOpenScanner?: () => void;
  onOpenErp?: () => void;
  onOpenClear?: () => void;
  onSwitchToCards?: () => void;
}

// Curated grocery image presets for fast selection
const GROCERY_IMAGE_PRESETS = [
  { label: 'Fresh Apples', url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&auto=format&fit=crop&q=80' },
  { label: 'Bananas', url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&auto=format&fit=crop&q=80' },
  { label: 'Tomatoes', url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&auto=format&fit=crop&q=80' },
  { label: 'Potatoes/Onions', url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&auto=format&fit=crop&q=80' },
  { label: 'Fresh Milk', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80' },
  { label: 'Butter / Cheese', url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&auto=format&fit=crop&q=80' },
  { label: 'Basmati Rice', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80' },
  { label: 'Flour / Atta', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80' },
  { label: 'Chai / Tea', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&auto=format&fit=crop&q=80' },
  { label: 'Coffee', url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&auto=format&fit=crop&q=80' },
  { label: 'Biscuits / Cookies', url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&auto=format&fit=crop&q=80' },
  { label: 'Snacks / Chips', url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=80' },
];

export const ShopkeeperInventoryExcel: React.FC<Props> = ({
  products,
  onRefresh,
  flash,
  mode,
  onOpenScanner,
  onOpenErp,
  onOpenClear,
  onSwitchToCards
}) => {
  // Master editable rows
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'turned_off' | 'modified' | 'near_expiry' | 'expired'>('all');
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [bulkDiscountInput, setBulkDiscountInput] = useState<string>('');
  const [showBulkDiscountModal, setShowBulkDiscountModal] = useState(false);
  const [focusedCell, setFocusedCell] = useState<{ id: string; field: string } | null>(null);

  // Directly Add New Item state
  const [showAddRow, setShowAddRow] = useState(false);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);

  const [newItem, setNewItem] = useState({
    name: '',
    category: 'General',
    unit: '1 kg',
    sku: '',
    barcode: '',
    imageUrl: '',
    expiryDate: '',
    mrp: 100,
    discountPercent: 10,
    discountAmount: 10,
    sellingPrice: 90,
    stock: 25,
    minStock: 5,
    active: true
  });

  // Modal for viewing / updating image of a specific row
  const [imageModalRow, setImageModalRow] = useState<EditableRow | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const addFileInputRef = useRef<HTMLInputElement | null>(null);
  const dateInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Helper to open native calendar picker for a row
  const openDatePicker = (id: string) => {
    const input = dateInputRefs.current[id];
    if (input) {
      try {
        if (typeof input.showPicker === 'function') {
          input.showPicker();
        } else {
          input.focus();
        }
      } catch {
        input.focus();
      }
    }
  };

  // Helper to calculate days remaining and badge status for expiry dates
  const getExpiryInfo = (expiryDateStr?: string) => {
    if (!expiryDateStr) return null;
    const exp = new Date(expiryDateStr);
    if (isNaN(exp.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(exp);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const formatted = exp.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    if (diffDays < 0) {
      return {
        status: 'expired' as const,
        diffDays,
        formatted,
        badgeText: `Expired (${Math.abs(diffDays)}d ago)`,
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300'
      };
    }
    if (diffDays === 0) {
      return {
        status: 'today' as const,
        diffDays,
        formatted,
        badgeText: 'Expires Today',
        badgeClass: 'bg-rose-500 text-white border-rose-600 font-black'
      };
    }
    if (diffDays <= 7) {
      return {
        status: 'critical' as const,
        diffDays,
        formatted,
        badgeText: `${diffDays}d left`,
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-black'
      };
    }
    if (diffDays <= 30) {
      return {
        status: 'warning' as const,
        diffDays,
        formatted,
        badgeText: `${diffDays}d left`,
        badgeClass: 'bg-yellow-100 text-yellow-900 border-yellow-300 font-semibold'
      };
    }
    const months = Math.floor(diffDays / 30);
    return {
      status: 'good' as const,
      diffDays,
      formatted,
      badgeText: months > 0 ? `${months}m left` : `${diffDays}d left`,
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    };
  };

  // Initialize or re-sync rows from products prop
  useEffect(() => {
    setRows(prev => {
      const prevMap = new Map<string, EditableRow>(prev.map(r => [r.id, r]));
      return products.map(p => {
        const existing = prevMap.get(p.id);
        if (existing && existing.isDirty) {
          // Keep unsaved edits
          return existing;
        }
        const mrp = Number(p.mrp) || Number(p.sellingPrice) || 0;
        const sellingPrice = Number(p.sellingPrice) || 0;
        const discountAmount = Math.max(0, mrp - sellingPrice);
        const discountPercent = mrp > 0 ? Math.round((discountAmount / mrp) * 100) : 0;
        return {
          id: p.id,
          sku: p.sku || p.id,
          barcode: (p as any).barcode || '',
          name: p.name,
          category: p.category || 'General',
          unit: p.unit || 'piece',
          mrp,
          sellingPrice,
          discountPercent,
          discountAmount,
          stock: Number(p.stock) || 0,
          minStock: Number(p.minStock) || 0,
          active: p.active ?? true,
          imageUrl: p.imageUrl,
          expiryDate: (p as any).expiryDate || '',
          isDirty: false
        };
      });
    });
  }, [products]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // REAL-TIME DUPLICATE DETECTION FOR NEW ITEM
  const duplicateCheck = useMemo(() => {
    const nameTrim = newItem.name.trim().toLowerCase();
    const skuTrim = newItem.sku.trim().toUpperCase();
    const barcodeTrim = newItem.barcode.trim();

    if (!nameTrim && !skuTrim && !barcodeTrim) {
      return null;
    }

    const match = rows.find(r => {
      const rName = r.name.trim().toLowerCase();
      const rSku = r.sku.trim().toUpperCase();
      const rBarcode = r.barcode?.trim() || '';

      if (nameTrim && rName === nameTrim) return true;
      if (skuTrim && rSku === skuTrim) return true;
      if (barcodeTrim && rBarcode && rBarcode === barcodeTrim) return true;
      return false;
    });

    if (match) {
      let reason = '';
      if (nameTrim && match.name.trim().toLowerCase() === nameTrim) {
        reason = `Same product name "${match.name}"`;
      } else if (skuTrim && match.sku.trim().toUpperCase() === skuTrim) {
        reason = `Same SKU "${match.sku}"`;
      } else if (barcodeTrim && match.barcode === barcodeTrim) {
        reason = `Same Barcode "${match.barcode}"`;
      }
      return { isDuplicate: true, existing: match, reason };
    }

    return null;
  }, [newItem.name, newItem.sku, newItem.barcode, rows]);

  // Handle cell modifications with automatic cross-calculations
  const handleCellChange = (
    id: string,
    field: 'mrp' | 'discountPercent' | 'discountAmount' | 'sellingPrice' | 'stock' | 'minStock' | 'active' | 'imageUrl' | 'name' | 'category' | 'unit' | 'expiryDate',
    value: any
  ) => {
    setRows(prev =>
      prev.map(row => {
        if (row.id !== id) return row;

        const updated: EditableRow = { ...row, isDirty: true };

        if (field === 'active') {
          updated.active = Boolean(value);
        } else if (field === 'imageUrl') {
          updated.imageUrl = typeof value === 'string' ? value.trim() : undefined;
        } else if (field === 'expiryDate') {
          updated.expiryDate = typeof value === 'string' ? value.trim() : '';
        } else if (field === 'name') {
          updated.name = String(value);
        } else if (field === 'category') {
          updated.category = String(value);
        } else if (field === 'unit') {
          updated.unit = String(value);
        } else if (field === 'stock') {
          const num = Math.max(0, parseInt(value, 10) || 0);
          updated.stock = num;
        } else if (field === 'minStock') {
          const num = Math.max(0, parseInt(value, 10) || 0);
          updated.minStock = num;
        } else if (field === 'mrp') {
          const newMrp = Math.max(0, parseFloat(value) || 0);
          updated.mrp = newMrp;
          if (updated.discountPercent > 0) {
            const calculatedSelling = Math.max(0, Math.round(newMrp * (1 - updated.discountPercent / 100)));
            updated.sellingPrice = calculatedSelling;
            updated.discountAmount = Math.max(0, newMrp - calculatedSelling);
          } else {
            if (updated.sellingPrice > newMrp) {
              updated.sellingPrice = newMrp;
              updated.discountAmount = 0;
              updated.discountPercent = 0;
            } else {
              updated.discountAmount = Math.max(0, newMrp - updated.sellingPrice);
              updated.discountPercent = newMrp > 0 ? Math.round((updated.discountAmount / newMrp) * 100) : 0;
            }
          }
        } else if (field === 'discountPercent') {
          const percent = Math.min(100, Math.max(0, parseFloat(value) || 0));
          updated.discountPercent = percent;
          const calculatedSelling = Math.max(0, Math.round(updated.mrp * (1 - percent / 100)));
          updated.sellingPrice = calculatedSelling;
          updated.discountAmount = Math.max(0, updated.mrp - calculatedSelling);
        } else if (field === 'discountAmount') {
          const discAmt = Math.min(updated.mrp, Math.max(0, parseFloat(value) || 0));
          updated.discountAmount = discAmt;
          updated.sellingPrice = Math.max(0, updated.mrp - discAmt);
          updated.discountPercent = updated.mrp > 0 ? Math.round((discAmt / updated.mrp) * 100) : 0;
        } else if (field === 'sellingPrice') {
          let newPrice = Math.max(0, parseFloat(value) || 0);
          if (newPrice > updated.mrp) {
            updated.mrp = newPrice;
            updated.discountAmount = 0;
            updated.discountPercent = 0;
          } else {
            updated.discountAmount = Math.max(0, updated.mrp - newPrice);
            updated.discountPercent = updated.mrp > 0 ? Math.round((updated.discountAmount / updated.mrp) * 100) : 0;
          }
          updated.sellingPrice = newPrice;
        }

        return updated;
      })
    );
  };

  // Stock quick adjustment
  const adjustStock = (id: string, delta: number) => {
    setRows(prev =>
      prev.map(row => {
        if (row.id !== id) return row;
        const newStock = Math.max(0, row.stock + delta);
        return { ...row, stock: newStock, isDirty: true };
      })
    );
  };

  // Single Row Save
  const handleSaveRow = async (row: EditableRow) => {
    setRows(prev => prev.map(r => (r.id === row.id ? { ...r, isSaving: true } : r)));
    try {
      await updateShopkeeperProduct(row.id, {
        stock: row.stock,
        minStock: row.minStock,
        sellingPrice: row.sellingPrice,
        mrp: row.mrp,
        active: row.active,
        imageUrl: row.imageUrl,
        expiryDate: row.expiryDate,
        name: row.name,
        category: row.category,
        unit: row.unit
      });
      setRows(prev =>
        prev.map(r => (r.id === row.id ? { ...r, isDirty: false, isSaving: false } : r))
      );
      flash(`Saved ${row.name} (Stock: ${row.stock}, ₹${row.sellingPrice})`);
      await onRefresh();
    } catch (err) {
      setRows(prev => prev.map(r => (r.id === row.id ? { ...r, isSaving: false } : r)));
      flash(err instanceof Error ? err.message : 'Failed to save row changes');
    }
  };

  // Batch Save All Dirty Rows
  const handleSaveAll = async () => {
    const dirtyRows = rows.filter(r => r.isDirty);
    if (!dirtyRows.length) return;

    setIsBulkSaving(true);
    try {
      const items = dirtyRows.map(r => ({
        id: r.id,
        stock: r.stock,
        minStock: r.minStock,
        sellingPrice: r.sellingPrice,
        mrp: r.mrp,
        active: r.active,
        imageUrl: r.imageUrl,
        expiryDate: r.expiryDate,
        name: r.name,
        category: r.category,
        unit: r.unit
      }));

      const res = await batchUpdateShopkeeperProducts(items);
      setRows(prev => prev.map(r => ({ ...r, isDirty: false })));
      flash(`Saved all changes (${res.updatedCount || items.length} products updated)`);
      await onRefresh();
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Failed to batch save inventory');
    } finally {
      setIsBulkSaving(false);
    }
  };

  // Discard all unsaved edits
  const handleRevertAll = () => {
    setRows(products.map(p => {
      const mrp = Number(p.mrp) || Number(p.sellingPrice) || 0;
      const sellingPrice = Number(p.sellingPrice) || 0;
      const discountAmount = Math.max(0, mrp - sellingPrice);
      const discountPercent = mrp > 0 ? Math.round((discountAmount / mrp) * 100) : 0;
      return {
        id: p.id,
        sku: p.sku || p.id,
        barcode: (p as any).barcode || '',
        name: p.name,
        category: p.category || 'General',
        unit: p.unit || 'piece',
        mrp,
        sellingPrice,
        discountPercent,
        discountAmount,
        stock: Number(p.stock) || 0,
        minStock: Number(p.minStock) || 0,
        active: p.active ?? true,
        imageUrl: p.imageUrl,
        expiryDate: (p as any).expiryDate || '',
        isDirty: false
      };
    }));
    flash('All unsaved edits have been reverted');
  };

  // New Item Handlers with Cross-Calculations
  const handleNewItemPriceChange = (field: 'mrp' | 'discountPercent' | 'sellingPrice', value: number) => {
    setNewItem(prev => {
      const updated = { ...prev };
      if (field === 'mrp') {
        updated.mrp = Math.max(0, value);
        if (updated.discountPercent > 0) {
          updated.sellingPrice = Math.max(0, Math.round(updated.mrp * (1 - updated.discountPercent / 100)));
          updated.discountAmount = Math.max(0, updated.mrp - updated.sellingPrice);
        } else {
          updated.sellingPrice = updated.mrp;
          updated.discountAmount = 0;
        }
      } else if (field === 'discountPercent') {
        const pct = Math.min(100, Math.max(0, value));
        updated.discountPercent = pct;
        updated.sellingPrice = Math.max(0, Math.round(updated.mrp * (1 - pct / 100)));
        updated.discountAmount = Math.max(0, updated.mrp - updated.sellingPrice);
      } else if (field === 'sellingPrice') {
        let sp = Math.max(0, value);
        if (sp > updated.mrp) {
          updated.mrp = sp;
          updated.discountPercent = 0;
          updated.discountAmount = 0;
        } else {
          updated.discountAmount = Math.max(0, updated.mrp - sp);
          updated.discountPercent = updated.mrp > 0 ? Math.round((updated.discountAmount / updated.mrp) * 100) : 0;
        }
        updated.sellingPrice = sp;
      }
      return updated;
    });
  };

  // Directly create new item in inventory with Duplicate Blocking
  const handleCreateNewItem = async () => {
    if (duplicateCheck?.isDuplicate) {
      flash(`Cannot add duplicate: "${duplicateCheck.existing.name}" already exists in your store.`);
      return;
    }

    if (!newItem.name.trim()) {
      flash('Product Name is required to add an item');
      return;
    }

    if (newItem.sellingPrice > newItem.mrp && newItem.mrp > 0) {
      flash('Selling Price cannot exceed MRP');
      return;
    }

    setIsCreatingItem(true);
    try {
      const created = await createShopkeeperProduct({
        name: newItem.name.trim(),
        category: newItem.category.trim() || 'General',
        unit: newItem.unit.trim() || '1 unit',
        sku: newItem.sku.trim() || undefined,
        barcode: newItem.barcode.trim() || undefined,
        imageUrl: newItem.imageUrl.trim() || undefined,
        expiryDate: newItem.expiryDate.trim() || undefined,
        mrp: newItem.mrp,
        sellingPrice: newItem.sellingPrice,
        stock: newItem.stock,
        minStock: newItem.minStock,
        active: newItem.active
      });

      flash(`Added "${created.name}" directly to inventory!`);
      setShowAddRow(false);
      setNewItem({
        name: '',
        category: 'General',
        unit: '1 kg',
        sku: '',
        barcode: '',
        imageUrl: '',
        expiryDate: '',
        mrp: 100,
        discountPercent: 10,
        discountAmount: 10,
        sellingPrice: 90,
        stock: 25,
        minStock: 5,
        active: true
      });
      await onRefresh();
    } catch (err: any) {
      flash(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setIsCreatingItem(false);
    }
  };

  // Bulk Apply Discount to filtered rows
  const handleApplyBulkDiscount = () => {
    const pct = parseFloat(bulkDiscountInput);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      flash('Please enter a valid discount percentage between 0 and 100');
      return;
    }

    const targetIds = new Set(filteredRows.map(r => r.id));
    setRows(prev =>
      prev.map(row => {
        if (!targetIds.has(row.id)) return row;
        const calculatedSelling = Math.max(0, Math.round(row.mrp * (1 - pct / 100)));
        return {
          ...row,
          discountPercent: pct,
          sellingPrice: calculatedSelling,
          discountAmount: Math.max(0, row.mrp - calculatedSelling),
          isDirty: true
        };
      })
    );
    flash(`Applied ${pct}% discount to ${targetIds.size} products. Click "Save All Changes" to commit.`);
    setShowBulkDiscountModal(false);
    setBulkDiscountInput('');
  };

  // Bulk Toggle Active (Turn ON/OFF for all filtered)
  const handleBulkToggleActive = (turnOn: boolean) => {
    const targetIds = new Set(filteredRows.map(r => r.id));
    setRows(prev =>
      prev.map(row => {
        if (!targetIds.has(row.id)) return row;
        return { ...row, active: turnOn, isDirty: true };
      })
    );
    flash(`Turned ${turnOn ? 'ON' : 'OFF'} ${targetIds.size} products. Click "Save All Changes" to commit.`);
  };

  // Image Upload helper (converts to base64 DataURL for instant persistence)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'modal' | 'new') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      flash('Image file is larger than 2MB. Please select a smaller photo or paste an image URL.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (target === 'modal') {
        setTempImageUrl(dataUrl);
      } else {
        setNewItem(prev => ({ ...prev, imageUrl: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Export to Excel CSV
  const handleExportCsv = () => {
    const headers = ['Row', 'Image URL', 'SKU', 'Product Name', 'Category', 'Unit', 'MRP (INR)', 'Discount (%)', 'Discount (INR)', 'Selling Price (INR)', 'Stock', 'Min Stock', 'Expiry Date', 'Availability', 'Status'];
    const csvRows = [headers.join(',')];

    filteredRows.forEach((r, idx) => {
      const avail = r.stock > 0 ? (r.active ? 'In Stock' : 'Turned Off') : 'Out of Stock';
      const status = r.active ? 'ACTIVE' : 'OFF';
      const rowData = [
        idx + 1,
        `"${(r.imageUrl || '').replace(/"/g, '""')}"`,
        `"${r.sku.replace(/"/g, '""')}"`,
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.category.replace(/"/g, '""')}"`,
        `"${r.unit.replace(/"/g, '""')}"`,
        r.mrp,
        r.discountPercent,
        r.discountAmount,
        r.sellingPrice,
        r.stock,
        r.minStock,
        `"${r.expiryDate || 'N/A'}"`,
        `"${avail}"`,
        `"${status}"`
      ];
      csvRows.push(rowData.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Store_Inventory_Excel_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    flash('Inventory spreadsheet exported to CSV file');
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return rows.filter(r => {
      if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;
      if (statusFilter === 'in_stock' && (r.stock <= 0 || !r.active)) return false;
      if (statusFilter === 'low_stock' && r.stock > r.minStock) return false;
      if (statusFilter === 'turned_off' && r.active) return false;
      if (statusFilter === 'modified' && !r.isDirty) return false;
      
      if (statusFilter === 'near_expiry') {
        if (!r.expiryDate) return false;
        const exp = new Date(r.expiryDate);
        if (isNaN(exp.getTime())) return false;
        const diffDays = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0 || diffDays > 15) return false;
      }

      if (statusFilter === 'expired') {
        if (!r.expiryDate) return false;
        const exp = new Date(r.expiryDate);
        if (isNaN(exp.getTime())) return false;
        if (exp.getTime() >= today.getTime()) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.name.toLowerCase().includes(q);
        const matchSku = r.sku.toLowerCase().includes(q);
        const matchCategory = r.category.toLowerCase().includes(q);
        const matchBarcode = r.barcode?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchCategory && !matchBarcode) return false;
      }
      return true;
    });
  }, [rows, selectedCategory, statusFilter, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalProducts = rows.length;
    const totalStock = rows.reduce((acc, r) => acc + r.stock, 0);
    const totalValue = rows.reduce((acc, r) => acc + r.stock * r.sellingPrice, 0);
    const lowStockCount = rows.filter(r => r.stock <= r.minStock).length;
    const turnedOffCount = rows.filter(r => !r.active).length;
    const dirtyCount = rows.filter(r => r.isDirty).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredCount = rows.filter(r => {
      if (!r.expiryDate) return false;
      const exp = new Date(r.expiryDate);
      if (isNaN(exp.getTime())) return false;
      return exp.getTime() < today.getTime();
    }).length;

    const nearExpiryCount = rows.filter(r => {
      if (!r.expiryDate) return false;
      const exp = new Date(r.expiryDate);
      if (isNaN(exp.getTime())) return false;
      const diffDays = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 15;
    }).length;

    return { 
      totalProducts, 
      totalStock, 
      totalValue, 
      lowStockCount, 
      turnedOffCount, 
      dirtyCount,
      expiredCount,
      nearExpiryCount
    };
  }, [rows]);

  return (
    <div className="rounded-3xl bg-white shadow-sm border border-gray-100 overflow-hidden">
      {/* Excel Ribbon / Top Bar */}
      <div className="bg-[#107c41] px-5 py-3.5 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white shadow-xs">
            <FileSpreadsheet size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-sm">EXCEL INVENTORY SHEET</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white/95">
                Live Store Edition
              </span>
            </div>
            <p className="text-[11px] text-white/80">
              Directly add items without duplicates, update product images, amounts, discounts, stock, and turn products ON/OFF
            </p>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Direct Add Item Button */}
          <button
            onClick={() => setShowAddRow(prev => !prev)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white text-[#107c41] hover:bg-emerald-50 px-3.5 py-1.5 text-xs font-black shadow-xs transition active:scale-95 cursor-pointer"
            title="Directly add a new item to this sheet"
          >
            <PlusCircle size={15} className="stroke-[2.5]" />
            <span>{showAddRow ? 'Hide Add Form' : '+ Add New Item'}</span>
          </button>

          {stats.dirtyCount > 0 && (
            <button
              onClick={handleRevertAll}
              disabled={isBulkSaving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-bold text-white transition active:scale-95 cursor-pointer"
              title="Discard unsaved edits"
            >
              <RotateCcw size={14} />
              <span>Revert</span>
            </button>
          )}

          <button
            onClick={handleSaveAll}
            disabled={stats.dirtyCount === 0 || isBulkSaving}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-extrabold shadow-sm transition active:scale-95 cursor-pointer ${
              stats.dirtyCount > 0
                ? 'bg-[#d7ef8d] text-[#173d2e] hover:bg-[#c9e875] animate-pulse'
                : 'bg-white/10 text-white/50 cursor-not-allowed'
            }`}
          >
            {isBulkSaving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save All Changes {stats.dirtyCount > 0 ? `(${stats.dirtyCount})` : ''}</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-bold text-white transition cursor-pointer"
            title="Export this sheet to Excel CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          {onSwitchToCards && (
            <button
              onClick={onSwitchToCards}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-bold text-white transition cursor-pointer"
              title="Switch to Card Grid View"
            >
              <span>Card View</span>
            </button>
          )}
        </div>
      </div>

      {/* Formula & Quick Metrics Bar */}
      <div className="bg-[#f0f6f2] border-b border-gray-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#2b4435]">
        <div className="flex flex-wrap items-center gap-3 font-mono">
          <div className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 border border-gray-200 text-gray-700">
            <span className="font-bold text-[#107c41]">fx</span>
            <span className="text-gray-400">|</span>
            <span className="text-[11px] font-medium">SellingPrice = MRP - Discount; Duplicate Prevention = ON</span>
          </div>
          {focusedCell && (
            <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
              Cell: {focusedCell.field.toUpperCase()} ({focusedCell.id})
            </span>
          )}
        </div>

        {/* Live KPI Strip */}
        <div className="flex flex-wrap items-center gap-3 font-sans">
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Products:</span>
            <span className="font-extrabold text-[#173d2e]">{stats.totalProducts}</span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Units:</span>
            <span className="font-extrabold text-[#173d2e]">{stats.totalStock}</span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Valuation:</span>
            <span className="font-extrabold text-emerald-800">₹{stats.totalValue.toLocaleString('en-IN')}</span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Turned Off:</span>
            <span className={`font-extrabold ${stats.turnedOffCount > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
              {stats.turnedOffCount}
            </span>
          </div>
          {stats.nearExpiryCount > 0 && (
            <>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1 text-amber-800 font-extrabold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[11px]">
                <Calendar size={11} className="text-amber-600" />
                <span>{stats.nearExpiryCount} expiring soon</span>
              </div>
            </>
          )}
          {stats.expiredCount > 0 && (
            <>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1 text-rose-800 font-extrabold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 text-[11px]">
                <AlertTriangle size={11} className="text-rose-600" />
                <span>{stats.expiredCount} expired</span>
              </div>
            </>
          )}
          {stats.dirtyCount > 0 && (
            <>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1 text-amber-700 font-extrabold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <span>{stats.dirtyCount} unsaved</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filter and Tool Strip */}
      <div className="p-4 border-b border-gray-100 bg-[#fbfdfa] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search product name, SKU, barcode..."
              className="w-full rounded-xl border border-gray-200 bg-white py-1.5 pl-9 pr-3 text-xs text-gray-800 placeholder-gray-400 focus:border-[#107c41] focus:outline-hidden focus:ring-1 focus:ring-[#107c41]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 focus:border-[#107c41] focus:outline-hidden"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                statusFilter === 'all' ? 'bg-[#173d2e] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({rows.length})
            </button>
            <button
              onClick={() => setStatusFilter('in_stock')}
              className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                statusFilter === 'in_stock' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              In Stock
            </button>
            <button
              onClick={() => setStatusFilter('low_stock')}
              className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                statusFilter === 'low_stock' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Low Stock ({stats.lowStockCount})
            </button>
            <button
              onClick={() => setStatusFilter('turned_off')}
              className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                statusFilter === 'turned_off' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              Turned Off ({stats.turnedOffCount})
            </button>
            {stats.nearExpiryCount > 0 && (
              <button
                onClick={() => setStatusFilter('near_expiry')}
                className={`rounded-xl px-2.5 py-1 text-xs font-bold transition flex items-center gap-1 ${
                  statusFilter === 'near_expiry' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                }`}
                title="Products expiring in <= 15 days"
              >
                <Calendar size={12} />
                <span>Expiring Soon ({stats.nearExpiryCount})</span>
              </button>
            )}
            {stats.expiredCount > 0 && (
              <button
                onClick={() => setStatusFilter('expired')}
                className={`rounded-xl px-2.5 py-1 text-xs font-bold transition flex items-center gap-1 ${
                  statusFilter === 'expired' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                }`}
                title="Products past expiry date"
              >
                <AlertTriangle size={12} />
                <span>Expired ({stats.expiredCount})</span>
              </button>
            )}
            {stats.dirtyCount > 0 && (
              <button
                onClick={() => setStatusFilter('modified')}
                className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                  statusFilter === 'modified' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-900'
                }`}
              >
                Modified ({stats.dirtyCount})
              </button>
            )}
          </div>
        </div>

        {/* Quick Operations Strip */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Apply Bulk Discount Button */}
          <button
            onClick={() => setShowBulkDiscountModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 px-3 py-1.5 text-xs font-bold text-purple-900 border border-purple-200 transition cursor-pointer"
            title="Apply a bulk discount % to all matching items"
          >
            <Percent size={13} />
            <span>Bulk Discount %</span>
          </button>

          {/* Quick Bulk Toggle */}
          <div className="flex items-center rounded-xl border border-gray-200 bg-white p-0.5">
            <button
              onClick={() => handleBulkToggleActive(true)}
              className="px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
              title="Turn ON all visible items"
            >
              All ON
            </button>
            <span className="text-gray-300">/</span>
            <button
              onClick={() => handleBulkToggleActive(false)}
              className="px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-50 rounded-lg transition"
              title="Turn OFF all visible items"
            >
              All OFF
            </button>
          </div>

          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
            >
              <ScanLine size={13} />
              <span>Barcode</span>
            </button>
          )}

          {onOpenErp && (
            <button
              onClick={onOpenErp}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#173d2e] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1f4e3c] transition cursor-pointer"
            >
              <Warehouse size={13} />
              <span>ERP Batches</span>
            </button>
          )}

          {onOpenClear && (
            <button
              onClick={onOpenClear}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-800 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
              title="Clear or reset inventory"
            >
              <PackageX size={13} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* DIRECTLY ADD NEW ITEM COMPOSER ROW (EXPANDABLE) */}
      {showAddRow && (
        <div className="bg-[#f2f8f4] border-b-2 border-[#107c41] p-4 transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-200">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#107c41] text-white">
                <Plus size={16} />
              </div>
              <h3 className="font-extrabold text-[#173d2e] text-sm">Directly Add New Item to Inventory</h3>
              <span className="rounded-full bg-emerald-200/70 text-[#173d2e] px-2 py-0.5 text-[10px] font-bold">
                Anti-Duplicate Active
              </span>
            </div>
            <button
              onClick={() => setShowAddRow(false)}
              className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
            >
              <X size={16} />
            </button>
          </div>

          {/* Real-Time Duplicate Alert Warning */}
          {duplicateCheck?.isDuplicate && (
            <div className="mt-3 rounded-2xl border-2 border-amber-400 bg-amber-50 p-3 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-amber-200 flex items-center justify-center text-amber-800 shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <div className="font-black text-amber-900 text-xs">
                    DUPLICATE ITEM DETECTED ({duplicateCheck.reason})
                  </div>
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    This product is already in your store as <b>"{duplicateCheck.existing.name}"</b> (SKU: {duplicateCheck.existing.sku}, Stock: {duplicateCheck.existing.stock}, Selling Price: ₹{duplicateCheck.existing.sellingPrice}). Items cannot be duplicated.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddRow(false);
                  setSearchQuery(duplicateCheck.existing.name);
                  setHighlightedRowId(duplicateCheck.existing.id);
                  setTimeout(() => setHighlightedRowId(null), 5000);
                  flash(`Located existing item "${duplicateCheck.existing.name}". Update its stock or price directly.`);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white px-3.5 py-1.5 text-xs font-extrabold transition cursor-pointer shadow-xs"
              >
                <CornerDownRight size={13} />
                <span>Jump to Existing Item</span>
              </button>
            </div>
          )}

          {/* Form Grid */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* Image Preview & URL */}
            <div className="md:col-span-2 flex items-center gap-2.5 bg-white p-2 rounded-xl border border-gray-200">
              <div className="relative group shrink-0">
                {newItem.imageUrl ? (
                  <img
                    src={newItem.imageUrl}
                    alt="New"
                    referrerPolicy="no-referrer"
                    className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-emerald-50 border border-dashed border-emerald-300 flex flex-col items-center justify-center text-[#107c41]">
                    <ImageIcon size={16} />
                    <span className="text-[8px] font-bold mt-0.5">No Img</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Product Image (URL / Upload)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newItem.imageUrl}
                    onChange={e => setNewItem(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="Paste image link https://..."
                    className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-800 focus:outline-hidden focus:border-[#107c41]"
                  />
                  <input
                    type="file"
                    ref={addFileInputRef}
                    onChange={e => handleFileUpload(e, 'new')}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => addFileInputRef.current?.click()}
                    className="h-7 px-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    title="Upload image from computer"
                  >
                    <Upload size={11} />
                    <span>Upload</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Product Name */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-700 mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={newItem.name}
                onChange={e => {
                  const val = e.target.value;
                  setNewItem(prev => {
                    const autoSku = prev.sku ? prev.sku : val.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
                    return { ...prev, name: val, sku: prev.sku || autoSku };
                  });
                }}
                placeholder="e.g. Tata Salt, Amul Butter, Basmati Rice"
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-900 focus:border-[#107c41] focus:outline-hidden"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-[10px] font-bold text-gray-700 mb-1">Category</label>
              <input
                type="text"
                list="new-categories"
                value={newItem.category}
                onChange={e => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Category"
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:border-[#107c41] focus:outline-hidden"
              />
              <datalist id="new-categories">
                {categories.map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-[10px] font-bold text-gray-700 mb-1">Unit</label>
              <select
                value={newItem.unit}
                onChange={e => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full rounded-xl border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-[#107c41] focus:outline-hidden"
              >
                <option value="1 kg">1 kg</option>
                <option value="500 g">500 g</option>
                <option value="250 g">250 g</option>
                <option value="1 piece">1 piece</option>
                <option value="1 L">1 L</option>
                <option value="500 ml">500 ml</option>
                <option value="1 pack">1 pack</option>
                <option value="dozen">dozen</option>
              </select>
            </div>

            {/* SKU (Auto or Custom) */}
            <div>
              <label className="block text-[10px] font-bold text-gray-700 mb-1">SKU (Auto or Custom)</label>
              <input
                type="text"
                value={newItem.sku}
                onChange={e => setNewItem(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                placeholder="AUTO"
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-mono font-bold text-gray-800 focus:border-[#107c41] focus:outline-hidden"
              />
            </div>

            {/* MRP (₹) */}
            <div>
              <label className="block text-[10px] font-bold text-gray-700 mb-1">MRP (₹)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={newItem.mrp}
                onChange={e => handleNewItemPriceChange('mrp', parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-mono font-bold text-gray-900 focus:border-[#107c41] focus:outline-hidden"
              />
            </div>

            {/* Discount (%) */}
            <div>
              <label className="block text-[10px] font-bold text-purple-900 mb-1">Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={newItem.discountPercent}
                onChange={e => handleNewItemPriceChange('discountPercent', parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-purple-300 bg-purple-50/50 px-3 py-1.5 text-xs font-mono font-black text-purple-900 focus:border-purple-600 focus:outline-hidden"
              />
            </div>

            {/* Selling Price / Amount (₹) */}
            <div>
              <label className="block text-[10px] font-bold text-emerald-900 mb-1">Amount / Selling (₹)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={newItem.sellingPrice}
                onChange={e => handleNewItemPriceChange('sellingPrice', parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-emerald-400 bg-emerald-50/70 px-3 py-1.5 text-xs font-mono font-black text-[#107c41] focus:border-[#107c41] focus:outline-hidden"
              />
            </div>

            {/* Stock Units */}
            <div>
              <label className="block text-[10px] font-bold text-gray-700 mb-1">Stock (Units)</label>
              <input
                type="number"
                min="0"
                value={newItem.stock}
                onChange={e => setNewItem(prev => ({ ...prev, stock: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-mono font-bold text-gray-900 focus:border-[#107c41] focus:outline-hidden"
              />
            </div>

            {/* Min Stock */}
            <div>
              <label className="block text-[10px] font-bold text-gray-700 mb-1">Min Alert Stock</label>
              <input
                type="number"
                min="0"
                value={newItem.minStock}
                onChange={e => setNewItem(prev => ({ ...prev, minStock: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-mono text-gray-700 focus:border-[#107c41] focus:outline-hidden"
              />
            </div>

            {/* Expiry Date (Optional Calendar) */}
            <div>
              <label className="block text-[10px] font-bold text-amber-900 mb-1 flex items-center gap-1">
                <Calendar size={11} className="text-amber-700" />
                <span>Expiry Date (Optional)</span>
              </label>
              <input
                type="date"
                value={newItem.expiryDate}
                onChange={e => setNewItem(prev => ({ ...prev, expiryDate: e.target.value }))}
                className="w-full rounded-xl border border-amber-300 bg-amber-50/70 px-3 py-1.5 text-xs font-mono font-bold text-amber-950 focus:border-amber-600 focus:outline-hidden cursor-pointer"
              />
            </div>
          </div>

          {/* Quick Grocery Presets Selector */}
          <div className="mt-2.5 pt-2.5 border-t border-emerald-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-600">
              <span className="font-bold text-emerald-800">Quick Image Presets:</span>
              {GROCERY_IMAGE_PRESETS.slice(0, 6).map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setNewItem(prev => ({ ...prev, imageUrl: preset.url }))}
                  className="rounded-lg bg-white border border-gray-200 px-2 py-0.5 text-[10px] font-medium hover:bg-emerald-50 text-gray-700 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddRow(false)}
                className="rounded-xl px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewItem}
                disabled={isCreatingItem || !newItem.name.trim() || !!duplicateCheck?.isDuplicate}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-extrabold shadow-sm transition active:scale-95 cursor-pointer ${
                  duplicateCheck?.isDuplicate
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#107c41] hover:bg-[#0c6233] text-white'
                }`}
                title={duplicateCheck?.isDuplicate ? 'Duplicate detected: Cannot create duplicate item' : 'Add this item to inventory'}
              >
                {isCreatingItem ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    <span>Add Item to Store</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Discount Modal */}
      {showBulkDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-800">
                  <Percent size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Bulk Apply Discount</h3>
                  <p className="text-xs text-gray-500">Apply discount % to all {filteredRows.length} visible items</p>
                </div>
              </div>
              <button onClick={() => setShowBulkDiscountModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Discount Percentage (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={bulkDiscountInput}
                    onChange={e => setBulkDiscountInput(e.target.value)}
                    placeholder="e.g. 10 or 15"
                    className="w-full rounded-xl border border-gray-300 py-2.5 pl-3 pr-8 text-sm font-bold text-gray-900 focus:border-purple-600 focus:outline-hidden focus:ring-1 focus:ring-purple-600"
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-2">
                {[5, 10, 15, 20, 25, 30].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setBulkDiscountInput(String(p))}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      bulkDiscountInput === String(p)
                        ? 'bg-purple-700 text-white'
                        : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                    }`}
                  >
                    {p}% OFF
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed bg-purple-50/50 p-2.5 rounded-xl border border-purple-100">
                💡 Entering a discount will automatically recalculate the Selling Price for each product based on its MRP.
                You can review before clicking <b>Save All Changes</b>.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowBulkDiscountModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyBulkDiscount}
                disabled={!bulkDiscountInput}
                className="rounded-xl bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 text-xs font-extrabold transition disabled:opacity-50 cursor-pointer"
              >
                Apply to {filteredRows.length} Items
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Image Viewer & Editor Modal */}
      {imageModalRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <ImageIcon size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Edit Product Image</h3>
                  <p className="text-xs text-gray-500">{imageModalRow.name} ({imageModalRow.sku})</p>
                </div>
              </div>
              <button onClick={() => setImageModalRow(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Image Preview Window */}
              <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                {tempImageUrl ? (
                  <div className="relative group">
                    <img
                      src={tempImageUrl}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="h-44 w-44 rounded-xl object-cover shadow-sm border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setTempImageUrl('')}
                      className="absolute top-2 right-2 rounded-full bg-rose-600 text-white p-1.5 shadow hover:bg-rose-700 transition"
                      title="Remove image"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="h-44 w-44 rounded-xl bg-gray-100 border border-gray-200 flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon size={36} className="mb-2 text-gray-300" />
                    <span className="text-xs font-bold text-gray-500">No Image Set</span>
                    <span className="text-[10px] text-gray-400">Paste URL or select preset below</span>
                  </div>
                )}
              </div>

              {/* Paste URL or Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Image Link / URL</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={tempImageUrl}
                      onChange={e => setTempImageUrl(e.target.value)}
                      placeholder="Paste image link https://..."
                      className="w-full rounded-xl border border-gray-300 py-2 pl-8 pr-3 text-xs text-gray-900 focus:border-[#107c41] focus:outline-hidden"
                    />
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={e => handleFileUpload(e, 'modal')}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 px-3 py-2 text-xs font-bold text-gray-700 transition cursor-pointer shrink-0"
                  >
                    <Upload size={13} />
                    <span>Upload Photo</span>
                  </button>
                </div>
              </div>

              {/* Quick Grocery Image Presets */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Or pick from Grocery Image Presets:
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                  {GROCERY_IMAGE_PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setTempImageUrl(preset.url)}
                      className={`flex flex-col items-center p-1.5 rounded-xl border transition text-left cursor-pointer ${
                        tempImageUrl === preset.url
                          ? 'border-[#107c41] bg-emerald-50 ring-2 ring-emerald-200'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        referrerPolicy="no-referrer"
                        className="h-12 w-full object-cover rounded-lg"
                      />
                      <span className="text-[10px] font-bold text-gray-800 mt-1 truncate w-full text-center">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t pt-3">
              <button
                type="button"
                onClick={() => setImageModalRow(null)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (imageModalRow) {
                    handleCellChange(imageModalRow.id, 'imageUrl', tempImageUrl);
                    flash(`Updated image for ${imageModalRow.name}`);
                  }
                  setImageModalRow(null);
                }}
                className="rounded-xl bg-[#107c41] hover:bg-[#0c6233] text-white px-4 py-2 text-xs font-extrabold transition cursor-pointer"
              >
                Apply Image to Row
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SPREADSHEET GRID CONTAINER */}
      <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
        <table className="w-full border-collapse text-left text-xs">
          {/* Excel Column Headers */}
          <thead className="sticky top-0 z-20 bg-[#e7efe9] text-[#173d2e] border-b-2 border-[#107c41] font-extrabold select-none">
            <tr>
              <th className="w-12 px-3 py-2.5 text-center border-r border-gray-300 bg-[#d8e8dc]">#</th>
              {/* DEDICATED IMAGE COLUMN */}
              <th className="w-24 px-3 py-2.5 text-center border-r border-gray-300 bg-emerald-100/50">
                <div className="flex items-center justify-center gap-1">
                  <ImageIcon size={14} className="text-[#107c41]" />
                  <span>Image</span>
                </div>
              </th>
              <th className="min-w-[200px] px-3 py-2.5 border-r border-gray-300">Product Name & SKU</th>
              <th className="w-28 px-3 py-2.5 border-r border-gray-300">Category</th>
              <th className="w-20 px-3 py-2.5 border-r border-gray-300 text-center">Unit</th>
              <th className="w-24 px-3 py-2.5 border-r border-gray-300 text-right">MRP (₹)</th>
              <th className="w-36 px-3 py-2.5 border-r border-gray-300 text-center bg-purple-50/60">
                Discount (% / ₹)
              </th>
              <th className="w-32 px-3 py-2.5 border-r border-gray-300 text-right bg-emerald-50/70 text-[#107c41]">
                Amount (₹)
              </th>
              <th className="w-36 px-3 py-2.5 border-r border-gray-300 text-center">Stock (Units)</th>
              <th className="w-20 px-3 py-2.5 border-r border-gray-300 text-center">Min</th>
              {/* DEDICATED EXPIRY DATE COLUMN */}
              <th className="w-48 px-3 py-2.5 border-r border-gray-300 text-center bg-amber-50/70 text-amber-950">
                <div className="flex items-center justify-center gap-1.5">
                  <Calendar size={13} className="text-amber-700" />
                  <span>Expiry Date</span>
                </div>
              </th>
              <th className="w-32 px-3 py-2.5 border-r border-gray-300 text-center">Availability</th>
              <th className="w-36 px-3 py-2.5 border-r border-gray-300 text-center bg-gray-100">
                Turn Product OFF / ON
              </th>
              <th className="w-24 px-3 py-2.5 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {filteredRows.map((row, idx) => {
              const isTurnedOff = !row.active;
              const isOutOfStock = row.stock <= 0;
              const isLowStock = row.stock <= row.minStock && row.stock > 0;
              const isHighlighted = highlightedRowId === row.id;

              return (
                <tr
                  key={row.id}
                  className={`transition-all font-medium ${
                    isHighlighted
                      ? 'bg-amber-100 ring-2 ring-amber-500 scale-[1.002]'
                      : row.isDirty
                      ? 'bg-amber-50/40 hover:bg-amber-50/60'
                      : isTurnedOff
                      ? 'bg-gray-50/80 opacity-75 hover:bg-gray-100/80'
                      : idx % 2 === 0
                      ? 'bg-white hover:bg-[#f6faf7]'
                      : 'bg-[#fafcfb] hover:bg-[#f3f8f5]'
                  }`}
                >
                  {/* Row # */}
                  <td className="px-2 py-2 text-center font-mono text-[11px] text-gray-500 border-r border-gray-200 bg-gray-50/70 select-none">
                    <div className="flex items-center justify-center gap-1">
                      {row.isDirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Modified" />}
                      <span>{idx + 1}</span>
                    </div>
                  </td>

                  {/* DEDICATED IMAGE COLUMN */}
                  <td className="px-2 py-1.5 border-r border-gray-200 text-center">
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setImageModalRow(row);
                          setTempImageUrl(row.imageUrl || '');
                        }}
                        className="relative group h-11 w-11 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 hover:border-[#107c41] transition cursor-pointer shadow-2xs"
                        title="Click to view, change, or upload product image"
                      >
                        {row.imageUrl ? (
                          <img
                            src={row.imageUrl}
                            alt={row.name}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover group-hover:scale-105 transition"
                          />
                        ) : (
                          <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 bg-gray-100 hover:bg-emerald-50">
                            <ImageIcon size={14} className="text-gray-400 group-hover:text-[#107c41]" />
                            <span className="text-[8px] font-bold text-gray-500">+ Pic</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[9px] font-bold">
                          <Camera size={13} />
                        </div>
                      </button>
                    </div>
                  </td>

                  {/* Product Name & SKU */}
                  <td className="px-3 py-2 border-r border-gray-200">
                    <div className="min-w-0">
                      <div className={`font-bold text-gray-900 truncate ${isTurnedOff ? 'line-through text-gray-500' : ''}`}>
                        {row.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
                        <span className="font-bold">{row.sku}</span>
                        {row.barcode && (
                          <>
                            <span>•</span>
                            <span>Bar: {row.barcode}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-3 py-2 border-r border-gray-200 text-gray-600 truncate">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700">
                      {row.category}
                    </span>
                  </td>

                  {/* Unit */}
                  <td className="px-2 py-2 border-r border-gray-200 text-center font-mono text-[11px] text-gray-600">
                    {row.unit}
                  </td>

                  {/* MRP (₹) - Editable */}
                  <td className="px-2 py-1.5 border-r border-gray-200 text-right">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={row.mrp}
                        onFocus={() => setFocusedCell({ id: row.id, field: 'mrp' })}
                        onBlur={() => setFocusedCell(null)}
                        onChange={e => handleCellChange(row.id, 'mrp', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white py-1 pl-5 pr-1.5 text-right font-mono font-bold text-gray-800 text-xs focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41] focus:outline-hidden"
                      />
                    </div>
                  </td>

                  {/* Discount (% / ₹) - Dual Interactive Control */}
                  <td className="px-2 py-1.5 border-r border-gray-200 bg-purple-50/30">
                    <div className="flex items-center gap-1">
                      {/* Percent Input */}
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={row.discountPercent}
                          onFocus={() => setFocusedCell({ id: row.id, field: 'discountPercent' })}
                          onBlur={() => setFocusedCell(null)}
                          onChange={e => handleCellChange(row.id, 'discountPercent', e.target.value)}
                          className="w-full rounded-lg border border-purple-200 bg-white py-1 pl-1.5 pr-4 text-center font-mono font-extrabold text-purple-900 text-xs focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-hidden"
                          title="Discount percentage (%)"
                        />
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-purple-400 text-[10px] font-bold">%</span>
                      </div>

                      {/* Flat ₹ Off display */}
                      <div className="text-[10px] font-mono text-purple-800 shrink-0 font-bold px-1 bg-purple-100 rounded">
                        -₹{row.discountAmount}
                      </div>
                    </div>
                  </td>

                  {/* Selling Price / Product Amount (₹) - Editable */}
                  <td className="px-2 py-1.5 border-r border-gray-200 text-right bg-emerald-50/40">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-700 font-bold text-[10px]">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={row.sellingPrice}
                        onFocus={() => setFocusedCell({ id: row.id, field: 'sellingPrice' })}
                        onBlur={() => setFocusedCell(null)}
                        onChange={e => handleCellChange(row.id, 'sellingPrice', e.target.value)}
                        className="w-full rounded-lg border border-emerald-300 bg-white py-1 pl-5 pr-1.5 text-right font-mono font-black text-[#107c41] text-xs focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41] focus:outline-hidden"
                      />
                    </div>
                    {row.discountPercent > 0 && (
                      <div className="mt-0.5 text-[9px] font-extrabold text-emerald-700 text-right">
                        Save {row.discountPercent}%
                      </div>
                    )}
                  </td>

                  {/* Stock (Units) - Editable with steppers */}
                  <td className="px-2 py-1.5 border-r border-gray-200">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustStock(row.id, -1)}
                        className="h-6 w-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 active:scale-95 transition cursor-pointer"
                        title="Decrement stock by 1"
                      >
                        <Minus size={11} />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={row.stock}
                        onFocus={() => setFocusedCell({ id: row.id, field: 'stock' })}
                        onBlur={() => setFocusedCell(null)}
                        onChange={e => handleCellChange(row.id, 'stock', e.target.value)}
                        className={`w-14 rounded-lg border py-1 px-1 text-center font-mono font-bold text-xs focus:outline-hidden ${
                          row.stock <= row.minStock
                            ? 'border-amber-300 bg-amber-50 text-amber-900'
                            : 'border-gray-200 bg-white text-gray-800'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => adjustStock(row.id, 1)}
                        className="h-6 w-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 active:scale-95 transition cursor-pointer"
                        title="Increment stock by 1"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                    {isLowStock && (
                      <div className="mt-0.5 text-[9px] font-bold text-amber-600 text-center flex items-center justify-center gap-0.5">
                        <AlertTriangle size={9} /> Low Stock
                      </div>
                    )}
                  </td>

                  {/* Min Stock */}
                  <td className="px-2 py-1.5 border-r border-gray-200 text-center">
                    <input
                      type="number"
                      min="0"
                      value={row.minStock}
                      onFocus={() => setFocusedCell({ id: row.id, field: 'minStock' })}
                      onBlur={() => setFocusedCell(null)}
                      onChange={e => handleCellChange(row.id, 'minStock', e.target.value)}
                      className="w-12 rounded-lg border border-gray-200 bg-white py-1 px-1 text-center font-mono text-xs text-gray-600 focus:border-[#107c41] focus:outline-hidden"
                    />
                  </td>

                  {/* DEDICATED EXPIRY DATE CELL - CLICK CELL TO OPEN CALENDAR */}
                  <td
                    onClick={() => openDatePicker(row.id)}
                    className="px-2 py-1.5 border-r border-gray-200 text-center relative group cursor-pointer hover:bg-amber-50/40 transition select-none"
                    title="Click cell to open calendar picker and set Expiry Date"
                  >
                    <div className="flex flex-col items-center justify-center min-h-[40px] gap-1">
                      <div className="flex items-center gap-1 w-full justify-center">
                        <input
                          ref={el => { dateInputRefs.current[row.id] = el; }}
                          type="date"
                          value={row.expiryDate || ''}
                          onClick={e => e.stopPropagation()}
                          onChange={e => handleCellChange(row.id, 'expiryDate', e.target.value)}
                          className="w-32 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-mono text-gray-800 focus:border-amber-500 focus:outline-hidden cursor-pointer shadow-2xs hover:border-amber-400"
                        />
                        {row.expiryDate && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleCellChange(row.id, 'expiryDate', '');
                              flash(`Cleared expiry date for ${row.name}`);
                            }}
                            className="h-6 w-6 rounded-md hover:bg-rose-100 text-gray-400 hover:text-rose-600 flex items-center justify-center transition shrink-0"
                            title="Clear expiry date"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>

                      {/* Expiry status badge (e.g. Expired, 3d left, Expires Today, 6m left) */}
                      {row.expiryDate ? (
                        (() => {
                          const info = getExpiryInfo(row.expiryDate);
                          if (!info) return null;
                          return (
                            <div className="flex items-center gap-1">
                              <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] border font-bold ${info.badgeClass}`}>
                                <Clock size={9} />
                                <span>{info.badgeText}</span>
                              </span>
                            </div>
                          );
                        })()
                      ) : (
                        <span className="text-[9px] text-gray-400 group-hover:text-amber-700 transition">
                          Click cell to set date
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Availability Indicator */}
                  <td className="px-3 py-2 border-r border-gray-200 text-center">
                    {isTurnedOff ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 text-gray-700 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                        <EyeOff size={10} /> Disabled
                      </span>
                    ) : isOutOfStock ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                        🔴 Out of stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                        🟢 In Stock
                      </span>
                    )}
                  </td>

                  {/* Turn Product OFF / ON Power Switch */}
                  <td className="px-3 py-2 border-r border-gray-200 text-center bg-gray-50/50">
                    <button
                      type="button"
                      onClick={() => handleCellChange(row.id, 'active', !row.active)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black transition active:scale-95 cursor-pointer shadow-2xs ${
                        row.active
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-300'
                      }`}
                      title={row.active ? 'Click to TURN PRODUCT OFF (Hide from store)' : 'Click to TURN PRODUCT ON (Make visible in store)'}
                    >
                      <Power size={12} className="stroke-[3]" />
                      <span>{row.active ? 'PRODUCT ON' : 'TURNED OFF'}</span>
                    </button>
                    <div className="text-[9px] text-gray-400 mt-0.5">
                      {row.active ? 'Live in customer app' : 'Hidden from customers'}
                    </div>
                  </td>

                  {/* Actions / Save Row */}
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleSaveRow(row)}
                      disabled={!row.isDirty || row.isSaving}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-extrabold transition active:scale-95 cursor-pointer ${
                        row.isSaving
                          ? 'bg-gray-100 text-gray-400 cursor-wait'
                          : row.isDirty
                          ? 'bg-[#107c41] text-white hover:bg-[#0c6233] shadow-xs'
                          : 'bg-transparent text-gray-400 hover:bg-gray-100'
                      }`}
                      title={row.isDirty ? 'Save this row' : 'No unsaved changes'}
                    >
                      {row.isSaving ? (
                        <RefreshCw size={12} className="animate-spin" />
                      ) : row.isDirty ? (
                        <>
                          <Save size={12} />
                          <span>Save</span>
                        </>
                      ) : (
                        <>
                          <Check size={12} className="text-emerald-600" />
                          <span className="text-[10px]">Saved</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}

            {!filteredRows.length && (
              <tr>
                <td colSpan={14} className="py-12 text-center text-gray-400">
                  <PackageX size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="font-bold text-gray-600">No products match your filter criteria</p>
                  <p className="text-xs text-gray-400 mt-1">Try clearing your search or status filter, or click "+ Add New Item" above</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Spreadsheet Bottom Status Bar */}
      <div className="bg-[#e7efe9] border-t border-gray-200 px-5 py-2 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#173d2e] select-none font-sans">
        <div className="flex items-center gap-2">
          <span className="font-bold">Ready</span>
          <span className="text-gray-400">•</span>
          <span>
            Showing {filteredRows.length} of {rows.length} records
          </span>
          {searchQuery && (
            <span className="rounded bg-white/70 px-1.5 py-0.5 text-gray-600">
              Filter: "{searchQuery}"
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span>
            Sum (Stock): <b>{filteredRows.reduce((a, b) => a + b.stock, 0)} units</b>
          </span>
          <span>
            Sum (Valuation):{' '}
            <b className="text-emerald-800">
              ₹{filteredRows.reduce((a, b) => a + b.stock * b.sellingPrice, 0).toLocaleString('en-IN')}
            </b>
          </span>
          {stats.dirtyCount > 0 && (
            <button
              onClick={handleSaveAll}
              disabled={isBulkSaving}
              className="font-extrabold text-[#107c41] underline cursor-pointer hover:text-emerald-900"
            >
              Save {stats.dirtyCount} pending change{stats.dirtyCount > 1 ? 's' : ''} now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
