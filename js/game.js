import { getMapCache, WORLD_W, WORLD_H, getDenAtPoint } from './map.js';
import { renderPlayer, SPEED } from './player.js';
import { renderDenInterior, renderSleepOverlay, getNestAtPoint, isLeaveBtn, isWakeBtn, canSleepOnNest } from './den.js';
import { getSprite, getSleepSprite } from './sprites.js';

// ─── Characters ──────────────────────────────────────────────────────────────
const CHARACTERS = [
  { name: 'Goldpelt', rank: 'warrior', color: '#FF8C00', sprite: 'sprites/goldpelt.png?v=3' },
  { name: 'Jadewind', rank: 'leader',  color: '#b87040', sprite: 'sprites/jadewind.png?v=3' },
];

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  player: {
    x: 1500, y: 1010,
    color: '#FF8C00',
    name: 'You',
    rank: 'kit',
    asleep: false,
    facing: 'right'
  },
  camera: { x: 0, y: 0 },
  keys: {},
  canvas: null,
  ctx: null,
  nearDen: null,
  popup: null,
  denView: null,      // area object when inside a den, null in world
  hoveredNest: -1,    // index of hovered nest (-1 = none)
  sleepingNestIdx: -1 // which nest the player is sleeping in
};

// ─── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('tribeCat');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      const charData = CHARACTERS.find(c => c.name === data.name);
      state.player.name  = data.name  || 'You';
      state.player.color = charData?.color || data.color || '#FF8C00';
      state.player.rank  = charData?.rank  || data.rank  || 'kit';
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
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
    // Escape leaves den
    if (e.key === 'Escape' && state.denView && !state.popup) exitDen();
  });
  window.addEventListener('keyup', e => { state.keys[e.key] = false; });

  state.canvas.addEventListener('click', handleClick);
  state.canvas.addEventListener('mousemove', handleMouseMove);

  document.getElementById('popup-close')?.addEventListener('click', closePopup);
  document.getElementById('popup-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'popup-overlay') closePopup();
  });

  updateHUD();
  initCharPanel();
  preloadSprites();
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
  // No world movement while in den or asleep
  if (state.denView || state.player.asleep || state.popup) return;

  const { keys, player } = state;
  let dx = 0, dy = 0;
  if (keys['ArrowLeft']  || keys['a'] || keys['A']) dx -= SPEED;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += SPEED;
  if (keys['ArrowUp']    || keys['w'] || keys['W']) dy -= SPEED;
  if (keys['ArrowDown']  || keys['s'] || keys['S']) dy += SPEED;
  if (dx && dy) { dx *= 0.707; dy *= 0.707; }
  if (dx < 0) player.facing = 'left';
  else if (dx > 0) player.facing = 'right';

  player.x = Math.max(60, Math.min(WORLD_W - 60, player.x + dx));
  player.y = Math.max(60, Math.min(WORLD_H - 60, player.y + dy));

  const cw = state.canvas.width, ch = state.canvas.height;
  state.camera.x = Math.max(0, Math.min(WORLD_W - cw, player.x - cw / 2));
  state.camera.y = Math.max(0, Math.min(WORLD_H - ch, player.y - ch / 2));

  // Den proximity prompt — only show if this character can enter
  const den = getDenAtPoint(player.x, player.y);
  state.nearDen = den;
  const prompt = document.getElementById('interaction-prompt');
  const promptText = document.getElementById('prompt-text');
  if (den && canEnterDen(den) && prompt && promptText) {
    promptText.textContent = `[Click] Enter ${den.label}`;
    prompt.classList.remove('hidden');
  } else if (prompt) {
    prompt.classList.add('hidden');
  }
}

function render() {
  const { ctx, canvas, camera, player, denView, hoveredNest } = state;
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (denView) {
    // Den interior — no camera offset, fixed viewport
    renderDenInterior(ctx, canvas.width, canvas.height, denView, player, hoveredNest, state.sleepingNestIdx);
    if (player.asleep) {
      renderSleepOverlay(ctx, canvas.width, canvas.height);
    }
  } else {
    ctx.translate(-camera.x, -camera.y);
    ctx.drawImage(getMapCache(), 0, 0);
    renderPlayer(ctx, player, true);
  }

  ctx.restore();
}

// ─── Click handler ────────────────────────────────────────────────────────────
function handleClick(e) {
  const rect = state.canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;
  const { canvas, player, denView } = state;
  const w = canvas.width, h = canvas.height;

  if (denView) {
    if (player.asleep) {
      // Only wake button works while sleeping
      if (isWakeBtn(sx, sy, w, h)) {
        player.asleep = false;
      }
      return;
    }

    if (isLeaveBtn(sx, sy, w, h)) {
      exitDen();
      return;
    }

    if (state.popup) return;

    const nestIdx = getNestAtPoint(sx, sy, w, h, denView.id);
    if (nestIdx >= 0 && canSleepOnNest(player.name, nestIdx, denView.id)) handleNestClick(nestIdx);
    return;
  }

  // ── World view ──
  if (state.popup) return;
  const wx = sx + state.camera.x;
  const wy = sy + state.camera.y;
  const den = getDenAtPoint(wx, wy);
  // Only enter if the player is also touching this den's entrance
  if (den && state.nearDen && den.id === state.nearDen.id) enterOrShowPopup(den);
}

