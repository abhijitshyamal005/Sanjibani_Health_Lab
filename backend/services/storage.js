/**
 * File storage for lab reports.
 * STORAGE_DRIVER=local (default) keeps files on disk in UPLOAD_DIR (or backend/uploads/reports).
 * STORAGE_DRIVER=s3 uses any S3-compatible bucket (AWS S3, Cloudflare R2, DigitalOcean Spaces):
 *   S3_BUCKET, S3_REGION, S3_ENDPOINT (optional), S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export function driverName() {
  return (process.env.STORAGE_DRIVER || 'local').toLowerCase() === 's3' ? 's3' : 'local';
}

function localDir() {
  return process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(backendRoot, 'uploads', 'reports');
}

/* ---------- local ---------- */

const local = {
  async put(key, buffer) {
    const dir = localDir();
    await fsp.mkdir(dir, { recursive: true });
    await fsp.writeFile(path.join(dir, path.basename(key)), buffer);
  },
  async stream(key) {
    const file = path.join(localDir(), path.basename(key));
    await fsp.access(file);
    return fs.createReadStream(file);
  },
  async remove(key) {
    await fsp.rm(path.join(localDir(), path.basename(key)), { force: true });
  },
};

/* ---------- s3 (lazy-loaded so the SDK is only needed when used) ---------- */

let s3Client = null;
async function s3() {
  if (!s3Client) {
    const { S3Client } = await import('@aws-sdk/client-s3');
    s3Client = new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: Boolean(process.env.S3_ENDPOINT),
      credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY },
    });
  }
  return s3Client;
}
const s3Key = (key) => `reports/${path.basename(key)}`;

const s3Driver = {
  async put(key, buffer, contentType) {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    await (await s3()).send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: s3Key(key), Body: buffer, ContentType: contentType }));
  },
  async stream(key) {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const out = await (await s3()).send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: s3Key(key) }));
    return out.Body;
  },
  async remove(key) {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await (await s3()).send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: s3Key(key) }));
  },
};

const driver = () => (driverName() === 's3' ? s3Driver : local);

export const storage = {
  put: (key, buffer, contentType = 'application/pdf') => driver().put(key, buffer, contentType),
  /** Resolves to a readable stream; rejects if the file does not exist. */
  stream: (key) => driver().stream(key),
  remove: (key) => driver().remove(key).catch((err) => console.error(`[storage] could not delete ${key}: ${err.message}`)),
};
