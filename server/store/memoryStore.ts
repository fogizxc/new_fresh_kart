import type { Order, Product, Shop, User, StaffSalaryPayment, StaffAdvance } from '../models/domain';
import type { Address, DeliverySlot, Offer, Payment, Attendance } from '../models/catalog';
import { hashPassword } from '../auth/password.ts';

const DEFAULT_HASH = hashPassword('Password123');

const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const dayAfter = new Date(Date.now() + 172800000).toISOString().slice(0, 10);
const addDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

export const shops: Shop[] = [
  {
    id: 'shop-1',
    name: 'GreenLeaf Express Market',
    address: 'Connaught Place, Central Delhi, 110001',
    active: true,
    phone: '9000000002',
    shopkeeperId: 'u-2',
    lat: 28.6304,
    lng: 77.2177,
    serviceRadiusKm: 6.0,
    openingTime: '06:00',
    closingTime: '23:30',
    prepTimeMinutes: 8,
    rating: 4.8,
    reviewCount: 342
  },
  {
    id: 'shop-2',
    name: 'Daily Basket Quick Mart',
    address: 'Lajpat Nagar IV, South Delhi, 110024',
    active: true,
    phone: '9000000010',
    lat: 28.5678,
    lng: 77.2433,
    serviceRadiusKm: 7.5,
    openingTime: '07:00',
    closingTime: '23:00',
    prepTimeMinutes: 10,
    rating: 4.6,
    reviewCount: 215
  },
  {
    id: 'shop-3',
    name: 'City Super Grocery & Provisions',
    address: 'Karol Bagh Market, West Delhi, 110005',
    active: true,
    phone: '9000000015',
    lat: 28.6517,
    lng: 77.1906,
    serviceRadiusKm: 5.5,
    openingTime: '06:30',
    closingTime: '23:45',
    prepTimeMinutes: 9,
    rating: 4.7,
    reviewCount: 189
  },
  {
    id: 'shop-4',
    name: 'Modern Organic Kirana Store',
    address: 'Hauz Khas Enclave, South Delhi, 110016',
    active: true,
    phone: '9000000020',
    lat: 28.5494,
    lng: 77.2001,
    serviceRadiusKm: 6.0,
    openingTime: '07:00',
    closingTime: '22:30',
    prepTimeMinutes: 7,
    rating: 4.9,
    reviewCount: 420
  },
];

export const users: User[] = [
  { id: 'u-1', name: 'Riya Mehta', email: 'riya@example.com', phone: '9000000001', role: 'customer', active: true, passwordHash: DEFAULT_HASH },
  { id: 'u-2', name: 'Arjun Sharma', email: 'arjun@greenleaf.local', phone: '9000000002', role: 'shopkeeper', shopId: 'shop-1', active: true, passwordHash: DEFAULT_HASH, designation: 'Owner & Store Lead' },
  {
    id: 'u-3',
    name: 'Kabir Singh',
    email: 'kabir@greenleaf.local',
    phone: '9000000003',
    role: 'employee',
    shopId: 'shop-1',
    active: true,
    passwordHash: DEFAULT_HASH,
    designation: 'Packing & Dispatch Lead',
    shift: 'Morning (07:00 - 15:30)',
    joiningDate: '2025-06-15',
    emergencyContact: '9811002233',
    salaryStructure: {
      monthlyBase: 16500,
      allowances: 2500,
      deductions: 500,
      paymentMethod: 'UPI',
      upiId: 'kabir.singh@oksbi'
    }
  },
  {
    id: 'u-6',
    name: 'Sunita Sharma',
    email: 'sunita@greenleaf.local',
    phone: '9000000006',
    role: 'employee',
    shopId: 'shop-1',
    active: true,
    passwordHash: DEFAULT_HASH,
    designation: 'Senior Cashier & Billing Lead',
    shift: 'General (09:00 - 18:00)',
    joiningDate: '2025-08-01',
    emergencyContact: '9811554433',
    salaryStructure: {
      monthlyBase: 18000,
      allowances: 1200,
      deductions: 600,
      paymentMethod: 'BANK_TRANSFER',
      bankAccountNo: '50100458921132',
      bankIfsc: 'HDFC0000240'
    }
  },
  {
    id: 'u-7',
    name: 'Rajesh Verma',
    email: 'rajesh@greenleaf.local',
    phone: '9000000007',
    role: 'employee',
    shopId: 'shop-1',
    active: true,
    passwordHash: DEFAULT_HASH,
    designation: 'Inventory Stocker & FEFO Handler',
    shift: 'Evening (14:00 - 22:30)',
    joiningDate: '2025-11-10',
    emergencyContact: '9899112244',
    salaryStructure: {
      monthlyBase: 14500,
      allowances: 1500,
      deductions: 400,
      paymentMethod: 'CASH'
    }
  },
  {
    id: 'u-8',
    name: 'Amit Kumar',
    email: 'amit@greenleaf.local',
    phone: '9000000008',
    role: 'employee',
    shopId: 'shop-1',
    active: true,
    passwordHash: DEFAULT_HASH,
    designation: 'Express Delivery Rider',
    shift: 'Flexible (10:00 - 19:30)',
    joiningDate: '2026-01-05',
    emergencyContact: '9711883322',
    salaryStructure: {
      monthlyBase: 15000,
      allowances: 3500,
      deductions: 500,
      paymentMethod: 'UPI',
      upiId: 'amit.kumar98@paytm'
    }
  },
  { id: 'u-4', name: 'FreshCart Admin', email: 'admin@freshcart.local', phone: '9000000004', role: 'admin', active: true, passwordHash: DEFAULT_HASH },
  { id: 'u-5', name: 'Super Admin', email: 'superadmin@freshcart.local', phone: '9000000005', role: 'super_admin', active: true, passwordHash: DEFAULT_HASH },
];

