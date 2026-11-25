import crypto from 'node:crypto';
import User from '../models/userModel.js';
import * as events from '../services/events.js';
import { emails, notify } from '../services/notify.js';
import Lab from '../models/labModel.js';
import { ApiError, pick } from '../utils/helpers.js';
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
  events.userRegistered(user);
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
