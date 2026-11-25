import { Router } from 'express';
import { createPaymentOrder, verifyPayment } from '../controllers/paymentController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('patient'));
router.post('/order', createPaymentOrder);
router.post('/verify', verifyPayment);

export default router;
