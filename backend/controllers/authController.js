import crypto from 'node:crypto';
import { applyInviteOnRegister } from '../services/invites.js';
import User from '../models/userModel.js';
import * as events from '../services/events.js';
import { emails, notify } from '../services/notify.js';
import Lab from '../models/labModel.js';
import { MAX_FAMILY_MEMBERS } from '../utils/constants.js';
import { ApiError, pick, todayIST } from '../utils/helpers.js';
import { signToken } from '../utils/token.js';

const SELF_REGISTER_ROLES = ['patient', 'lab'];

async function authPayload(user) {
  const result = { token: await signToken(user), user: user.toJSON() };
  if (user.role === 'lab') {
    result.lab = await Lab.findOne({ owner: user._id }).select('name slug status').lean();
  }
  if (user.role === 'collector') {
    result.lab = await Lab.findById(user.lab).select('name slug phone').lean();
  }
  return result;
}

export async function register(req, res) {
  const { name, email, phone, password, role = 'patient' } = req.body || {};
  if (!SELF_REGISTER_ROLES.includes(role)) {
    throw new ApiError(400, 'You can register as a patient or a lab partner');
  }
  if (email && (await User.exists({ email: String(email).toLowerCase().trim() }))) {
    throw new ApiError(409, 'An account with this email already exists');
  }
  const user = await User.create({ name, email, phone, password, role });
  // Signed up through a friend's invite link: link the accounts and give a new patient their welcome coupon.
  const welcomeCoupon = req.body?.inviteCode
    ? await applyInviteOnRegister(user, req.body.inviteCode).catch((err) => {
        console.error('[invite]', err.message);
        return null;
      })
    : null;
  events.userRegistered(user, { coupon: welcomeCoupon });
  res.status(201).json(await authPayload(user));
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(String(password)))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.isActive) throw new ApiError(403, 'Your account has been deactivated');

  res.json(await authPayload(user));
}

export async function me(req, res) {
  const { token: _token, ...rest } = await authPayload(req.user);
  res.json(rest);
}

export async function updateMe(req, res) {
  const user = await User.findById(req.user._id).select('+password');
  Object.assign(user, pick(req.body, ['name', 'phone', 'city', 'gender', 'dateOfBirth']));
  if (req.body?.address && typeof req.body.address === 'object') {
    user.address = pick(req.body.address, ['line', 'area', 'city', 'pincode']);
  }

  const { currentPassword, newPassword } = req.body || {};
  if (newPassword) {
    if (!currentPassword || !(await user.comparePassword(String(currentPassword)))) {
      throw new ApiError(400, 'Current password is incorrect');
    }
    user.password = String(newPassword);
  }

  await user.save();
  if (newPassword) events.passwordChanged(user);
  else events.profileUpdated(user);
  res.json({ user: user.toJSON() });
}

const RESET_MESSAGE = 'If an account exists, we have sent a reset code to the email.';
const hashCode = (code) => crypto.createHash('sha256').update(String(code)).digest('hex');

/** POST /api/auth/forgot-password — always 200 so emails can't be enumerated. */
export async function forgotPassword(req, res) {
  const email = String(req.body?.email || '').toLowerCase().trim();
  const response = { message: RESET_MESSAGE };
  const user = email ? await User.findOne({ email }) : null;
  if (user && user.isActive) {
    const code = String(crypto.randomInt(100000, 1000000));
    user.resetCodeHash = hashCode(code);
    user.resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    notify(emails.resetCode(user.email, user.name, code));
    if (process.env.NODE_ENV !== 'production' && process.env.EMAIL_ENABLED !== 'true') response.devCode = code;
  }
  res.json(response);
}

/** POST /api/auth/reset-password */
export async function resetPassword(req, res) {
  const { email, code, newPassword } = req.body || {};
  const user = await User.findOne({ email: String(email || '').toLowerCase().trim() }).select('+password +resetCodeHash +resetCodeExpires');
  const ok =
    user &&
    user.resetCodeHash &&
    user.resetCodeExpires &&
    user.resetCodeExpires.getTime() > Date.now() &&
    crypto.timingSafeEqual(Buffer.from(user.resetCodeHash), Buffer.from(hashCode(code || '')));
  if (!ok) throw new ApiError(400, 'Invalid or expired code');
  if (!newPassword || String(newPassword).length < 6) throw new ApiError(400, 'Password must be at least 6 characters');
  user.password = String(newPassword);
  user.resetCodeHash = undefined;
  user.resetCodeExpires = undefined;
  await user.save();
  events.passwordChanged(user);
  res.json(await authPayload(user));
}

const FAMILY_FIELDS = ['name', 'relation', 'gender', 'dateOfBirth', 'phone'];

function readFamilyMember(body = {}) {
  const member = pick(body, FAMILY_FIELDS);
  if (member.dateOfBirth && member.dateOfBirth > todayIST()) throw new ApiError(400, 'Date of birth cannot be in the future');
  return member;
}

async function loadPatient(req) {
  if (req.user.role !== 'patient') throw new ApiError(403, 'Only patients can save family members');
  return User.findById(req.user._id);
}

/** POST /api/auth/me/family — save someone the patient books tests for. */
export async function addFamilyMember(req, res) {
  const user = await loadPatient(req);
  if (user.familyMembers.length >= MAX_FAMILY_MEMBERS) {
    throw new ApiError(400, `You can save up to ${MAX_FAMILY_MEMBERS} family members`);
  }
  user.familyMembers.push(readFamilyMember(req.body));
  await user.save();
  res.status(201).json({ user: user.toJSON(), member: user.familyMembers.at(-1) });
}

/** PUT /api/auth/me/family/:memberId */
export async function updateFamilyMember(req, res) {
  const user = await loadPatient(req);
  const member = user.familyMembers.id(req.params.memberId);
  if (!member) throw new ApiError(404, 'Family member not found');
  member.set(readFamilyMember(req.body));
  await user.save();
  res.json({ user: user.toJSON(), member });
}

/** DELETE /api/auth/me/family/:memberId */
export async function removeFamilyMember(req, res) {
  const user = await loadPatient(req);
  const member = user.familyMembers.id(req.params.memberId);
  if (!member) throw new ApiError(404, 'Family member not found');
  member.deleteOne();
  await user.save();
  res.json({ user: user.toJSON() });
}
