import { createOrder, verifyPayment } from './controllers/paymentController';

// Payment Routes
router.post('/payment/orders', createOrder);
router.post('/payment/verify', verifyPayment);