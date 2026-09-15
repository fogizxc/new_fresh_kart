import { Router } from 'express';
import { mongoDb } from '../db/mongodb.ts';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import { hashPassword, isStrongPassword } from '../auth/password.ts';
import type { Product, Shop, User, SalesImport } from '../models/domain.ts';
import { salesImports, products as memoryProducts } from '../store/memoryStore.ts';

export type PartnerApplicationType = 'shopkeeper' | 'employee';

interface PartnerApplication { referenceId: string; type: PartnerApplicationType; fullName: string; email: string; phone: string; address: string; city: string; state: string; postalCode: string; idProofType: string; idProofNumber: string; preferredCallAt: string; status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'; callStatus: 'SCHEDULED'; submittedAt: string; consentedAt: string; reviewedBy?: string; reviewedAt?: string; businessName?: string; businessType?: string; gstin?: string; pan?: string; tradeLicense?: string; fssaiLicense?: string; establishmentYear?: string; branches?: number; qualification?: string; experience?: number; preferredRole?: string; availability?: string; emergencyContactName?: string; emergencyContactPhone?: string; }

export const onboarding = Router();
const clean = (value: unknown, max = 160) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const phonePattern = /^\+?[0-9]{10,15}$/; const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; const gstinPattern = /^[0-9A-Z]{15}$/; const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

onboarding.post('/applications', async (req, res) => {
  const body = req.body ?? {}; const type = body.type as PartnerApplicationType; const fullName = clean(body.fullName,80); const email = clean(body.email,120).toLowerCase(); const phone = clean(body.phone,20); const address = clean(body.address,240); const city = clean(body.city,80); const state = clean(body.state,80); const postalCode = clean(body.postalCode,6); const idProofType = clean(body.idProofType,60); const idProofNumber = clean(body.idProofNumber,80).toUpperCase(); const preferredCallAt = typeof body.preferredCallAt === 'string' ? new Date(body.preferredCallAt) : new Date('invalid'); const consent = body.consent === true;
  if (!['shopkeeper','employee'].includes(type)) return res.status(400).json({error:'Choose a valid onboarding type'});
  if (fullName.length<2 || email.length<5 || !emailPattern.test(email) || !phonePattern.test(phone)) return res.status(400).json({error:'Valid name, email and phone are required'});
  if (!address || !city || !state || !/^\d{6}$/.test(postalCode)) return res.status(400).json({error:'Complete address and a valid 6-digit PIN code are required'});
  if (!idProofType || idProofNumber.length<4) return res.status(400).json({error:'One government ID proof and its number are required'});
  if (Number.isNaN(preferredCallAt.getTime()) || preferredCallAt.getTime()<=Date.now()) return res.status(400).json({error:'Please choose a future callback date and time'});
  if (!consent) return res.status(400).json({error:'Consent is required before submitting an application'});
  const application: PartnerApplication = { referenceId:`FC-${type==='shopkeeper'?'ST':'EMP'}-${Date.now().toString(36).toUpperCase()}`, type, fullName, email, phone, address, city, state, postalCode, idProofType, idProofNumber, preferredCallAt:preferredCallAt.toISOString(), status:'PENDING_REVIEW', callStatus:'SCHEDULED', submittedAt:new Date().toISOString(), consentedAt:new Date().toISOString() };
  if (type==='shopkeeper') { application.businessName=clean(body.businessName,120); application.businessType=clean(body.businessType,80); application.gstin=clean(body.gstin,15).toUpperCase(); application.pan=clean(body.pan,10).toUpperCase(); application.tradeLicense=clean(body.tradeLicense,80); application.fssaiLicense=clean(body.fssaiLicense,80); application.establishmentYear=clean(body.establishmentYear,4); application.branches=Math.max(1,Math.min(999,Number.parseInt(String(body.branches||'1'),10)||1)); if(application.businessName.length<2 || !gstinPattern.test(application.gstin??'') || !panPattern.test(application.pan??'')) return res.status(400).json({error:'Business name, valid GSTIN and valid PAN are required'}); }
  else { application.qualification=clean(body.qualification,120); application.experience=Math.max(0,Math.min(60,Number.parseFloat(String(body.experience||'0'))||0)); application.preferredRole=clean(body.preferredRole,100); application.availability=clean(body.availability,40); application.emergencyContactName=clean(body.emergencyContactName,80); application.emergencyContactPhone=clean(body.emergencyContactPhone,20); if(application.qualification.length<2 || application.preferredRole.length<2) return res.status(400).json({error:'Qualification and preferred role are required'}); if(application.emergencyContactPhone && !phonePattern.test(application.emergencyContactPhone)) return res.status(400).json({error:'Emergency contact phone is invalid'}); }
  try { const db=mongoDb(); if(db) await db.collection<PartnerApplication>('onboardingApplications').insertOne(application); else console.log('FreshCart onboarding application received:',application.referenceId); return res.status(201).json({referenceId:application.referenceId,scheduledCallAt:application.preferredCallAt,status:application.status}); } catch(error){console.error('FreshCart onboarding application failed:',error);return res.status(503).json({error:'Unable to save your application right now. Please try again.'});}
});

const parseCsv = (csv: string) => {
  const lines = csv.replace(/\r/g, '').split('\n').filter(line => line.trim());
  if (!lines.length) throw new Error('CSV is empty');
  const parseLine = (line: string) => {
    const cells: string[] = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"' && line[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = !quoted;
      } else if (ch === ',' && !quoted) {
        cells.push(cell.trim());
        cell = '';
      } else {
        cell += ch;
      }
    }
    cells.push(cell.trim());
    return cells;
  };
  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, ''));
  const rows = lines.slice(1).map(parseLine).map(cells => Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ''])));
  return { headers, rows };
};

