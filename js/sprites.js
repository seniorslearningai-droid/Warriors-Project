// Sprite cache — loads sprites/<name>.png and sprites/<name>-sleep.png
const cache = new Map();

function load(key) {
  if (cache.has(key)) return;
  cache.set(key, null); // mark loading
  const img = new Image();
  img.onload = () => cache.set(key, img);
  img.onerror = () => {}; // silently absent
  img.src = `sprites/${key}.png`;
}

export function preloadSprites(name) {
  const n = name.toLowerCase();
  load(n);
  load(`${n}-sleep`);
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
