import type { Order, Product, Shop, User } from '../models/domain';
import type { Address, DeliverySlot, Offer, Payment } from '../models/catalog';
import { hashPassword } from '../auth/password.ts';

const DEFAULT_HASH = hashPassword('Password123');

const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const dayAfter = new Date(Date.now() + 172800000).toISOString().slice(0, 10);

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
  { id: 'u-2', name: 'Arjun Sharma', email: 'arjun@greenleaf.local', phone: '9000000002', role: 'shopkeeper', shopId: 'shop-1', active: true, passwordHash: DEFAULT_HASH },
  { id: 'u-3', name: 'Kabir Singh', email: 'kabir@greenleaf.local', phone: '9000000003', role: 'employee', shopId: 'shop-1', active: true, passwordHash: DEFAULT_HASH },
  { id: 'u-4', name: 'FreshCart Admin', email: 'admin@freshcart.local', phone: '9000000004', role: 'admin', active: true, passwordHash: DEFAULT_HASH },
  { id: 'u-5', name: 'Super Admin', email: 'superadmin@freshcart.local', phone: '9000000005', role: 'super_admin', active: true, passwordHash: DEFAULT_HASH },
];

export const products: Product[] = [
  // Shop 1 - GreenLeaf Express Market (Connaught Place)
  { id: 'p-1', sku: 'FR-MNG-001', name: 'Alphonso Mangoes (Ratnagiri)', category: 'Fruits', unit: '1 kg', mrp: 229, sellingPrice: 189, stock: 42, minStock: 10, shopId: 'shop-1', active: true, imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&q=80' },
  { id: 'p-2', sku: 'VG-SPN-001', name: 'Baby Spinach Leaves (Hydropnic)', category: 'Vegetables', unit: '250 g', mrp: 49, sellingPrice: 42, stock: 18, minStock: 8, shopId: 'shop-1', active: true, imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&q=80' },
  { id: 'p-3', sku: 'DR-MIL-001', name: 'Farm Fresh Full Cream Milk', category: 'Dairy & Eggs', unit: '1 L', mrp: 66, sellingPrice: 64, stock: 65, minStock: 15, shopId: 'shop-1', active: true, imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80' },
  { id: 'p-4', sku: 'PN-BRD-001', name: 'Organic Multigrain Brown Bread', category: 'Pantry', unit: '400 g', mrp: 65, sellingPrice: 55, stock: 24, minStock: 10, shopId: 'shop-1', active: true, imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80' },
  { id: 'p-5', sku: 'VG-MNT-001', name: 'Fresh Mint Leaves (Pudina)', category: 'Vegetables', unit: '100 g', mrp: 20, sellingPrice: 15, stock: 50, minStock: 10, shopId: 'shop-1', active: true, imageUrl: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=300&q=80' },
  { id: 'p-6', sku: 'DR-PAN-001', name: 'Malai Paneer Fresh Block', category: 'Dairy & Eggs', unit: '200 g', mrp: 110, sellingPrice: 95, stock: 30, minStock: 5, shopId: 'shop-1', active: true, imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&q=80' },
  { id: 'p-7', sku: 'SN-CHP-001', name: 'Classic Salted Potato Chips', category: 'Snacks', unit: '115 g', mrp: 50, sellingPrice: 45, stock: 80, minStock: 20, shopId: 'shop-1', active: true, imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80' },
  { id: 'p-8', sku: 'BV-COC-001', name: 'Natural Tender Coconut Water', category: 'Beverages', unit: '200 ml', mrp: 60, sellingPrice: 49, stock: 45, minStock: 10, shopId: 'shop-1', active: true, imageUrl: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=300&q=80' },

  // Shop 2 - Daily Basket Quick Mart (Lajpat Nagar)
  { id: 'p-9', sku: 'FR-APL-002', name: 'Royal Gala Red Apples (Crisp)', category: 'Fruits', unit: '4 pcs (500g)', mrp: 180, sellingPrice: 149, stock: 35, minStock: 10, shopId: 'shop-2', active: true, imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&q=80' },
  { id: 'p-10', sku: 'VG-TOM-002', name: 'Hybrid Red Tomatoes', category: 'Vegetables', unit: '1 kg', mrp: 50, sellingPrice: 38, stock: 75, minStock: 15, shopId: 'shop-2', active: true, imageUrl: 'https://images.unsplash.com/photo-1546470427-227c7369a924?w=300&q=80' },
  { id: 'p-11', sku: 'DR-EGG-002', name: 'Farm White Eggs (Protein Rich)', category: 'Dairy & Eggs', unit: '6 pcs tray', mrp: 55, sellingPrice: 48, stock: 90, minStock: 20, shopId: 'shop-2', active: true, imageUrl: 'https://images.unsplash.com/photo-1582722872446-24c554e3630a?w=300&q=80' },
  { id: 'p-12', sku: 'DR-MIL-002', name: 'Toned Cow Milk Pure', category: 'Dairy & Eggs', unit: '500 ml', mrp: 35, sellingPrice: 32, stock: 40, minStock: 10, shopId: 'shop-2', active: true, imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80' },

  // Shop 3 - City Super Grocery (Karol Bagh)
  { id: 'p-13', sku: 'VG-POT-003', name: 'New Crop Pahadi Potatoes', category: 'Vegetables', unit: '1 kg', mrp: 40, sellingPrice: 29, stock: 120, minStock: 20, shopId: 'shop-3', active: true, imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&q=80' },
  { id: 'p-14', sku: 'SN-BIS-003', name: 'Roasted Almond Butter Cookies', category: 'Snacks', unit: '150 g', mrp: 99, sellingPrice: 79, stock: 40, minStock: 10, shopId: 'shop-3', active: true, imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&q=80' },
  { id: 'p-15', sku: 'BV-JUC-003', name: 'Cold Pressed Valencia Orange Juice', category: 'Beverages', unit: '250 ml', mrp: 85, sellingPrice: 69, stock: 25, minStock: 5, shopId: 'shop-3', active: true, imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=300&q=80' },

  // Shop 4 - Modern Organic Kirana Store (Hauz Khas)
  { id: 'p-16', sku: 'FR-BAN-004', name: 'Robusta Golden Bananas', category: 'Fruits', unit: '6 pcs (Robusta)', mrp: 55, sellingPrice: 42, stock: 60, minStock: 15, shopId: 'shop-4', active: true, imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&q=80' },
  { id: 'p-17', sku: 'VG-CUC-004', name: 'Crisp Green English Cucumbers', category: 'Vegetables', unit: '500 g', mrp: 35, sellingPrice: 28, stock: 45, minStock: 10, shopId: 'shop-4', active: true, imageUrl: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=300&q=80' },
  { id: 'p-18', sku: 'DR-YGT-004', name: 'Greek Strawberry Protein Yogurt', category: 'Dairy & Eggs', unit: '100 g', mrp: 60, sellingPrice: 50, stock: 35, minStock: 8, shopId: 'shop-4', active: true, imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&q=80' },
];

export const orders: Order[] = [];
export const addresses: Address[] = [
  { id: 'addr-1', userId: 'u-1', label: 'HOME', line1: '12 Green Avenue', line2: 'Near Central Park', city: 'New Delhi', state: 'Delhi', postalCode: '110001', landmark: 'Central Park', isDefault: true },
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
