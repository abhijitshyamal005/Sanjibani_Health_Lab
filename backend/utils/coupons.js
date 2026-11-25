import Coupon from '../models/couponModel.js';
import { ApiError } from './helpers.js';

/** Discount in whole rupees, never more than the subtotal. */
export function computeDiscount(coupon, subtotal) {
  let discount = coupon.type === 'percent' ? Math.floor((subtotal * coupon.value) / 100) : Math.round(coupon.value);
  if (coupon.type === 'percent' && coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  return Math.max(0, Math.min(discount, subtotal));
}

/** Look up a coupon by code and check it applies to this subtotal. Throws ApiError(400) with a user-facing message. */
export async function resolveCoupon(code, subtotal) {
  const clean = String(code || '').trim().toUpperCase();
  const coupon = clean ? await Coupon.findOne({ code: clean, isActive: true }) : null;
  if (!coupon) throw new ApiError(400, 'Invalid coupon code');
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) throw new ApiError(400, 'This coupon has expired');
  if (subtotal < coupon.minOrder) {
    throw new ApiError(400, `Add tests worth ₹${coupon.minOrder.toLocaleString('en-IN')} or more to use this coupon`);
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, 'This coupon has reached its usage limit');
  }
  return { coupon, discount: computeDiscount(coupon, subtotal) };
}

export async function featuredCoupon() {
  const c = await Coupon.findOne({
    featured: true,
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
    .sort({ createdAt: 1 })
    .lean();
  if (!c) return null;
  return { code: c.code, description: c.description, type: c.type, value: c.value, minOrder: c.minOrder, maxDiscount: c.maxDiscount };
}
