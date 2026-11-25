import crypto from 'node:crypto';
import Razorpay from 'razorpay';

let client = null;
let injected = null;

const valid = (v) => Boolean(v && v.trim() && !v.trim().toLowerCase().startsWith('your'));

export function paymentsEnabled() {
  return valid(process.env.RAZORPAY_KEY_ID) && valid(process.env.RAZORPAY_KEY_SECRET);
}

export function razorpayKeyId() {
  return paymentsEnabled() ? process.env.RAZORPAY_KEY_ID.trim() : null;
}

/** Tests can inject a stub with `orders.create()`. Pass null to reset. */
export function setRazorpayClient(stub) {
  injected = stub;
}

function getClient() {
  if (injected) return injected;
  if (!client) {
    client = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID.trim(), key_secret: process.env.RAZORPAY_KEY_SECRET.trim() });
  }
  return client;
}

export function createOrder({ amount, receipt, notes }) {
  return getClient().orders.create({ amount, currency: 'INR', receipt, notes });
}

/** Fetch a payment and capture it if it is only authorized (accounts without auto-capture). */
export async function ensureCaptured(paymentId, amountPaise) {
  const client = getClient();
  if (!client.payments?.fetch) return null;
  const payment = await client.payments.fetch(paymentId);
  if (payment.status === 'authorized') return client.payments.capture(paymentId, amountPaise, 'INR');
  return payment;
}

/** Full refund of a captured payment. Returns Razorpay's refund object. */
export function refundPayment(paymentId, amountPaise, notes = {}) {
  return getClient().payments.refund(paymentId, { amount: amountPaise, speed: 'normal', notes });
}

export function webhookConfigured() {
  return valid(process.env.RAZORPAY_WEBHOOK_SECRET);
}

/** Verify the X-Razorpay-Signature header against the raw request body. */
export function verifyWebhookSignature(rawBody, signature) {
  if (!webhookConfigured()) return false;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET.trim()).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function verifySignature(orderId, paymentId, signature) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET.trim())
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
