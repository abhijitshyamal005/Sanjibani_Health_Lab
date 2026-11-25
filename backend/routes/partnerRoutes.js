import { Router } from 'express';
import {
  assertObjectId,
  createMyLab,
  createTest,
  deleteTest,
  getMyLab,
  labStats,
  listLabBookings,
  listLabPatients,
  listMyTests,
  updateBookingStatus,
  updateMyLab,
  updateTest,
  uploadReport,
  verifyUpiPayment,
  assignCollector,
  createCollector,
  listCollectors,
  updateCollector,
} from '../controllers/partnerController.js';
import { reportUpload } from '../middleware/upload.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('lab'));

router.get('/lab', getMyLab);
router.post('/lab', createMyLab);
router.put('/lab', updateMyLab);

router.get('/stats', labStats);
router.get('/patients', listLabPatients);

router.get('/tests', listMyTests);
router.post('/tests', createTest);
router.put('/tests/:id', assertObjectId, updateTest);
router.delete('/tests/:id', assertObjectId, deleteTest);

router.get('/bookings', listLabBookings);
router.patch('/bookings/:id/status', assertObjectId, updateBookingStatus);
router.patch('/bookings/:id/payment', assertObjectId, verifyUpiPayment);
router.post('/bookings/:id/report', assertObjectId, reportUpload, uploadReport);
router.patch('/bookings/:id/assign', assertObjectId, assignCollector);

router.get('/collectors', listCollectors);
router.post('/collectors', createCollector);
router.patch('/collectors/:id', assertObjectId, updateCollector);

export default router;
