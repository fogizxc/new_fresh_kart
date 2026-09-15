import { MongoClient, Db } from 'mongodb';
import { ensureIndexes } from './schema.ts';
import { hashPassword, isStrongPassword } from '../auth/password.ts';
import type { Role, User } from '../models/domain.ts';

let client: MongoClient | null = null;
let db: Db | null = null;
let connectPromise: Promise<Db | null> | null = null;

const DEFAULT_PORTAL_ACCOUNTS: Array<{
  id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
}> = [
  { id: 'default-customer', name: 'FreshCart Customer', email: 'customer@freshcart.in', role: 'customer', passwordHash: 'pbkdf2$210000$0c5f36ad4578e7758a8b2c8b517136f4$023682904e07a8ae795a286681041be4b1636dc24189e14a2ab7ce3db7c1250d' },
  { id: 'default-shopkeeper', name: 'FreshCart Shopkeeper', email: 'shopkeeper@freshcart.in', role: 'shopkeeper', passwordHash: 'pbkdf2$210000$1b820fd2a94a681c328680c763ff4465$2d413ddc418e82003d9b121edb93aa5c39aee3723dce3557d5edb18e34fe26ec' },
  { id: 'default-employee', name: 'FreshCart Employee', email: 'employee@freshcart.in', role: 'employee', passwordHash: 'pbkdf2$210000$f362a1e113bc8bbb70068f31259e93df$433daed81e460c70fd05de5972bb3deeb000105daa919a521b5c8bd8dfcd7f3e' },
  { id: 'default-store-manager', name: 'FreshCart Store Manager', email: 'manager@freshcart.in', role: 'store_manager', passwordHash: 'pbkdf2$210000$4e1169ab9c6686b7efc8b248c85cfc02$105a9e02a0862d924fbcd63a704058006d812ee3c0422440ed8e33cf6c11f84b' },
  { id: 'default-admin', name: 'FreshCart Admin', email: 'admin@freshcart.in', role: 'admin', passwordHash: 'pbkdf2$210000$d30364351abc2d59a459f775f8a7853c$89ea8614e2f027cb786b06d0427d9d529331bfd37f4a5df536ef375d854f26c6' },
  { id: 'default-super-admin', name: 'FreshCart Super Admin', email: 'superadmin@freshcart.in', role: 'super_admin', passwordHash: 'pbkdf2$210000$1d7d15811643818f2fc55938892e6e20$eba51aad3775392593bd3c9fa96159882fd3cf1b5b5e6f2e81b2a5d619c432d1' },
];

async function ensureDefaultPortalAccounts(database: Db) {
  const users = database.collection<User>('users');

  for (const account of DEFAULT_PORTAL_ACCOUNTS) {
    const existing = await users.findOne({
      $or: [
        { id: account.id },
        { email: account.email },
      ],
    });

    if (existing) continue;

    await users.insertOne({
      id: account.id,
      name: account.name,
      email: account.email,
      phone: `900000${String(DEFAULT_PORTAL_ACCOUNTS.indexOf(account) + 1).padStart(4, '0')}`,
      role: account.role,
      active: true,
      passwordHash: account.passwordHash,
    });

    console.log(`FreshCart default ${account.role} account created: ${account.email}`);
  }
}

async function ensureAdminAccount(database: Db) {
  const identifier = (process.env.SUPER_ADMIN_LOGIN_ID || process.env.ADMIN_LOGIN_ID || '').trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_LOGIN_PASSWORD || process.env.ADMIN_LOGIN_PASSWORD || '';
  if (!identifier || !password) return;
  if (!isStrongPassword(password)) throw new Error('SUPER_ADMIN_LOGIN_PASSWORD must be 8-128 characters and contain letters and numbers');

  const existing = await database.collection<User>('users').findOne({ $or: [{ email: identifier }, { phone: identifier }, { username: identifier }] });
  if (existing) {
    if (!['admin', 'super_admin'].includes(existing.role)) throw new Error('SUPER_ADMIN_LOGIN_ID is already used by a non-admin account');
    await database.collection<User>('users').updateOne({ id: existing.id }, { $set: { active: true, role: 'super_admin', passwordHash: hashPassword(password) } });
    return;
  }

  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  const user: User = {
    id: 'super-admin-owner',
    name: 'FreshCart Super Admin',
    email: looksLikeEmail ? identifier : 'superadmin@freshcart.in',
    phone: looksLikeEmail ? (process.env.SUPER_ADMIN_LOGIN_PHONE || process.env.ADMIN_LOGIN_PHONE || '9999999999') : identifier,
    username: looksLikeEmail ? undefined : identifier,
    role: 'super_admin',
    active: true,
    passwordHash: hashPassword(password),
  };
  await database.collection<User>('users').updateOne({ id: user.id }, { $set: user }, { upsert: true });
  console.log(`FreshCart super admin account ready: ${user.email}`);
}

export async function connectMongo() {
  if (db) return db;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) return null;
    const nextClient = new MongoClient(uri, { maxPoolSize: 20, serverSelectionTimeoutMS: 5000 });
    try {
      await nextClient.connect();
      const nextDb = nextClient.db(process.env.MONGODB_DB || 'freshcart');
      await ensureIndexes(nextClient);

      try {
        await ensureDefaultPortalAccounts(nextDb);
      } catch (error) {
        console.error('FreshCart default portal account seeding skipped:', error);
      }

      try {
        await ensureAdminAccount(nextDb);
      } catch (error) {
        console.error('FreshCart super-admin bootstrap skipped:', error);
      }

      try {
        const shopCount = await nextDb.collection('shops').countDocuments();
        if (shopCount === 0) {
          const { shops: seedShops, products: seedProducts, deliverySlots: seedSlots, offers: seedOffers, addresses: seedAddresses } = await import('../store/memoryStore.ts');
          if (seedShops.length) await nextDb.collection('shops').insertMany(seedShops);
          if (seedProducts.length) await nextDb.collection('products').insertMany(seedProducts);
          if (seedSlots.length) await nextDb.collection('deliverySlots').insertMany(seedSlots);
          if (seedOffers.length) await nextDb.collection('offers').insertMany(seedOffers);
          if (seedAddresses.length) await nextDb.collection('addresses').insertMany(seedAddresses);
          console.log('FreshCart initial database catalog & slots seeded successfully.');
        }
      } catch (error) {
        console.error('FreshCart initial data seed skipped:', error);
      }

      client = nextClient;
      db = nextDb;
      return nextDb;
    } catch (error) {
      await nextClient.close().catch(() => undefined);
      throw error;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

export function mongoDb() { return db; }
export function mongoClient() { return client; }

export async function closeMongo() {
  if (client) await client.close();
  client = null;
  db = null;
  connectPromise = null;
}
