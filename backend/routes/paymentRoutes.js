import { Router } from 'express';
import { submitUpi, upiDetails } from '../controllers/paymentController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('patient'));
router.get('/upi/:bookingId', upiDetails);
router.post('/upi/:bookingId/submit', submitUpi);

export default router;
