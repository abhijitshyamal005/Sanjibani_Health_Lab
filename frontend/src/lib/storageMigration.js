// The site used to store its keys under the old brand prefix. Move them once so
// returning visitors stay logged in and keep their cart and city after the rename.
const LEGACY_PREFIX = 'sanjibani.';
const PREFIX = 'patholy.';

try {
  for (const name of ['token', 'cart', 'city']) {
    const old = localStorage.getItem(LEGACY_PREFIX + name);
    if (old == null) continue;
    if (localStorage.getItem(PREFIX + name) == null) localStorage.setItem(PREFIX + name, old);
    localStorage.removeItem(LEGACY_PREFIX + name);
  }
} catch {
  // Storage blocked (private mode etc.) — nothing to migrate.
}
