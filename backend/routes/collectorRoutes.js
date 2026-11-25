import { Router } from 'express';
import { earnings, jobs, progress, summary } from '../controllers/collectorController.js';
import { assertObjectId } from '../controllers/partnerController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('collector'));

router.get('/summary', summary);
router.get('/jobs', jobs);
router.get('/earnings', earnings);
router.patch('/jobs/:id/progress', assertObjectId, progress);

export default router;
