import { Router } from 'express';
import {
  cancelBooking,
  createBooking,
  createReview,
  downloadReport,
  getBooking,
  myBookings,
  recentReviews,
  rescheduleBooking,
  validateCoupon,
} from '../controllers/bookingController.js';
import { assertObjectId } from '../controllers/partnerController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const bookingRouter = Router();
bookingRouter.use(requireAuth);
bookingRouter.post('/', requireRole('patient'), createBooking);
bookingRouter.get('/me', requireRole('patient'), myBookings);
bookingRouter.get('/:id', assertObjectId, getBooking);
bookingRouter.get('/:id/report', assertObjectId, downloadReport);
bookingRouter.patch('/:id/reschedule', assertObjectId, requireRole('patient'), rescheduleBooking);
bookingRouter.patch('/:id/cancel', assertObjectId, requireRole('patient'), cancelBooking);

export const reviewRouter = Router();
reviewRouter.get('/recent', recentReviews);
reviewRouter.post('/', requireAuth, requireRole('patient'), createReview);

export const couponRouter = Router();
couponRouter.post('/validate', requireAuth, requireRole('patient'), validateCoupon);
