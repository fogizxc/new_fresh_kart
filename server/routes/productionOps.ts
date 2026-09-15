import { Router } from 'express';
import { requireAuth } from '../auth/middleware';
import {
  notificationLogs,
  activeCallSessions,
  createMaskedCallSession,
  sendSmsNotification,
  sendWhatsAppNotification
} from '../services/notificationService';
import { createDatabaseBackup, backupHistory } from '../services/backupService';

export const productionOps = Router();

// 1. Transactional Notification Logs (SMS & WhatsApp)
productionOps.get('/notifications/logs', requireAuth, (req, res) => {
  const orderId = typeof req.query.orderId === 'string' ? req.query.orderId : undefined;
  if (orderId) {
    return res.json(notificationLogs.filter(log => log.orderId === orderId));
  }
  return res.json(notificationLogs.slice(0, 50));
});

// Test trigger notification
productionOps.post('/notifications/test', requireAuth, async (req, res) => {
  const { orderId, channel, message } = req.body ?? {};
  if (!orderId || !message) {
    return res.status(400).json({ error: 'orderId and message are required' });
  }

  if (channel === 'WHATSAPP') {
    const log = await sendWhatsAppNotification(orderId, req.user?.phone || '+91 98765 43210', message);
    return res.json({ ok: true, log });
  } else {
    const log = await sendSmsNotification(orderId, req.user?.phone || '+91 98765 43210', message);
    return res.json({ ok: true, log });
  }
});

// 2. Click-to-Call / Masked Calling Bridge
productionOps.post('/support/call-proxy', requireAuth, (req, res) => {
  const { orderId, riderPhone, customerPhone } = req.body ?? {};
  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }

  const session = createMaskedCallSession(
    orderId,
    customerPhone || req.user?.phone || '+91-9876543210',
    riderPhone || '+91-9123456780'
  );

  return res.json({
    ok: true,
    session,
    dialInstructions: `Calling ${session.bridgeNumber} will connect you securely without disclosing your mobile number.`
  });
});

// Active call sessions
productionOps.get('/support/call-proxy/:orderId', requireAuth, (req, res) => {
  const session = activeCallSessions.find(s => s.orderId === req.params.orderId);
  if (!session) {
    return res.status(404).json({ error: 'No active call session found for this order' });
  }
  return res.json(session);
});

// 3. Automated Backup & Disaster Recovery Snapshots
productionOps.post('/admin/backups/trigger', requireAuth, async (req, res) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin authorization required' });
  }

  try {
    const backup = await createDatabaseBackup();
    return res.status(201).json({ ok: true, backup });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Backup execution failed' });
  }
});

productionOps.get('/admin/backups', requireAuth, (req, res) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin authorization required' });
  }
  return res.json(backupHistory);
});
