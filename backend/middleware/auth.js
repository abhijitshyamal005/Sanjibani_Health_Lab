import Lab from '../models/labModel.js';
import User from '../models/userModel.js';
import { ApiError } from '../utils/helpers.js';
import { verifyToken } from '../utils/token.js';

export async function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) throw new ApiError(401, 'Please log in to continue');

  let payload;
  try {
    payload = await verifyToken(token);
  } catch {
    throw new ApiError(401, 'Your session has expired. Please log in again');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'Account not found. Please log in again');
  if (!user.isActive) throw new ApiError(403, 'Your account has been deactivated');
  if (user.role === 'collector' && !(user.lab && (await Lab.exists({ _id: user.lab })))) {
    throw new ApiError(403, 'Your collector account is not linked to a lab');
  }

  req.user = user;
  next();
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to do this');
    }
    next();
  };
}
