import { Router } from 'express';
import {
  createCoupon,
  deleteCoupon,
  listBookings,
  listCoupons,
  updateCoupon,
  listLabs,
  listUsers,
  setLabStatus,
  setUserActive,
  stats,
} from '../controllers/adminController.js';
import { assertObjectId } from '../controllers/partnerController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/stats', stats);
router.get('/labs', listLabs);
router.patch('/labs/:id/status', assertObjectId, setLabStatus);
router.get('/users', listUsers);
router.patch('/users/:id', assertObjectId, setUserActive);
router.get('/bookings', listBookings);
router.get('/coupons', listCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', assertObjectId, updateCoupon);
router.delete('/coupons/:id', assertObjectId, deleteCoupon);

export default router;
