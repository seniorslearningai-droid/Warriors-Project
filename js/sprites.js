// Sprite cache — loads sprites/name.png on first request, falls back to drawn cat if missing
const cache = new Map();

export function preloadSprite(name) {
  const key = name.toLowerCase();
  if (cache.has(key)) return;
  cache.set(key, null); // mark as loading so we don't double-load
  const img = new Image();
  img.onload = () => cache.set(key, img);
  img.onerror = () => cache.set(key, null); // no sprite for this cat
  img.src = `sprites/${key}.png`;
}

export function getSprite(name) {
  const key = name.toLowerCase();
  if (!cache.has(key)) preloadSprite(name);
  return cache.get(key); // null while loading or if missing
}
