import mongoose from 'mongoose';
import { Router } from 'express';
import { addFamilyMember, forgotPassword, removeFamilyMember, updateFamilyMember, login, me, register, resetPassword, updateMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { ApiError } from '../utils/helpers.js';

const router = Router();

function assertMemberId(req, _res, next) {
  if (!mongoose.isValidObjectId(req.params.memberId)) return next(new ApiError(404, 'Family member not found'));
  next();
}

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', requireAuth, me);
router.patch('/me', requireAuth, updateMe);
router.post('/me/family', requireAuth, addFamilyMember);
router.put('/me/family/:memberId', requireAuth, assertMemberId, updateFamilyMember);
router.delete('/me/family/:memberId', requireAuth, assertMemberId, removeFamilyMember);

export default router;