function handleMouseMove(e) {
  const rect = state.canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;
  const { canvas, denView, player } = state;

  if (denView) {
    if (!player.asleep) {
      const raw = getNestAtPoint(sx, sy, canvas.width, canvas.height, denView.id);
      const idx = (raw >= 0 && canSleepOnNest(player.name, raw, denView.id)) ? raw : -1;
      if (idx !== state.hoveredNest) {
        state.hoveredNest = idx;
      }
      canvas.style.cursor = (idx >= 0 || isLeaveBtn(sx, sy, canvas.width, canvas.height)) ? 'pointer' : 'default';
    } else {
      canvas.style.cursor = isWakeBtn(sx, sy, canvas.width, canvas.height) ? 'pointer' : 'default';
    }
    return;
  }

  const wx = sx + state.camera.x;
  const wy = sy + state.camera.y;
  const hovered = getDenAtPoint(wx, wy);
  canvas.style.cursor = (hovered && state.nearDen && hovered.id === state.nearDen.id && canEnterDen(hovered)) ? 'pointer' : 'default';
}

// ─── Den transitions ──────────────────────────────────────────────────────────
function canEnterDen(area) {
  if (!area.restingSpot) return true; // popup-only areas always allowed
  const name = state.player.name.toLowerCase();
  const rank = state.player.rank;
  if (area.id === 'jadewind_den') return name === 'jadewind';
  if (area.id === 'deputy_den')   return rank === 'deputy';
  if (area.forRank)               return rank === area.forRank;
  return false;
}

function enterOrShowPopup(area) {
  if (area.restingSpot) {
    if (!canEnterDen(area)) return;
    state.denView = area;
    state.hoveredNest = -1;
    document.getElementById('interaction-prompt')?.classList.add('hidden');
  } else {
    showDenPopup(area);
  }
}

function exitDen() {
  state.denView = null;
  state.hoveredNest = -1;
  state.sleepingNestIdx = -1;
  state.player.asleep = false;
}

function handleNestClick(nestIdx) {
  state.sleepingNestIdx = nestIdx;
  const notes = getPlayerNotes();
  if (notes.length > 0) {
    showNotesPopup(notes);
  } else {
    state.player.asleep = true;
  }
}

function getPlayerNotes() {
  try { return JSON.parse(localStorage.getItem('playerNotes') || '[]'); }
  catch (_) { return []; }
}

// ─── Popups ───────────────────────────────────────────────────────────────────
function showNotesPopup(notes) {
  state.popup = 'notes';
  const overlay = document.getElementById('popup-overlay');
  const content = document.getElementById('popup-content');
  if (!overlay || !content) return;

  const noteItems = notes.map(n =>
    `<div style="background:#f0f8e0;border-left:3px solid #70c030;padding:7px 10px;margin-bottom:8px;border-radius:0 6px 6px 0;font-size:0.85rem;color:#2a5010;">
      <strong>${n.from || 'Unknown'}:</strong> ${n.text || ''}
    </div>`
  ).join('');

  content.innerHTML = `
    <h2>📜 Notes in your nest</h2>
    ${noteItems}
    <button class="popup-btn" id="btn-read-sleep">🌙 Read & Sleep</button>
    <button class="popup-btn" id="btn-skip-sleep">💤 Skip & Sleep</button>
  `;
  overlay.classList.remove('hidden');

  document.getElementById('btn-read-sleep')?.addEventListener('click', () => {
    closePopup();
    state.player.asleep = true;
  });
  document.getElementById('btn-skip-sleep')?.addEventListener('click', () => {
    closePopup();
    state.player.asleep = true;
  });
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
  `;
  overlay.classList.remove('hidden');

  document.getElementById('btn-enter')?.addEventListener('click', () => {
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

// ─── Sprite preload ───────────────────────────────────────────────────────────
function preloadSprites() {
  for (const char of CHARACTERS) {
    getSprite(char.name);
    getSleepSprite(char.name);
  }
}

// ─── Character Panel ──────────────────────────────────────────────────────────
function initCharPanel() {
  const btn = document.getElementById('char-toggle-btn');
  const panel = document.getElementById('char-panel');
  btn?.addEventListener('click', () => {
    const open = panel.classList.toggle('open');
    btn.classList.toggle('open', open);
  });
  renderCharPanel();
}

function renderCharPanel() {
  const list = document.getElementById('char-list');
  if (!list) return;
  list.innerHTML = '';
  for (const char of CHARACTERS) {
    const card = document.createElement('div');
    card.className = 'char-card' + (char.name === state.player.name ? ' active' : '');
    card.innerHTML = `
      <div class="char-portrait">
        <img src="${char.sprite}" alt="" onerror="this.style.display='none'">
      </div>
      <div class="char-info">
        <div class="char-name">${char.name}</div>
        <div class="char-rank">[${char.rank}]</div>
      </div>`;
    card.addEventListener('click', () => switchCharacter(char));
    list.appendChild(card);
  }
}

function switchCharacter(char) {
  // Reset den state so nest permissions re-evaluate for the new character
  if (state.denView) {
    state.player.asleep = false;
    state.sleepingNestIdx = -1;
    state.hoveredNest = -1;
  }
  state.player.name  = char.name;
  state.player.color = char.color;
  state.player.rank  = char.rank;
  localStorage.setItem('tribeCat', JSON.stringify({ name: char.name, color: char.color, rank: char.rank }));
  updateHUD();
  renderCharPanel();
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