onboarding.post('/sales-imports', requireAuth, requireRole('shopkeeper', 'admin', 'super_admin'), async (req, res) => {
  let shopId = req.user?.shopId;
  // If admin/super_admin or shopkeeper missing shopId, fallback to query/body shopId or first active shop
  if (!shopId) {
    const requestedShopId = typeof req.body?.shopId === 'string' ? req.body.shopId.trim() : typeof req.query?.shopId === 'string' ? String(req.query.shopId).trim() : '';
    if (requestedShopId) {
      shopId = requestedShopId;
    } else {
      shopId = 'shop-1';
    }
  }

  const fileName = clean(req.body?.fileName, 180) || 'catalog_import.csv';
  const csv = typeof req.body?.csv === 'string' ? req.body.csv : '';
  if (!fileName.toLowerCase().endsWith('.csv')) {
    return res.status(400).json({ error: 'Please upload a CSV file (.csv extension)' });
  }
  if (!csv || csv.length > 5000000) {
    return res.status(400).json({ error: 'CSV file is required and must be under 5 MB' });
  }

  try {
    const parsed = parseCsv(csv);
    const validAliases = [
      'sku', 'skucode', 'itemcode', 'code',
      'barcode', 'upc', 'ean', 'gtin',
      'name', 'productname', 'itemname', 'title', 'item', 'product',
      'category', 'itemcategory', 'department',
      'unit', 'packunit', 'size', 'weight',
      'mrp', 'maximumretailprice', 'listprice',
      'costprice', 'purchaseprice', 'buyprice',
      'sellingprice', 'price', 'discountprice',
      'stock', 'quantity', 'currentstock', 'inventory', 'qty',
      'minstock', 'reorderpoint', 'threshold',
      'imageurl', 'image', 'photo', 'img'
    ];
    if (!parsed.headers.some(h => validAliases.includes(h))) {
      return res.status(400).json({ error: 'CSV headers were not recognized. Please include columns such as: name, category, unit, mrp, selling_price, stock, sku, barcode.' });
    }
    if (!parsed.rows.length || parsed.rows.length > 5000) {
      return res.status(400).json({ error: 'CSV must contain between 1 and 5000 product rows' });
    }

    const referenceId = `FC-CSV-${Date.now().toString(36).toUpperCase()}`;
    const salesImport: SalesImport = {
      referenceId,
      shopId,
      fileName,
      csv,
      rowCount: parsed.rows.length,
      status: 'PENDING_REVIEW',
      submittedBy: req.user.id,
      submittedAt: new Date().toISOString()
    };

    const db = mongoDb();
    if (db) {
      await db.collection<SalesImport>('salesImports').insertOne(salesImport);
    } else {
      salesImports.unshift(salesImport);
    }

    return res.status(201).json({ referenceId, rowCount: parsed.rows.length, status: salesImport.status, shopId });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid CSV format' });
  }
});

