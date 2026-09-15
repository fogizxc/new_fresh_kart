import { Router } from 'express';
import type { Role, User } from '../models/domain.ts';
import { users } from '../store/memoryStore.ts';
import { createUser, findUser } from '../db/repositories.ts';
import { getSession, signIn } from '../auth/auth.ts';
import { signToken } from '../auth/jwt.ts';
import { hashPassword, isStrongPassword } from '../auth/password.ts';

export const auth = Router();
const roles: Role[] = ['customer', 'shopkeeper', 'employee', 'store_manager', 'admin', 'super_admin'];
const publicUser = (user: User) => { const { passwordHash: _passwordHash, ...safe } = user; return safe; };

 auth.post('/google', async (req, res) => {
  const { credential } = req.body ?? {};
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (typeof credential !== 'string' || !credential.trim()) return res.status(400).json({ error: 'Google credential is required' });
  if (!clientId) return res.status(503).json({ error: 'Google authentication is not configured on the server' });
  try {
    const verification = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!verification.ok) return res.status(401).json({ error: 'Invalid Google credential' });
    const profile = await verification.json() as { aud?: string; sub?: string; email?: string; email_verified?: string; name?: string; picture?: string };
    if (profile.aud !== clientId || !profile.sub || !profile.email || profile.email_verified !== 'true') return res.status(401).json({ error: 'Google account could not be verified' });
    const email = profile.email.trim().toLowerCase();
    let user: User | null = null;
    try {
      const matches = await Promise.all(roles.map(role => findUser(email, role)));
      user = (matches.find(Boolean) as User | undefined) ?? null;
    } catch (error) { console.error('Google account lookup failed:', error); }
    if (!user) user = users.find(candidate => candidate.active && candidate.email.toLowerCase() === email) ?? null;
    if (!user) {
      user = { id: `u-google-${profile.sub}`, name: (profile.name || email.split('@')[0]).trim().slice(0, 80), email, phone: `google-${profile.sub}`, role: 'customer', active: true, passwordHash: hashPassword(`Google-${profile.sub}-${Math.random().toString(36)}`) };
      if (process.env.MONGODB_URI) await createUser(user); else users.push(user);
    }
    if (!user.active) return res.status(403).json({ error: 'This account is inactive' });
    const token = signToken(user);
    return res.json({ token, user: publicUser(user), expiresAt: Date.now() + 1000 * 60 * 60 * 12 });
  } catch (error) {
    console.error('Google authentication error:', error);
    return res.status(401).json({ error: 'Google authentication failed' });
  }
});

auth.post('/login', async (req, res) => {
  const { identifier, password } = req.body ?? {};
  if (typeof identifier !== 'string' || !identifier.trim()) return res.status(400).json({ error: 'Email or phone is required' });
  if (typeof password !== 'string' || !password) return res.status(400).json({ error: 'Password is required' });
  try {
    const session = await signIn(identifier, password);
    if (!session) return res.status(401).json({ error: 'Invalid account or password' });
    return res.json({ token: session.token, user: publicUser(session.user), expiresAt: session.expiresAt });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid account or password' });
  }
});

auth.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body ?? {};
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) return res.status(400).json({ error: 'A valid name is required' });
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase())) return res.status(400).json({ error: 'A valid email is required' });
  if (typeof phone !== 'string' || !/^\+?[0-9]{10,15}$/.test(phone.trim())) return res.status(400).json({ error: 'A valid phone number is required' });
  if (!isStrongPassword(password)) return res.status(400).json({ error: 'Password must be 8-128 characters and contain letters and numbers' });
  const normalizedEmail = email.trim().toLowerCase(); const normalizedPhone = phone.trim();
  try {
    const existingMongo = await Promise.all([...roles.map(role => findUser(normalizedEmail, role)), ...roles.map(role => findUser(normalizedPhone, role))]);
    if (existingMongo.some(Boolean) || users.some(u => u.active && (u.email.toLowerCase() === normalizedEmail || u.phone === normalizedPhone))) return res.status(409).json({ error: 'An account with this email or phone already exists' });
    const user: User = { id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: name.trim(), email: normalizedEmail, phone: normalizedPhone, role: 'customer', active: true, passwordHash: hashPassword(password) };
    if (process.env.MONGODB_URI) await createUser(user); else users.push(user);
    const session = await signIn(normalizedEmail, password);
    if (!session) return res.status(503).json({ error: 'Account created but sign-in could not be established' });
    return res.status(201).json({ token: session.token, user: publicUser(session.user), expiresAt: session.expiresAt });
  } catch (error) { console.error(error); return res.status(503).json({ error: 'Unable to create account' }); }
});

auth.get('/me', async (req, res) => {
  try {
    const authorization = typeof req.headers?.authorization === 'string' ? req.headers.authorization : undefined;
    const token = authorization?.replace(/^Bearer\s+/i, '');
    const session = await getSession(token);
    return session ? res.json(publicUser(session.user)) : res.status(401).json({ error: 'Authentication required' });
  } catch (error) { console.error('Authentication session error:', error); return res.status(401).json({ error: 'Authentication required' }); }
});
auth.post('/logout', (_req, res) => res.status(204).send());