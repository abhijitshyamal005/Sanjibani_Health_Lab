import mongoose from 'mongoose';
import Booking from '../models/bookingModel.js';
import Lab from '../models/labModel.js';
import * as events from '../services/events.js';
import { upiPayeeFor, upiUri } from '../services/payments.js';
import { ApiError } from '../utils/helpers.js';

const LAB_SUMMARY = 'name slug address phone coverTheme reportTime upiId';

/** A booking of the logged-in patient that can still be paid. */
async function payableBooking(req, bookingId) {
  if (!mongoose.isValidObjectId(bookingId)) throw new ApiError(400, 'Invalid booking');
  const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.status === 'cancelled') throw new ApiError(400, 'This booking is cancelled');
  if (booking.paymentStatus === 'paid') throw new ApiError(400, 'This booking is already paid');
  if (booking.paymentStatus === 'verifying') throw new ApiError(400, 'Your UPI payment is being verified');
  return booking;
}

async function payeeFor(booking) {
  const lab = await Lab.findById(booking.lab).select('name upiId upiName');
  const to = upiPayeeFor(lab);
  if (!to) throw new ApiError(400, 'UPI payments are not set up yet — please pay at collection');
  return to;
}

/** GET /api/payments/upi/:bookingId — UPI ID, payee name, amount and a ready-made upi:// link. */
export async function upiDetails(req, res) {
  const booking = await payableBooking(req, req.params.bookingId);
  const to = await payeeFor(booking);
  const note = `Patholy ${booking.code}`;
  res.json({ upiId: to.upiId, payee: to.payee, amount: booking.total, note, uri: upiUri({ upiId: to.upiId, payee: to.payee, amount: booking.total, note }) });
}

/** POST /api/payments/upi/:bookingId/submit { utr } — patient reports a UPI payment for confirmation. */
export async function submitUpi(req, res) {
  const booking = await payableBooking(req, req.params.bookingId);
  const to = await payeeFor(booking);
  const utr = String(req.body?.utr || '').replace(/\s/g, '');
  if (!/^\d{12}$/.test(utr)) throw new ApiError(400, 'Enter the 12-digit UPI transaction ID (UTR) from your UPI app');
  if (await Booking.exists({ upiRef: utr, _id: { $ne: booking._id } })) throw new ApiError(409, 'This transaction ID was already used for another booking');
  booking.paymentMethod = 'upi_direct';
  booking.paymentStatus = 'verifying';
  booking.upiRef = utr;
  booking.upiPayee = to.owner;
  booking.upiSubmittedAt = new Date();
  await booking.save();
  events.upiSubmitted(booking._id);
  res.json({ booking: await booking.populate('lab', LAB_SUMMARY) });
}