export async function approveSalesImport(referenceId: string, reviewerId: string) {
  const db = mongoDb();
  let imported: SalesImport | null | undefined = null;

  if (db) {
    imported = await db.collection<SalesImport>('salesImports').findOne({ referenceId, status: 'PENDING_REVIEW' });
  } else {
    imported = salesImports.find(s => s.referenceId === referenceId && s.status === 'PENDING_REVIEW');
  }

  if (!imported) throw new Error('Pending sales import not found or already processed');

  const parsed = parseCsv(imported.csv);
  const get = (row: Record<string, string>, keys: string[]) =>
    keys.map(k => row[k]).find(v => typeof v === 'string' && v.trim())?.trim() ?? '';

  let applied = 0;
  for (const row of parsed.rows) {
    const name = get(row, ['name', 'productname', 'itemname', 'title', 'item', 'product']);
    const sku = get(row, ['sku', 'skucode', 'itemcode', 'code']);
    if (!name && !sku) continue;

    const rawCost = get(row, ['costprice', 'purchaseprice', 'buyprice']);
    const costPrice = rawCost ? Math.max(0, Number.parseFloat(rawCost) || 0) : undefined;
    const mrp = Number.parseFloat(get(row, ['mrp', 'maximumretailprice', 'listprice'])) || 0;
    const sellingPrice = Number.parseFloat(get(row, ['sellingprice', 'price', 'discountprice'])) || mrp;
    const stock = Math.max(0, Number.parseInt(get(row, ['stock', 'quantity', 'currentstock', 'inventory', 'qty']), 10) || 0);
    const minStock = Math.max(0, Number.parseInt(get(row, ['minstock', 'reorderpoint', 'threshold']), 10) || 0);
    const barcode = get(row, ['barcode', 'upc', 'ean', 'gtin']) || undefined;
    const category = get(row, ['category', 'itemcategory', 'department']) || 'Other';
    const unit = get(row, ['unit', 'packunit', 'size', 'weight']) || 'unit';
    const imageUrl = get(row, ['imageurl', 'image', 'photo', 'img']) || undefined;

    const product: Product = {
      id: `p-${imported.shopId}-${(sku || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
      sku: sku || `FC-${Date.now()}-${applied}`,
      barcode,
      name: name || sku,
      category,
      unit,
      mrp,
      sellingPrice,
      costPrice,
      stock,
      minStock,
      shopId: imported.shopId,
      imageUrl,
      active: true
    };

    if (db) {
      const productsCollection = db.collection<Product>('products');
      await productsCollection.updateOne(
        { shopId: imported.shopId, $or: [{ sku: product.sku }, ...(product.barcode ? [{ barcode: product.barcode }] : [])] },
        { $set: product },
        { upsert: true }
      );
    } else {
      const existingIndex = memoryProducts.findIndex(p => p.shopId === imported?.shopId && (p.sku === product.sku || (product.barcode && p.barcode === product.barcode)));
      if (existingIndex >= 0) {
        memoryProducts[existingIndex] = { ...memoryProducts[existingIndex], ...product };
      } else {
        memoryProducts.push(product);
      }
    }
    applied += 1;
  }

  if (db) {
    await db.collection<SalesImport>('salesImports').updateOne(
      { referenceId, status: 'PENDING_REVIEW' },
      { $set: { status: 'APPROVED', reviewedBy: reviewerId, reviewedAt: new Date().toISOString() } }
    );
  } else {
    imported.status = 'APPROVED';
    imported.reviewedBy = reviewerId;
    imported.reviewedAt = new Date().toISOString();
  }

  return { referenceId, shopId: imported.shopId, appliedRows: applied, status: 'APPROVED' as const };
}

export async function rejectSalesImport(referenceId: string, reviewerId: string, reason: string) {
  const db = mongoDb();
  if (db) {
    const result = await db.collection<SalesImport>('salesImports').findOneAndUpdate(
      { referenceId, status: 'PENDING_REVIEW' },
      { $set: { status: 'REJECTED', reviewedBy: reviewerId, reviewedAt: new Date().toISOString(), rejectionReason: clean(reason, 300) || 'Rejected during admin review' } },
      { returnDocument: 'after' }
    );
    if (!result) throw new Error('Pending sales import not found');
    return result;
  }

  const imported = salesImports.find(s => s.referenceId === referenceId && s.status === 'PENDING_REVIEW');
  if (!imported) throw new Error('Pending sales import not found');
  imported.status = 'REJECTED';
  imported.reviewedBy = reviewerId;
  imported.reviewedAt = new Date().toISOString();
  imported.rejectionReason = clean(reason, 300) || 'Rejected during admin review';
  return imported;
}
