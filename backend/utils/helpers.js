export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Copy only the listed keys that are present on `source`. */
export function pick(source = {}, keys = []) {
  const out = {};
  for (const key of keys) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
}

export function escapeRegex(text = '') {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Today's date as YYYY-MM-DD in India Standard Time. */
export function todayIST(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

/** Current hour (0–23) in India Standard Time. */
export function hourIST() {
  return Number(new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }).slice(0, 2)) % 24;
}

/** True when a 'HH:MM-HH:MM' slot on `date` has already started (IST). */
export function slotPassed(date, time) {
  if (date < todayIST()) return true;
  if (date > todayIST()) return false;
  return Number(String(time).slice(0, 2)) <= hourIST();
}

export function toPositiveInt(value, fallback, max = Infinity) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

export function paginate(items, page, limit) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  return { items: items.slice((page - 1) * limit, page * limit), total, page, pages };
}