export const staffSalaries: StaffSalaryPayment[] = [
  {
    id: 'sal-101',
    staffId: 'u-3',
    shopId: 'shop-1',
    month: '2026-08',
    baseAmount: 16500,
    bonusAmount: 1000,
    allowances: 2500,
    advanceDeduction: 0,
    otherDeductions: 500,
    netPaid: 19500,
    paymentMode: 'UPI',
    paymentDate: '2026-09-02',
    referenceNumber: 'UPI-982341901',
    status: 'PAID',
    notes: 'August 2026 Salary with performance incentive for zero packing errors',
    recordedBy: 'u-2',
    createdAt: '2026-09-02T10:30:00.000Z'
  },
  {
    id: 'sal-102',
    staffId: 'u-6',
    shopId: 'shop-1',
    month: '2026-08',
    baseAmount: 18000,
    bonusAmount: 500,
    allowances: 1200,
    advanceDeduction: 1000,
    otherDeductions: 600,
    netPaid: 18100,
    paymentMode: 'BANK_TRANSFER',
    paymentDate: '2026-09-01',
    referenceNumber: 'NEFT-HDFC-991283',
    status: 'PAID',
    notes: 'August 2026 Salary transferred to bank account',
    recordedBy: 'u-2',
    createdAt: '2026-09-01T11:00:00.000Z'
  },
  {
    id: 'sal-103',
    staffId: 'u-7',
    shopId: 'shop-1',
    month: '2026-08',
    baseAmount: 14500,
    bonusAmount: 0,
    allowances: 1500,
    advanceDeduction: 0,
    otherDeductions: 400,
    netPaid: 15600,
    paymentMode: 'CASH',
    paymentDate: '2026-09-02',
    referenceNumber: 'CASH-VOUCHER-08',
    status: 'PAID',
    notes: 'Handed over cash against signed voucher',
    recordedBy: 'u-2',
    createdAt: '2026-09-02T14:15:00.000Z'
  }
];

export const staffAdvances: StaffAdvance[] = [
  {
    id: 'adv-201',
    staffId: 'u-8',
    shopId: 'shop-1',
    amount: 2000,
    reason: 'Bike maintenance & fuel emergency',
    date: '2026-09-05',
    settled: false,
    settledAmount: 0,
    recordedBy: 'u-2',
    createdAt: '2026-09-05T09:00:00.000Z'
  }
];

