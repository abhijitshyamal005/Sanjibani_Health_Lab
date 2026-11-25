import multer from 'multer';
import { ApiError } from '../utils/helpers.js';

export const MAX_REPORT_BYTES = 5 * 1024 * 1024;

/** Single PDF in memory (then handed to the storage driver). Field name: "report". */
export const reportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_REPORT_BYTES, files: 1 },
  fileFilter(_req, file, cb) {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new ApiError(400, 'Only PDF files are allowed for reports'));
  },
}).single('report');
