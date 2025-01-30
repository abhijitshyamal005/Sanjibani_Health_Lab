import express from 'express';
import { register, login , verifyemail } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verifyemail', verifyemail);

export default router;
