// Sprite cache — loads sprites/<name>.png/.webp on first request
const cache = new Map();

function tryLoad(key, formats) {
  if (!formats.length) return; // no format worked, stays null (uses drawn cat)
  const [fmt, ...rest] = formats;
  const img = new Image();
  img.onload = () => cache.set(key, img);
  img.onerror = () => tryLoad(key, rest); // try next format
  img.src = `sprites/${key}.${fmt}?v=2`;
}

function load(key) {
  if (cache.has(key)) return;
  cache.set(key, null); // mark as loading
  tryLoad(key, ['png', 'webp', 'jpg']);
}

export function getSprite(name) {
  const key = name.toLowerCase();
  if (!cache.has(key)) load(key);
  return cache.get(key) || null;
}

export function getSleepSprite(name) {
  const key = `${name.toLowerCase()}-sleep`;
  if (!cache.has(key)) load(key);
  return cache.get(key) || null;
}
