/** Startup checks for production deployments. Exits with a clear list of what is missing. */
const DEV_SECRET = 'sanjibani-dev-secret-change-me';

export function validateEnv() {
  const env = process.env.NODE_ENV || 'development';
  const errors = [];
  const warnings = [];

  if (!process.env.MONGO_URI) errors.push('MONGO_URI — MongoDB connection string (e.g. MongoDB Atlas)');
  if (env === 'production') {
    const secret = process.env.JWT_SECRET?.trim() || '';
    if (!secret || secret === DEV_SECRET || secret.length < 32) {
      errors.push('JWT_SECRET — a random string of at least 32 characters');
    }
    if (!process.env.CLIENT_ORIGINS) errors.push('CLIENT_ORIGINS — comma-separated frontend URLs, e.g. https://sanjibani.vercel.app');
  }

  const mailApi = process.env.BREVO_API_KEY || process.env.RESEND_API_KEY;
  if (process.env.EMAIL_ENABLED !== 'true') warnings.push('Email notifications are OFF (set EMAIL_ENABLED=true plus BREVO_API_KEY, or EMAIL + EMAIL_PASSWORD locally)');
  else if (!mailApi && !(process.env.EMAIL && process.env.EMAIL_PASSWORD)) warnings.push('EMAIL_ENABLED=true but no BREVO_API_KEY / RESEND_API_KEY or EMAIL / EMAIL_PASSWORD is set');
  else if (mailApi && !(process.env.EMAIL_FROM || process.env.EMAIL)) errors.push('EMAIL_FROM — the verified sender address for the email API');
  else if (!mailApi && env === 'production') warnings.push('Sending email over SMTP — Render free instances block SMTP ports; set BREVO_API_KEY to send over HTTPS');
  if (!process.env.UPI_ID) warnings.push('Platform UPI is OFF (set UPI_ID / UPI_NAME) — only labs with their own UPI ID accept UPI; others are paid at collection');
  if (env === 'production' && (process.env.STORAGE_DRIVER || 'local') === 'local') {
    warnings.push('Reports are stored on local disk and will be lost on redeploy — set STORAGE_DRIVER=s3 with S3_* variables');
  }
  if ((process.env.STORAGE_DRIVER || '').toLowerCase() === 's3') {
    for (const k of ['S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY']) if (!process.env[k]) errors.push(`${k} — required when STORAGE_DRIVER=s3`);
  }

  warnings.forEach((w) => console.warn(`⚠️  ${w}`));
  if (errors.length) {
    console.error(`\n❌ Missing or invalid configuration (${env}):\n${errors.map((e) => `   • ${e}`).join('\n')}\n`);
    process.exit(1);
  }
}