export const products: Product[] = [
  // Shop 1 - GreenLeaf Express Market (Connaught Place)
  { id: 'p-1', sku: 'FR-MNG-001', name: 'Alphonso Mangoes (Ratnagiri)', category: 'Fruits', unit: '1 kg', mrp: 229, sellingPrice: 189, stock: 42, minStock: 10, shopId: 'shop-1', active: true, imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&q=80', expiryDate: addDays(10) },
  { id: 'p-2', sku: 'VG-SPN-001', name: 'Baby Spinach Leaves (Hydropnic)', category: 'Vegetables', unit: '250 g', mrp: 49, sellingPrice: 42, stock: 18, minStock: 8, shopId: 'shop-1', active: true, imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&q=80', expiryDate: addDays(2) },
  { id: 'p-3', sku: 'DR-MIL-001', name: 'Farm Fresh Full Cream Milk', category: 'Dairy & Eggs', unit: '1 L', mrp: 66, sellingPrice: 64, stock: 65, minStock: 15, shopId: 'shop-1', active: true, imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80', expiryDate: addDays(4) },
  { id: 'p-4', sku: 'PN-BRD-001', name: 'Organic Multigrain Brown Bread', category: 'Pantry', unit: '400 g', mrp: 65, sellingPrice: 55, stock: 24, minStock: 10, shopId: 'shop-1', active: true, imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80', expiryDate: addDays(5) },
  { id: 'p-5', sku: 'VG-MNT-001', name: 'Fresh Mint Leaves (Pudina)', category: 'Vegetables', unit: '100 g', mrp: 20, sellingPrice: 15, stock: 50, minStock: 10, shopId: 'shop-1', active: true, imageUrl: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=300&q=80', expiryDate: addDays(3) },
  { id: 'p-6', sku: 'DR-PAN-001', name: 'Malai Paneer Fresh Block', category: 'Dairy & Eggs', unit: '200 g', mrp: 110, sellingPrice: 95, stock: 30, minStock: 5, shopId: 'shop-1', active: true, imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&q=80', expiryDate: addDays(3) },
  { id: 'p-7', sku: 'SN-CHP-001', name: 'Classic Salted Potato Chips', category: 'Snacks', unit: '115 g', mrp: 50, sellingPrice: 45, stock: 80, minStock: 20, shopId: 'shop-1', active: true, imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80', expiryDate: addDays(120) },
  { id: 'p-8', sku: 'BV-COC-001', name: 'Natural Tender Coconut Water', category: 'Beverages', unit: '200 ml', mrp: 60, sellingPrice: 49, stock: 45, minStock: 10, shopId: 'shop-1', active: true, imageUrl: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=300&q=80', expiryDate: addDays(60) },

  // Shop 2 - Daily Basket Quick Mart (Lajpat Nagar)
  { id: 'p-9', sku: 'FR-APL-002', name: 'Royal Gala Red Apples (Crisp)', category: 'Fruits', unit: '4 pcs (500g)', mrp: 180, sellingPrice: 149, stock: 35, minStock: 10, shopId: 'shop-2', active: true, imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&q=80', expiryDate: addDays(15) },
  { id: 'p-10', sku: 'VG-TOM-002', name: 'Hybrid Red Tomatoes', category: 'Vegetables', unit: '1 kg', mrp: 50, sellingPrice: 38, stock: 75, minStock: 15, shopId: 'shop-2', active: true, imageUrl: 'https://images.unsplash.com/photo-1546470427-227c7369a924?w=300&q=80', expiryDate: addDays(7) },
  { id: 'p-11', sku: 'DR-EGG-002', name: 'Farm White Eggs (Protein Rich)', category: 'Dairy & Eggs', unit: '6 pcs tray', mrp: 55, sellingPrice: 48, stock: 90, minStock: 20, shopId: 'shop-2', active: true, imageUrl: 'https://images.unsplash.com/photo-1582722872446-24c554e3630a?w=300&q=80', expiryDate: addDays(14) },
  { id: 'p-12', sku: 'DR-MIL-002', name: 'Toned Cow Milk Pure', category: 'Dairy & Eggs', unit: '500 ml', mrp: 35, sellingPrice: 32, stock: 40, minStock: 10, shopId: 'shop-2', active: true, imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80', expiryDate: addDays(4) },

  // Shop 3 - City Super Grocery (Karol Bagh)
  { id: 'p-13', sku: 'VG-POT-003', name: 'New Crop Pahadi Potatoes', category: 'Vegetables', unit: '1 kg', mrp: 40, sellingPrice: 29, stock: 120, minStock: 20, shopId: 'shop-3', active: true, imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&q=80', expiryDate: addDays(30) },
  { id: 'p-14', sku: 'SN-BIS-003', name: 'Roasted Almond Butter Cookies', category: 'Snacks', unit: '150 g', mrp: 99, sellingPrice: 79, stock: 40, minStock: 10, shopId: 'shop-3', active: true, imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&q=80', expiryDate: addDays(90) },
  { id: 'p-15', sku: 'BV-JUC-003', name: 'Cold Pressed Valencia Orange Juice', category: 'Beverages', unit: '250 ml', mrp: 85, sellingPrice: 69, stock: 25, minStock: 5, shopId: 'shop-3', active: true, imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=300&q=80', expiryDate: addDays(6) },

  // Shop 4 - Modern Organic Kirana Store (Hauz Khas)
  { id: 'p-16', sku: 'FR-BAN-004', name: 'Robusta Golden Bananas', category: 'Fruits', unit: '6 pcs (Robusta)', mrp: 55, sellingPrice: 42, stock: 60, minStock: 15, shopId: 'shop-4', active: true, imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&q=80', expiryDate: addDays(4) },
  { id: 'p-17', sku: 'VG-CUC-004', name: 'Crisp Green English Cucumbers', category: 'Vegetables', unit: '500 g', mrp: 35, sellingPrice: 28, stock: 45, minStock: 10, shopId: 'shop-4', active: true, imageUrl: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=300&q=80', expiryDate: addDays(5) },
  { id: 'p-18', sku: 'DR-YGT-004', name: 'Greek Strawberry Protein Yogurt', category: 'Dairy & Eggs', unit: '100 g', mrp: 60, sellingPrice: 50, stock: 35, minStock: 8, shopId: 'shop-4', active: true, imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&q=80', expiryDate: addDays(8) },
];

export const orders: Order[] = [
  {
    id: 'FC-ORD-98214',
    customerId: 'u-1',
    shopId: 'shop-1',
    items: [
      { productId: 'p-1', name: 'Alphonso Mangoes (Ratnagiri)', quantity: 2, unitPrice: 189 },
      { productId: 'p-3', name: 'Farm Fresh Full Cream Milk', quantity: 3, unitPrice: 64 },
      { productId: 'p-4', name: 'Organic Multigrain Brown Bread', quantity: 1, unitPrice: 55 }
    ],
    subtotal: 625,
    discount: 50,
    couponCode: 'FRESH10',
    deliveryFee: 0,
    tip: 20,
    handlingFee: 5,
    deliveryOtp: '4829',
    total: 600,
    paymentMethod: 'UPI',
    fulfilment: 'DELIVERY',
    status: 'PLACED',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    addressId: 'addr-1',
    deliverySlotId: 'slot-1'
  },
  {
    id: 'FC-ORD-98205',
    customerId: 'u-1',
    shopId: 'shop-1',
    items: [
      { productId: 'p-6', name: 'Malai Paneer Fresh Block', quantity: 2, unitPrice: 95 },
      { productId: 'p-2', name: 'Baby Spinach Leaves (Hydropnic)', quantity: 2, unitPrice: 42 },
      { productId: 'p-8', name: 'Natural Tender Coconut Water', quantity: 2, unitPrice: 49 }
    ],
    subtotal: 372,
    discount: 0,
    deliveryFee: 39,
    tip: 0,
    handlingFee: 5,
    deliveryOtp: '7193',
    total: 416,
    paymentMethod: 'COD',
    fulfilment: 'DELIVERY',
    status: 'ACCEPTED',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    addressId: 'addr-1',
    deliverySlotId: 'slot-1'
  }
];
export const addresses: Address[] = [
  { id: 'addr-1', userId: 'u-1', label: 'HOME', line1: 'Flat 402, Block B, Silver Oak Apartments', line2: 'Barakhamba Road, Near Central Park', city: 'New Delhi', state: 'Delhi', postalCode: '110001', landmark: 'Opposite Metro Gate 3', isDefault: true },
  { id: 'addr-2', userId: 'u-1', label: 'WORK', line1: 'Tower 4, Floor 8, Connaught Trade Centre', line2: 'Inner Circle, CP', city: 'New Delhi', state: 'Delhi', postalCode: '110001', landmark: 'Above Starbucks', isDefault: false }
];

export const deliverySlots: DeliverySlot[] = [
  { id: 'slot-1', date: today, label: 'Express', startTime: '14:00', endTime: '15:00', capacity: 12, booked: 0, active: true },
  { id: 'slot-2', date: today, label: 'Evening', startTime: '18:00', endTime: '20:00', capacity: 20, booked: 0, active: true },
  { id: 'slot-3', date: tomorrow, label: 'Morning', startTime: '09:00', endTime: '11:00', capacity: 20, booked: 0, active: true },
  { id: 'slot-4', date: dayAfter, label: 'Afternoon', startTime: '13:00', endTime: '15:00', capacity: 20, booked: 0, active: true },
];

export const offers: Offer[] = [
  { id: 'offer-1', code: 'FRESH10', title: '10% Off on Fresh Groceries', description: 'Get 10% off on orders above ₹299', discountType: 'PERCENT', discountValue: 10, minOrderValue: 299, maxDiscount: 100, active: true, startsAt: '2025-01-01T00:00:00.000Z', endsAt: '2030-12-31T23:59:59.999Z' },
  { id: 'offer-2', code: 'WELCOME100', title: '₹100 Off on First Order', description: 'Flat ₹100 discount on orders above ₹499', discountType: 'FLAT', discountValue: 100, minOrderValue: 499, maxDiscount: 100, active: true, startsAt: '2025-01-01T00:00:00.000Z', endsAt: '2030-12-31T23:59:59.999Z' },
  { id: 'offer-3', code: 'DAIRY5', title: '5% Extra Off on Dairy & Eggs', description: 'Save 5% on everyday essentials', discountType: 'PERCENT', discountValue: 5, minOrderValue: 199, maxDiscount: 50, active: true, startsAt: '2025-01-01T00:00:00.000Z', endsAt: '2030-12-31T23:59:59.999Z' },
];

export const payments: Payment[] = [];
export const salesImports: import('../models/domain.ts').SalesImport[] = [];

export const attendances: Attendance[] = [
  { id: 'att-u3-1', userId: 'u-3', shopId: 'shop-1', date: today, checkIn: `${today}T07:12:00.000Z`, status: 'PRESENT' },
  { id: 'att-u6-1', userId: 'u-6', shopId: 'shop-1', date: today, checkIn: `${today}T08:55:00.000Z`, status: 'PRESENT' },
  { id: 'att-u7-1', userId: 'u-7', shopId: 'shop-1', date: today, checkIn: `${today}T13:45:00.000Z`, status: 'PRESENT' },
  { id: 'att-u8-1', userId: 'u-8', shopId: 'shop-1', date: today, checkIn: `${today}T09:50:00.000Z`, status: 'PRESENT' },
  // Past days in current month
  { id: 'att-u3-2', userId: 'u-3', shopId: 'shop-1', date: '2026-09-13', checkIn: '2026-09-13T07:15:00.000Z', checkOut: '2026-09-13T15:30:00.000Z', status: 'PRESENT' },
  { id: 'att-u6-2', userId: 'u-6', shopId: 'shop-1', date: '2026-09-13', checkIn: '2026-09-13T09:00:00.000Z', checkOut: '2026-09-13T18:00:00.000Z', status: 'PRESENT' },
  { id: 'att-u7-2', userId: 'u-7', shopId: 'shop-1', date: '2026-09-13', checkIn: '2026-09-13T14:00:00.000Z', checkOut: '2026-09-13T22:30:00.000Z', status: 'PRESENT' },
  { id: 'att-u8-2', userId: 'u-8', shopId: 'shop-1', date: '2026-09-13', checkIn: '2026-09-13T10:00:00.000Z', checkOut: '2026-09-13T19:00:00.000Z', status: 'PRESENT' },
  { id: 'att-u8-3', userId: 'u-8', shopId: 'shop-1', date: '2026-09-12', checkIn: '2026-09-12T10:00:00.000Z', checkOut: '2026-09-12T14:00:00.000Z', status: 'HALF_DAY', notes: 'Took half day for medical checkup' },
  { id: 'att-u7-3', userId: 'u-7', shopId: 'shop-1', date: '2026-09-11', status: 'LEAVE', notes: 'Approved leave for family function' },
];
