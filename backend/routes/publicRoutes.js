import { Router } from 'express';
import { getLab, labAvailability, listLabs, meta, searchTests, suggestTests } from '../controllers/publicController.js';

const router = Router();

router.get('/meta', meta);
router.get('/labs', listLabs);
router.get('/labs/:slug', getLab);
router.get('/labs/:slug/availability', labAvailability);
router.get('/tests/search', searchTests);
router.get('/tests/suggest', suggestTests);

export default router;
