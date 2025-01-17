import express from 'express';
import { register, login , verifyEmail } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verifyemail', verifyEmail);

export default router;
