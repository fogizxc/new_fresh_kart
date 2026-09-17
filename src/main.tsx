import { useEffect, useState } from 'react';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthScreen } from './components/AuthScreen';
import { AdminDeliveryPricingOverlay } from './components/AdminDeliveryPricingOverlay';
import { PartnerCredentialManager } from './components/PartnerCredentialManager';
import { SuperAdminPortal } from './components/SuperAdminPortal';
import { SuperAdminAccounts } from './components/SuperAdminAccounts';
import { SmartCustomerFeatures } from './components/SmartCustomerFeatures';
import './index.css';

type SessionRole = 'customer' | 'shopkeeper' | 'employee' | 'store_manager' | 'admin' | 'super_admin';

function readRoleFromToken(): SessionRole {
  const storedRole = localStorage.getItem('freshcart_role');
  const validRoles: SessionRole[] = ['customer', 'shopkeeper', 'employee', 'store_manager', 'admin', 'super_admin'];
  const fallback = validRoles.includes(storedRole as SessionRole) ? storedRole as SessionRole : 'customer';
  const token = localStorage.getItem('freshcart_token');
  if (!token) return fallback;

  try {
    const encodedPayload = token.split('.')[1];
    if (!encodedPayload) return fallback;
    const normalized = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
    const payload = JSON.parse(atob(padded)) as { role?: string };
    return validRoles.includes(payload.role as SessionRole) ? payload.role as SessionRole : fallback;
  } catch {
    return fallback;
  }
}

function redirectToSuperAdmin() {
  if (!window.location.pathname.startsWith('/super-admin')) {
    window.location.assign('/super-admin');
  }
}

function clearSession() {
  localStorage.removeItem('freshcart_token');
  localStorage.removeItem('freshcart_role');
  sessionStorage.clear();
  document.cookie.split(';').forEach(cookie => {
    const name = cookie.split('=')[0]?.trim();
    if (name) document.cookie = `${name}=; Max-Age=0; path=/`;
  });
  window.dispatchEvent(new Event('freshcart:auth_changed'));
}

function AppGate() {
  const isSuperPortal = window.location.pathname.startsWith('/super-admin');
  const [authenticated, setAuthenticated] = useState(() => Boolean(localStorage.getItem('freshcart_token')));
  const [showAccounts, setShowAccounts] = useState(false);

  useEffect(() => {
    const onAuth = () => setAuthenticated(Boolean(localStorage.getItem('freshcart_token')));
    window.addEventListener('freshcart:auth_changed', onAuth);
    window.addEventListener('storage', onAuth);
    return () => {
      window.removeEventListener('freshcart:auth_changed', onAuth);
      window.removeEventListener('storage', onAuth);
    };
  }, []);

  useEffect(() => {
    void fetch('/api/health', { cache: 'no-store' }).catch(() => undefined);
  }, []);

  if (!authenticated) {
    return <AuthScreen onAuthenticated={() => {
      const role = readRoleFromToken();
      localStorage.setItem('freshcart_role', role === 'store_manager' ? 'shopkeeper' : role);
      if (role === 'super_admin' && isSuperPortal) {
        setAuthenticated(true);
        return;
      }
      if (isSuperPortal && role !== 'super_admin') {
        clearSession();
        window.location.reload();
        return;
      }
      setAuthenticated(true);
    }} />;
  }

  const role = readRoleFromToken();

  if (role === 'super_admin' && isSuperPortal) {
    if (showAccounts) {
      return <div className="relative min-h-screen">
        <SuperAdminAccounts onLogout={() => { clearSession(); setAuthenticated(false); }} />
        <button onClick={() => setShowAccounts(false)} className="fixed bottom-5 right-5 z-50 rounded-2xl border border-white/10 bg-[#101c17] px-4 py-3 text-xs font-black text-white shadow-xl">← BACK TO OWNER TABS</button>
      </div>;
    }
    return <div className="relative">
      <SuperAdminPortal onLogout={() => { clearSession(); setAuthenticated(false); }} />
      <button onClick={() => setShowAccounts(true)} className="fixed bottom-5 right-5 z-50 rounded-2xl bg-[#d7ef8d] px-4 py-3 text-xs font-black text-[#10251b] shadow-xl">SHOPKEEPERS & EMPLOYEES</button>
    </div>;
  }

  if (isSuperPortal) {
    clearSession();
    return <AuthScreen onAuthenticated={() => {
      const nextRole = readRoleFromToken();
      if (nextRole === 'super_admin') {
        localStorage.setItem('freshcart_role', nextRole);
        setAuthenticated(true);
      } else {
        clearSession();
        window.location.reload();
      }
    }} />;
  }

  localStorage.setItem('freshcart_role', role === 'store_manager' ? 'shopkeeper' : role);
  return <>
    <App />
    {role !== 'customer' && <SmartCustomerFeatures />}
    {role === 'admin' && <><AdminDeliveryPricingOverlay /><PartnerCredentialManager /></>}
  </>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><AppGate /></React.StrictMode>);
