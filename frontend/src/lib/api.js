const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'patholy.token';

let unauthorizedHandler = null;

export const tokenStore = {
  get: () => safeStorage(() => localStorage.getItem(TOKEN_KEY)),
  set: (t) => safeStorage(() => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))),
};

export function onUnauthorized(handler) {
  unauthorizedHandler = handler;
}

function safeStorage(fn) {
  try {
    return fn();
  } catch {
    return null;
  }
}

function query(params) {
  if (!params) return '';
  const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return clean.length ? `?${new URLSearchParams(clean)}` : '';
}

async function rawRequest(path, init) {
  const token = tokenStore.get();
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { ...(init.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
  } catch {
    throw Object.assign(new Error('Cannot reach the server. Check your connection and try again.'), { status: 0 });
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && token) unauthorizedHandler?.();
    throw Object.assign(new Error(data.message || 'Something went wrong'), { status: res.status });
  }
  return res;
}

/** Multipart upload (e.g. a PDF report). */
export async function apiUpload(path, formData, method = 'POST') {
  const res = await rawRequest(path, { method, body: formData });
  return res.json();
}

/** Download an authenticated file and hand it to the browser. */
export async function apiDownload(path, fallbackName = 'download.pdf') {
  const res = await rawRequest(path, { method: 'GET' });
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const name = /filename="?([^"]+)"?/.exec(disposition)?.[1] || fallbackName;
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function api(path, { method = 'GET', body, params } = {}) {
  const token = tokenStore.get();
  let res;
  try {
    res = await fetch(`${BASE}${path}${query(params)}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw Object.assign(new Error('Cannot reach the server. Check your connection and try again.'), { status: 0 });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) unauthorizedHandler?.();
    throw Object.assign(new Error(data.message || 'Something went wrong'), { status: res.status });
  }
  return data;
}
