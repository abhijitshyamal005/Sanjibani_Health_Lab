import mongoose from 'mongoose';
import multer from 'multer';
import { ApiError } from '../utils/helpers.js';

export function notFound(_req, res) {
  res.status(404).json({ message: 'Route not found' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Report must be 5 MB or smaller'
        : err.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'Upload a single PDF in the "report" field'
          : 'Could not read the uploaded file';
    return res.status(400).json({ message });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    return res.status(400).json({ message });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: `Invalid ${err.path}` });
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    const label = field === 'owner' ? 'lab for this account' : field;
    return res.status(409).json({ message: `A ${label} with this value already exists` });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON body' });
  }

  console.error(err);
  return res.status(500).json({ message: 'Something went wrong. Please try again.' });
}
