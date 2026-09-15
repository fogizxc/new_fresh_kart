export type Role = 'customer' | 'shopkeeper' | 'employee' | 'store_manager' | 'admin' | 'super_admin';
export type OrderStatus = 'PLACED' | 'ACCEPTED' | 'PICKING' | 'PACKING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'COLLECTED';
export type OrderFulfilment = 'DELIVERY' | 'SELF_PICKUP';
export type OrderPaymentMethod = 'UPI' | 'CARD' | 'COD' | 'PAY_AT_SHOP';
export interface StaffSalaryStructure {
  monthlyBase: number;
  dailyRate?: number;
  allowances: number;
  deductions: number;
  paymentMethod?: 'UPI' | 'CASH' | 'BANK_TRANSFER';
  upiId?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  paidLeavesAllowance?: number; // e.g. 2 days/month
  overtimeHourlyRate?: number; // e.g. ₹100/hr
  commissionPerDelivery?: number; // e.g. ₹20 per fulfilled delivery
}

export interface StaffSalaryPayment {
  id: string;
  staffId: string;
  shopId: string;
  month: string; // "YYYY-MM"
  baseAmount: number;
  bonusAmount: number;
  allowances: number;
  advanceDeduction: number;
  otherDeductions: number;
  workingDays?: number;
  presentDays?: number;
  halfDays?: number;
  overtimeHours?: number;
  overtimeAmount?: number;
  deliveryCount?: number;
  commissionAmount?: number;
  tipAmount?: number;
  netPaid: number;
  paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER';
  paymentDate: string;
  referenceNumber?: string;
  status: 'PAID' | 'PENDING' | 'PARTIAL';
  notes?: string;
  recordedBy?: string;
  createdAt: string;
}

export interface StaffAdvance {
  id: string;
  staffId: string;
  shopId: string;
  amount: number;
  reason: string;
  date: string;
  settled: boolean;
  settledAmount: number;
  recordedBy?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  username?: string;
  role: Role;
  shopId?: string;
  active: boolean;
  passwordHash?: string;
  designation?: string;
  shift?: string;
  joiningDate?: string;
  emergencyContact?: string;
  salaryStructure?: StaffSalaryStructure;
  kioskPin?: string; // 4-digit PIN for kiosk punch-in
  allowedModules?: Array<'pos' | 'orders' | 'inventory' | 'delivery' | 'all'>;
}
export interface Product { id:string; sku:string; barcode?:string; name:string; category:string; unit:string; mrp:number; sellingPrice:number; costPrice?:number; stock:number; minStock:number; shopId?:string; imageUrl?:string; active:boolean; expiryDate?:string; }
export interface OrderItem { productId:string; name:string; quantity:number; unitPrice:number; }
export interface Order { id:string; customerId:string; shopId:string; items:OrderItem[]; subtotal:number; deliveryFee:number; total:number; paymentMethod:OrderPaymentMethod; fulfilment:OrderFulfilment; status:OrderStatus; createdAt:string; addressId?:string; deliverySlotId?:string; pickupCode?:string; pickupConfirmedAt?:string; idempotencyKey?:string; couponCode?:string; discount?:number; deliveryOtp?:string; tip?:number; handlingFee?:number; }
export interface Shop {
  id: string;
  name: string;
  address: string;
  active: boolean;
  shopkeeperId?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  serviceRadiusKm?: number;
  openingTime?: string; // e.g. "06:00"
  closingTime?: string; // e.g. "23:00"
  prepTimeMinutes?: number; // e.g. 10
  rating?: number;
  reviewCount?: number;
}

export interface MasterProduct {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  mrp: number;
  imageUrl?: string;
  description?: string;
  active: boolean;
}

export interface ShopProductListing {
  id: string;
  masterProductId: string;
  shopId: string;
  sellingPrice: number;
  costPrice?: number;
  stock: number;
  minStock: number;
  active: boolean;
  updatedAt: string;
}
export interface SalesImport { referenceId:string; shopId:string; fileName:string; csv:string; rowCount:number; status:'PENDING_REVIEW'|'APPROVED'|'REJECTED'; submittedBy:string; submittedAt:string; reviewedBy?:string; reviewedAt?:string; rejectionReason?:string; }
