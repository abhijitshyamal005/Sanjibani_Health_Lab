import { Router } from 'express';
import { checkInvite, inviteLab, listLabInvites, myInvites } from '../controllers/inviteController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/me', requireAuth, myInvites);
router.get('/check/:code', checkInvite);
router.get('/labs', requireAuth, requireRole('admin'), listLabInvites);
router.post('/labs', requireAuth, requireRole('admin'), inviteLab);

export default router;
