import { getMapCache, WORLD_W, WORLD_H, getDenAtPoint } from './map.js';
import { renderPlayer, SPEED } from './player.js';

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  player: {
    x: 1500, y: 1010,
    color: '#FF8C00',
    name: 'You',
    rank: 'kit',
    asleep: false
  },
  camera: { x: 0, y: 0 },
  keys: {},
  canvas: null,
  ctx: null,
  nearDen: null,
  popup: null
};

// ─── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Load saved player from localStorage
  const saved = localStorage.getItem('tribeCat');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      state.player.name = data.name || 'You';
      state.player.color = data.color || '#FF8C00';
      state.player.rank = data.rank || 'kit';
    } catch (_) {}
  } else {
    window.location.href = 'index.html';
    return;
  }

  state.canvas = document.getElementById('game-canvas');
  state.ctx = state.canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  window.addEventListener('keydown', e => {
    state.keys[e.key] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', e => { state.keys[e.key] = false; });

  state.canvas.addEventListener('click', handleClick);
  state.canvas.addEventListener('mousemove', handleMouseMove);

  // Popup close button
  document.getElementById('popup-close')?.addEventListener('click', closePopup);
  document.getElementById('popup-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'popup-overlay') closePopup();
  });

  updateHUD();
  requestAnimationFrame(loop);
});

function resizeCanvas() {
  state.canvas.width = window.innerWidth;
  state.canvas.height = window.innerHeight;
}

// ─── Game Loop ────────────────────────────────────────────────────────────────
function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

function update() {
  const p = state.player;
  if (p.asleep || state.popup) return;

  const { keys } = state;
  let dx = 0, dy = 0;

  if (keys['ArrowLeft']  || keys['a'] || keys['A']) dx -= SPEED;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += SPEED;
  if (keys['ArrowUp']    || keys['w'] || keys['W']) dy -= SPEED;
  if (keys['ArrowDown']  || keys['s'] || keys['S']) dy += SPEED;

  if (dx && dy) { dx *= 0.707; dy *= 0.707; }

  p.x = Math.max(60, Math.min(WORLD_W - 60, p.x + dx));
  p.y = Math.max(60, Math.min(WORLD_H - 60, p.y + dy));

  // Camera
  const cw = state.canvas.width, ch = state.canvas.height;
  state.camera.x = Math.max(0, Math.min(WORLD_W - cw, p.x - cw / 2));
  state.camera.y = Math.max(0, Math.min(WORLD_H - ch, p.y - ch / 2));

  // Den proximity
  const den = getDenAtPoint(p.x, p.y);
  state.nearDen = den;
  const prompt = document.getElementById('interaction-prompt');
  const promptText = document.getElementById('prompt-text');
  if (den && prompt && promptText) {
    promptText.textContent = `[Click] Enter ${den.label}`;
    prompt.classList.remove('hidden');
  } else if (prompt) {
    prompt.classList.add('hidden');
  }
}

function render() {
  const { ctx, canvas, camera, player } = state;
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(-camera.x, -camera.y);

  ctx.drawImage(getMapCache(), 0, 0);
  renderPlayer(ctx, player, true);

  ctx.restore();
}

// ─── Interaction ──────────────────────────────────────────────────────────────
function handleClick(e) {
  if (state.popup) return;
  const rect = state.canvas.getBoundingClientRect();
  const wx = e.clientX - rect.left + state.camera.x;
  const wy = e.clientY - rect.top + state.camera.y;
  const den = getDenAtPoint(wx, wy);
  if (den) showDenPopup(den);
}

function handleMouseMove(e) {
  const rect = state.canvas.getBoundingClientRect();
  const wx = e.clientX - rect.left + state.camera.x;
  const wy = e.clientY - rect.top + state.camera.y;
  const den = getDenAtPoint(wx, wy);
  state.canvas.style.cursor = den ? 'pointer' : 'default';
}

function showDenPopup(area) {
  state.popup = area;
  const overlay = document.getElementById('popup-overlay');
  const content = document.getElementById('popup-content');
  if (!overlay || !content) return;

  content.innerHTML = `
    <h2>${area.label}</h2>
    <p>${area.desc}</p>
    <button class="popup-btn" id="btn-enter">▶ Enter</button>
    ${area.restingSpot ? `<button class="popup-btn" id="btn-sleep">🌙 Go to Sleep</button>` : ''}
  `;

  overlay.classList.remove('hidden');

  document.getElementById('btn-enter')?.addEventListener('click', () => {
    addSystemMsg(`You enter ${area.label}.`);
    closePopup();
  });

  document.getElementById('btn-sleep')?.addEventListener('click', () => {
    state.player.asleep = true;
    addSystemMsg(`You curl up in ${area.label} and fall asleep.`);
    updateHUD();
    closePopup();
  });
}

function closePopup() {
  state.popup = null;
  document.getElementById('popup-overlay')?.classList.add('hidden');
}

// ─── HUD & Helpers ────────────────────────────────────────────────────────────
function updateHUD() {
  const p = state.player;
  const nameEl = document.getElementById('hud-name');
  const rankEl = document.getElementById('hud-rank');
  if (nameEl) nameEl.textContent = p.name;
  if (rankEl) rankEl.textContent = p.rank;
}

function addSystemMsg(text) {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'chat-msg system';
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}
