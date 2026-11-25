/**
 * Invite a friend: every user has a personal invite code. Someone who signs up with it gets a
 * ₹100 coupon; once their first booking is completed, the patient who invited them gets ₹100 too.
 * Invite coupons are personal (only the owner can use them), single-use and expire after 90 days.
 */
import crypto from 'node:crypto';
import Coupon from '../models/couponModel.js';
import User from '../models/userModel.js';
import * as events from './events.js';

export const INVITE_REWARD = { amount: 100, minOrder: 500, validDays: 90 };

// No 0/O or 1/I so codes are easy to read out loud.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function randomCode(length) {
  return [...crypto.randomBytes(length)].map((b) => ALPHABET[b % ALPHABET.length]).join('');
}
const isDuplicate = (err) => err?.code === 11000;

export function cleanInviteCode(code) {
  const clean = String(code || '').trim().toUpperCase();
  return /^[A-Z0-9]{4,20}$/.test(clean) ? clean : '';
}

/** The user's invite code, created the first time it is needed. */
export async function ensureInviteCode(user) {
  if (user.inviteCode) return user.inviteCode;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const updated = await User.findOneAndUpdate(
        { _id: user._id, inviteCode: { $exists: false } },
        { $set: { inviteCode: randomCode(8) } },
        { new: true }
      );
      const code = updated?.inviteCode || (await User.findById(user._id).select('inviteCode'))?.inviteCode;
      user.inviteCode = code;
      return code;
    } catch (err) {
      if (!isDuplicate(err)) throw err;
    }
  }
  throw new Error('Could not create an invite code');
}

/** The active user who owns this invite code, or null. */
export async function findInviter(code) {
  const clean = cleanInviteCode(code);
  return clean ? User.findOne({ inviteCode: clean, isActive: true }) : null;
}

async function issueCoupon(ownerId, source) {
  const welcome = source === 'invite_welcome';
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await Coupon.create({
        code: (welcome ? 'WELCOME' : 'THANKS') + randomCode(6),
        description: welcome
          ? `₹${INVITE_REWARD.amount} off — welcome gift from your invite`
          : `₹${INVITE_REWARD.amount} off — thank you for inviting a friend`,
        type: 'flat',
        value: INVITE_REWARD.amount,
        minOrder: INVITE_REWARD.minOrder,
        usageLimit: 1,
        expiresAt: new Date(Date.now() + INVITE_REWARD.validDays * 24 * 60 * 60 * 1000),
        owner: ownerId,
        source,
      });
    } catch (err) {
      if (!isDuplicate(err)) throw err;
    }
  }
  throw new Error('Could not create a coupon');
}

/**
 * Link a new account to whoever invited it. A new patient gets a welcome coupon (returned);
 * lab partners are only linked. An unknown code is ignored so sign-up never fails over it.
 */
export async function applyInviteOnRegister(user, code) {
  const inviter = await findInviter(code);
  if (!inviter || inviter._id.equals(user._id)) return null;
  await User.updateOne({ _id: user._id }, { $set: { invitedBy: inviter._id } });
  user.invitedBy = inviter._id;
  return user.role === 'patient' ? issueCoupon(user._id, 'invite_welcome') : null;
}

/** Called when a booking is completed: reward the inviter once, on their friend's first completed booking. */
export async function rewardInviter(friendId) {
  const friend = await User.findOneAndUpdate(
    { _id: friendId, invitedBy: { $ne: null }, inviteRewardedAt: { $exists: false } },
    { $set: { inviteRewardedAt: new Date() } },
    { new: true }
  );
  if (!friend) return null;
  const inviter = await User.findById(friend.invitedBy);
  // Only patients can book tests, so only they can use a reward coupon.
  if (!inviter?.isActive || inviter.role !== 'patient') return null;
  const coupon = await issueCoupon(inviter._id, 'invite_reward');
  events.inviteRewarded(inviter, friend, coupon);
  return coupon;
}

export function couponState(c) {
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return 'used';
  if (!c.isActive) return 'inactive';
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) return 'expired';
  return 'available';
}

/** What the invite page shows: the share code, how many friends joined, and the user's invite coupons. */
export async function inviteSummary(user) {
  const code = await ensureInviteCode(user);
  const [joined, rewarded, coupons] = await Promise.all([
    User.countDocuments({ invitedBy: user._id }),
    User.countDocuments({ invitedBy: user._id, inviteRewardedAt: { $exists: true } }),
    Coupon.find({ owner: user._id }).sort({ createdAt: -1 }).lean(),
  ]);
  return {
    code,
    reward: INVITE_REWARD,
    earnsReward: user.role === 'patient',
    joined,
    rewarded,
    coupons: coupons.map((c) => ({
      code: c.code,
      description: c.description,
      value: c.value,
      minOrder: c.minOrder,
      expiresAt: c.expiresAt,
      source: c.source,
      state: couponState(c),
    })),
  };
}
