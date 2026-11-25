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

export function verifySignature(orderId, paymentId, signature) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET.trim())
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
