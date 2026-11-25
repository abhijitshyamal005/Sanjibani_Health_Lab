import LabInvite from '../models/labInviteModel.js';
import User from '../models/userModel.js';
import * as events from '../services/events.js';
import { INVITE_REWARD, findInviter, inviteSummary } from '../services/invites.js';
import { ApiError } from '../utils/helpers.js';

/** GET /api/invites/me — the signed-in user's invite code, friends joined and invite coupons. */
export async function myInvites(req, res) {
  res.json(await inviteSummary(req.user));
}

/** GET /api/invites/check/:code — lets the sign-up page say who invited you. Public. */
export async function checkInvite(req, res) {
  const inviter = await findInviter(req.params.code);
  if (!inviter) return res.json({ valid: false });
  res.json({ valid: true, inviterName: String(inviter.name || '').split(' ')[0], reward: INVITE_REWARD });
}

const RESEND_GAP_MS = 10 * 60 * 1000;
const str = (v, max) => String(v ?? '').trim().slice(0, max);

/** POST /api/invites/labs { labName, email, contactName?, note? } — admin emails a lab an invitation to join. */
export async function inviteLab(req, res) {
  const email = str(req.body?.email, 200).toLowerCase();
  const labName = str(req.body?.labName, 120);
  if (!labName) throw new ApiError(400, 'Lab name is required');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new ApiError(400, 'Please enter a valid email address');

  const existing = await User.findOne({ email }).select('role');
  if (existing) {
    throw new ApiError(409, existing.role === 'lab' ? 'This lab already has a partner account' : 'Someone already has an account with this email');
  }

  let invite = await LabInvite.findOne({ email });
  if (invite?.lastSentAt && Date.now() - invite.lastSentAt.getTime() < RESEND_GAP_MS) {
    throw new ApiError(429, 'An invite was sent to this email a few minutes ago. Try again later.');
  }
  invite ||= new LabInvite({ email });
  invite.set({
    labName,
    contactName: str(req.body?.contactName, 80) || undefined,
    note: str(req.body?.note, 500) || undefined,
    invitedBy: req.user._id,
    lastSentAt: new Date(),
  });
  invite.sendCount += 1;
  await invite.save();
  events.labInvited(invite._id);
  res.status(201).json({ invite: { ...invite.toJSON(), joined: false } });
}

/** GET /api/invites/labs — invitations sent, newest first, marked joined once the lab registers. */
export async function listLabInvites(_req, res) {
  const invites = await LabInvite.find().sort({ lastSentAt: -1 }).limit(500).lean();
  const joined = new Set(
    (await User.find({ email: { $in: invites.map((i) => i.email) }, role: 'lab' }).select('email').lean()).map((u) => u.email)
  );
  res.json({ items: invites.map((i) => ({ ...i, joined: joined.has(i.email) })) });
}
