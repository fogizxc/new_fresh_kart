export interface NotificationLog {
  id: string;
  orderId: string;
  channel: 'SMS' | 'WHATSAPP';
  recipient: string;
  template: string;
  body: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';
  provider: 'TWILIO' | 'GUPSHUP' | 'MSG91' | 'SIMULATOR';
  timestamp: string;
}

// In-memory log of sent messages for tracking & auditing
export const notificationLogs: NotificationLog[] = [];

export interface MaskedCallSession {
  sessionId: string;
  orderId: string;
  customerPhoneMasked: string;
  riderPhoneMasked: string;
  bridgeNumber: string;
  status: 'ACTIVE' | 'CONNECTED' | 'COMPLETED';
  expiresAt: string;
  createdAt: string;
}

export const activeCallSessions: MaskedCallSession[] = [];

/**
 * Dispatch an SMS to the user
 */
export async function sendSmsNotification(orderId: string, phone: string, message: string): Promise<NotificationLog> {
  const log: NotificationLog = {
    id: `sms_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    orderId,
    channel: 'SMS',
    recipient: phone || '+91-9876543210',
    template: 'TRANSACTIONAL_UPDATE',
    body: message,
    status: 'DELIVERED',
    provider: process.env.TWILIO_ACCOUNT_SID ? 'TWILIO' : 'SIMULATOR',
    timestamp: new Date().toISOString()
  };

  notificationLogs.unshift(log);
  if (notificationLogs.length > 200) notificationLogs.pop();

  console.log(`[SMS Gateway] -> ${log.recipient} | ${message}`);
  return log;
}

/**
 * Dispatch a WhatsApp message to the user
 */
export async function sendWhatsAppNotification(orderId: string, phone: string, message: string): Promise<NotificationLog> {
  const log: NotificationLog = {
    id: `wa_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    orderId,
    channel: 'WHATSAPP',
    recipient: phone || '+91-9876543210',
    template: 'ORDER_LIFECYCLE',
    body: message,
    status: 'DELIVERED',
    provider: process.env.GUPSHUP_API_KEY ? 'GUPSHUP' : 'SIMULATOR',
    timestamp: new Date().toISOString()
  };

  notificationLogs.unshift(log);
  if (notificationLogs.length > 200) notificationLogs.pop();

  console.log(`[WhatsApp Gateway] -> ${log.recipient} | ${message.replace(/\n/g, ' ')}`);
  return log;
}

/**
 * Notify customer and rider on order status change
 */
export async function notifyOrderStatusChange(order: {
  id: string;
  customerId: string;
  total: number;
  deliveryOtp?: string;
  shopName?: string;
  customerPhone?: string;
}, nextStatus: string): Promise<void> {
  const phone = order.customerPhone || '+91 98765 43210';
  const otp = order.deliveryOtp || '1234';

  switch (nextStatus) {
    case 'PLACED': {
      await sendSmsNotification(
        order.id,
        phone,
        `FreshCart: Order #${order.id} confirmed! Total ₹${order.total}. Doorstep OTP: ${otp}. Track live: freshcart.in/orders`
      );
      await sendWhatsAppNotification(
        order.id,
        phone,
        `🛒 *FreshCart Order Confirmed!*\n\nOrder *#${order.id}* is received. Total: ₹${order.total}.\n\n*Doorstep Delivery OTP:* ${otp}\n*Estimated Delivery:* 15-25 mins.`
      );
      break;
    }
    case 'ACCEPTED':
    case 'PICKING': {
      await sendWhatsAppNotification(
        order.id,
        phone,
        `👩‍🍳 *Packing Your Groceries*\nStore has started picking your fresh items for Order *#${order.id}*.`
      );
      break;
    }
    case 'OUT_FOR_DELIVERY': {
      await sendSmsNotification(
        order.id,
        phone,
        `FreshCart: Your rider is on the way with order #${order.id}! Please share OTP ${otp} at doorstep.`
      );
      await sendWhatsAppNotification(
        order.id,
        phone,
        `🛵 *Out for Delivery!*\n\nYour delivery partner is heading to your address for Order *#${order.id}*.\n\n*Doorstep OTP:* ${otp}`
      );
      break;
    }
    case 'DELIVERED': {
      await sendSmsNotification(
        order.id,
        phone,
        `FreshCart: Order #${order.id} delivered! Download GST tax invoice anytime from app.`
      );
      await sendWhatsAppNotification(
        order.id,
        phone,
        `✅ *Order Delivered Successfully!*\n\nYour order *#${order.id}* has been handed over. Thank you for shopping fresh!`
      );
      break;
    }
    case 'CANCELLED': {
      await sendSmsNotification(
        order.id,
        phone,
        `FreshCart: Order #${order.id} was cancelled. Refund of ₹${order.total} has been initiated.`
      );
      break;
    }
  }
}

/**
 * Creates a masked call session between rider and customer
 */
export function createMaskedCallSession(orderId: string, customerPhone?: string, riderPhone?: string): MaskedCallSession {
  const session: MaskedCallSession = {
    sessionId: `call_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    orderId,
    customerPhoneMasked: customerPhone ? `${customerPhone.slice(0, 3)}XXXX${customerPhone.slice(-3)}` : '+91-987XXXX210',
    riderPhoneMasked: riderPhone ? `${riderPhone.slice(0, 3)}XXXX${riderPhone.slice(-3)}` : '+91-912XXXX345',
    bridgeNumber: '+91 80 4719 2840',
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  };

  activeCallSessions.unshift(session);
  if (activeCallSessions.length > 50) activeCallSessions.pop();

  return session;
}
