import express from 'express';
import { placeOrder, getOrders } from '../controllers/orderController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/place', verifyToken, placeOrder);
router.get('/', verifyToken, getOrders);

export default router;
