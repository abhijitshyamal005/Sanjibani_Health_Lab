import express from 'express';
import { addToCart, getCart } from '../controllers/cartController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/add', verifyToken, addToCart);
router.get('/', verifyToken, getCart);

export default router;
