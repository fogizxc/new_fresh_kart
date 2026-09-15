import { Router } from 'express';
import { mongoDb } from '../db/mongodb.ts';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import { products } from '../store/memoryStore.ts';

export interface BatchExpiryRecord {
  id: string;
  batchNumber: string;
  productId: string;
  productName: string;
  shopId: string;
  stockQty: number;
  costPrice: number;
  originalPrice: number;
  mfgDate: string;
  expiryDate: string;
  daysRemaining: number;
  clearanceDiscountPercent: number; // e.g. 30 (for 30% off)
  clearancePrice: number;
  status: 'FRESH' | 'EXPIRING_SOON' | 'CRITICAL' | 'EXPIRED';
  isClearanceActive: boolean;
}

// Generate realistic mock batch data based on current date
function generateInitialBatches(): BatchExpiryRecord[] {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  return [
    {
      id: 'batch-001',
      batchNumber: 'B-DAIRY-941',
      productId: 'p-milk-1',
      productName: 'Fresh Buffalo Full Cream Milk 1L',
      shopId: 'shop-1',
      stockQty: 18,
      costPrice: 52,
      originalPrice: 70,
      mfgDate: new Date(now - 3 * oneDay).toISOString().split('T')[0],
      expiryDate: new Date(now + 1.5 * oneDay).toISOString().split('T')[0],
      daysRemaining: 1,
      clearanceDiscountPercent: 40,
      clearancePrice: 42,
      status: 'CRITICAL',
      isClearanceActive: true
    },
    {
      id: 'batch-002',
      batchNumber: 'B-BAKERY-320',
      productId: 'p-bread-1',
      productName: 'Artisan Whole Wheat Sourdough Loaf',
      shopId: 'shop-1',
      stockQty: 8,
      costPrice: 65,
      originalPrice: 110,
      mfgDate: new Date(now - 4 * oneDay).toISOString().split('T')[0],
      expiryDate: new Date(now + 2 * oneDay).toISOString().split('T')[0],
      daysRemaining: 2,
      clearanceDiscountPercent: 30,
      clearancePrice: 77,
      status: 'EXPIRING_SOON',
      isClearanceActive: true
    },
    {
      id: 'batch-003',
      batchNumber: 'B-DAIRY-772',
      productId: 'p-yogurt-1',
      productName: 'Greek Probiotic Plain Yogurt 400g',
      shopId: 'shop-1',
      stockQty: 14,
      costPrice: 70,
      originalPrice: 120,
      mfgDate: new Date(now - 7 * oneDay).toISOString().split('T')[0],
      expiryDate: new Date(now + 3 * oneDay).toISOString().split('T')[0],
      daysRemaining: 3,
      clearanceDiscountPercent: 25,
      clearancePrice: 90,
      status: 'EXPIRING_SOON',
      isClearanceActive: true
    },
    {
      id: 'batch-004',
      batchNumber: 'B-FRUIT-819',
      productId: 'p-berries-1',
      productName: 'Imported Fresh Strawberries 250g',
      shopId: 'shop-1',
      stockQty: 12,
      costPrice: 110,
      originalPrice: 160,
      mfgDate: new Date(now - 3 * oneDay).toISOString().split('T')[0],
      expiryDate: new Date(now + 2.5 * oneDay).toISOString().split('T')[0],
      daysRemaining: 2,
      clearanceDiscountPercent: 35,
      clearancePrice: 104,
      status: 'EXPIRING_SOON',
      isClearanceActive: true
    },
    {
      id: 'batch-005',
      batchNumber: 'B-PANEER-551',
      productId: 'p-paneer-1',
      productName: 'Fresh Malai Paneer Block 200g',
      shopId: 'shop-1',
      stockQty: 25,
      costPrice: 72,
      originalPrice: 98,
      mfgDate: new Date(now - 2 * oneDay).toISOString().split('T')[0],
      expiryDate: new Date(now + 8 * oneDay).toISOString().split('T')[0],
      daysRemaining: 8,
      clearanceDiscountPercent: 0,
      clearancePrice: 98,
      status: 'FRESH',
      isClearanceActive: false
    }
  ];
}

export const memoryBatches: BatchExpiryRecord[] = generateInitialBatches();

export const fefoExpiryRouter = Router();

// Public / Customer endpoint: View active clearance markdown deals
fefoExpiryRouter.get('/clearance-deals', (_req, res) => {
  const activeClearance = memoryBatches.filter(b => b.isClearanceActive && b.stockQty > 0);
  return res.json(activeClearance);
});

// Protected Storekeeper / Admin endpoints:
fefoExpiryRouter.get('/batches', requireAuth, requireRole('shopkeeper', 'store_manager', 'admin', 'super_admin'), (_req, res) => {
  return res.json(memoryBatches);
});

// Toggle or update clearance discount on a batch
fefoExpiryRouter.patch('/batches/:id/discount', requireAuth, requireRole('shopkeeper', 'store_manager', 'admin', 'super_admin'), (req, res) => {
  const { id } = req.params;
  const { discountPercent, isClearanceActive } = req.body ?? {};

  const batch = memoryBatches.find(b => b.id === id);
  if (!batch) return res.status(404).json({ error: 'Batch not found' });

  if (typeof discountPercent === 'number') {
    batch.clearanceDiscountPercent = Math.min(80, Math.max(0, discountPercent));
    batch.clearancePrice = Math.round(batch.originalPrice * (1 - batch.clearanceDiscountPercent / 100));
  }

  if (typeof isClearanceActive === 'boolean') {
    batch.isClearanceActive = isClearanceActive;
  }

  return res.json({ ok: true, batch });
});

// Auto-run FEFO Clearance Markdown algorithm across all batches
fefoExpiryRouter.post('/batches/auto-fefo-apply', requireAuth, requireRole('shopkeeper', 'store_manager', 'admin', 'super_admin'), (_req, res) => {
  let updatedCount = 0;

  for (const batch of memoryBatches) {
    if (batch.daysRemaining <= 1 && batch.status !== 'EXPIRED') {
      batch.status = 'CRITICAL';
      batch.clearanceDiscountPercent = 40;
      batch.clearancePrice = Math.round(batch.originalPrice * 0.6);
      batch.isClearanceActive = true;
      updatedCount++;
    } else if (batch.daysRemaining <= 3 && batch.status !== 'EXPIRED') {
      batch.status = 'EXPIRING_SOON';
      batch.clearanceDiscountPercent = 25;
      batch.clearancePrice = Math.round(batch.originalPrice * 0.75);
      batch.isClearanceActive = true;
      updatedCount++;
    }
  }

  return res.json({
    ok: true,
    message: `FEFO Clearance Rules applied successfully across ${updatedCount} perishable batches!`,
    batches: memoryBatches
  });
});
