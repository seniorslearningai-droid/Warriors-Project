import { renderPlayer } from './player.js';
import { getSprite, getSleepSprite } from './sprites.js';

const CAT_SCALE = 2.8;

// ─── Nest layouts per den ─────────────────────────────────────────────────────

const WARRIORS_NESTS = [
  { x: 0.18, y: 0.46, name: 'Goldpelt' },
  { x: 0.38, y: 0.46, name: '' },
  { x: 0.62, y: 0.46, name: '' },
  { x: 0.82, y: 0.46, name: '' },
  { x: 0.28, y: 0.68, name: '' },
  { x: 0.72, y: 0.68, name: '' },
];

const JADEWIND_NESTS = [
  { x: 0.5, y: 0.50, name: 'Jadewind', large: true },
];

const NEST_R_FRAC = 0.068;

function getNests(denId) {
  if (denId === 'jadewind_den') return JADEWIND_NESTS;
  return WARRIORS_NESTS;
}

// ─── Main render ─────────────────────────────────────────────────────────────

export function renderDenInterior(ctx, w, h, den, player, hoveredNest, sleepingNestIdx = -1) {
  const nests = getNests(den.id);

  // Warm brown walls
  const wallGrad = ctx.createLinearGradient(0, 0, 0, h);
  wallGrad.addColorStop(0, '#2e1608');
  wallGrad.addColorStop(0.3, '#5a2e10');
  wallGrad.addColorStop(1, '#7a4820');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, w, h);

  // Ceiling beams
  drawBeams(ctx, w, h);

  // Torches
  const tx1 = w * 0.12, tx2 = w * 0.88, ty = h * 0.22;
  drawTorchGlow(ctx, tx1, ty, w, h);
  drawTorchGlow(ctx, tx2, ty, w, h);
  drawTorch(ctx, tx1, ty, h);
  drawTorch(ctx, tx2, ty, h);

  // Wood floor
  drawWoodFloor(ctx, w, h);

  // Nests
  const nr = w * NEST_R_FRAC;
  for (let i = 0; i < nests.length; i++) {
    const { x, y, name } = nests[i];
    drawNest(ctx, x * w, y * h, nr, i === hoveredNest, name, den.id === 'jadewind_den');
  }

  // Player awake → show at entrance; asleep → show sleeping sprite on their nest
  if (!player.asleep) {
    ctx.save();
    ctx.translate(w / 2, h * 0.83);
    const sprite = getSprite(player.name);
    if (sprite) {
      const sh = h * 0.22, sw = sh * 1.4;
      ctx.drawImage(sprite, -sw / 2, -sh * 0.75, sw, sh);
    } else {
      ctx.scale(CAT_SCALE, CAT_SCALE);
      renderPlayer(ctx, { ...player, x: 0, y: 0 }, true);
    }
    ctx.restore();
  } else if (sleepingNestIdx >= 0 && sleepingNestIdx < nests.length) {
    const { x, y, large } = nests[sleepingNestIdx];
    const sleepSprite = getSleepSprite(player.name);
    if (sleepSprite) {
      const size = nr * 2.6 * (large ? 1.5 : 1);
      ctx.drawImage(sleepSprite, x * w - size / 2, y * h - size * 0.55, size, size * 0.85);
    }
  }

  // Den title at top
  ctx.fillStyle = 'rgba(255,215,130,0.92)';
  ctx.font = `bold ${Math.round(h * 0.038)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 6;
  ctx.fillText(den.label, w / 2, h * 0.1);
  ctx.shadowBlur = 0;

  // Leave Den button — bottom-left, clear of the HUD
  drawLeaveBtn(ctx, w, h);
}

export function renderSleepOverlay(ctx, w, h) {
  ctx.fillStyle = 'rgba(8, 4, 1, 0.38)';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(220,230,255,0.7)';
  for (let i = 0; i < 22; i++) {
    const sx = lcg(i * 7 + 3, w);
    const sy = lcg(i * 7 + 11, h * 0.28);
    const sr = 0.7 + lcg(i * 7 + 17, 1.4);
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
  }

  drawWakeBtn(ctx, w, h);
}

// ─── Hit testing ─────────────────────────────────────────────────────────────

export function getNestAtPoint(sx, sy, w, h, denId = '') {
  const nests = getNests(denId);
  const r = w * NEST_R_FRAC;
  for (let i = 0; i < nests.length; i++) {
    const { x, y } = nests[i];
    if (Math.hypot(sx - x * w, sy - y * h) < r + 14) return i;
  }
  return -1;
}

export function isLeaveBtn(sx, sy, w, h) {
  const bw = 130, bh = Math.round(h * 0.056);
  const bx = 16, by = h - bh - 16;
  return sx >= bx && sx <= bx + bw && sy >= by && sy <= by + bh;
}

export function isWakeBtn(sx, sy, w, h) {
  const bw = 160, bh = Math.round(h * 0.065);
  const bx = (w - bw) / 2, by = h * 0.54;
  return sx >= bx && sx <= bx + bw && sy >= by && sy <= by + bh;
}

export function canSleepOnNest(playerName, nestIdx, denId = '') {
  const nests = getNests(denId);
  const nest = nests[nestIdx];
  if (!nest) return false;
  const name = playerName.toLowerCase();
  if (nest.name && nest.name.toLowerCase() !== name) return false;
  if (!nest.name && nests.some(n => n.name && n.name.toLowerCase() === name)) return false;
  return true;
}

// ─── Draw helpers ─────────────────────────────────────────────────────────────

function drawBeams(ctx, w, h) {
  ctx.fillStyle = '#1e0e04';
  ctx.fillRect(0, 0, w, h * 0.055);
  const beamW = 18;
  for (let i = 0; i <= 4; i++) {
    const bx = (i / 4) * w - beamW / 2;
    ctx.fillRect(bx, 0, beamW, h * 0.20);
  }
}

function drawTorch(ctx, x, y, h) {
  ctx.fillStyle = '#3a1e08';
  ctx.fillRect(x - 5, y, 10, h * 0.055);
  const grad = ctx.createRadialGradient(x, y, 2, x, y - h * 0.045, h * 0.065);
  grad.addColorStop(0, 'rgba(255,245,120,0.98)');
  grad.addColorStop(0.35, 'rgba(255,140,20,0.8)');
  grad.addColorStop(1, 'rgba(255,60,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(x, y - h * 0.03, h * 0.065, 0, Math.PI * 2); ctx.fill();
}

function drawTorchGlow(ctx, x, y, w, h) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, w * 0.42);
  grad.addColorStop(0, 'rgba(255,170,50,0.14)');
  grad.addColorStop(1, 'rgba(255,170,50,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawWoodFloor(ctx, w, h) {
  const fy = h * 0.74;
  ctx.fillStyle = '#7a4820';
  ctx.fillRect(0, fy, w, h - fy);

  ctx.strokeStyle = '#5a3010';
  ctx.lineWidth = 2;
  for (let y = fy; y < h; y += h * 0.065) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  for (let row = 0; row * h * 0.065 + fy < h; row++) {
    const off = (row % 2) * (w * 0.12);
    for (let x = -w * 0.12 + off; x < w; x += w * 0.22) {
      const y = fy + row * h * 0.065;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h * 0.065); ctx.stroke();
    }
  }
}

function drawNest(ctx, x, y, r, hovered, name, large = false) {
  const scale = large ? 1.5 : 1;
  const er = r * scale, ey = r * 0.6 * scale;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath(); ctx.ellipse(x + 5, y + 7, er, ey * 0.92, 0, 0, Math.PI * 2); ctx.fill();

  // Outer ring
  ctx.fillStyle = hovered ? '#b09030' : '#8a6520';
  ctx.beginPath(); ctx.ellipse(x, y, er, ey, 0, 0, Math.PI * 2); ctx.fill();

  // Inner bowl
  ctx.fillStyle = hovered ? '#e0c050' : '#c09838';
  ctx.beginPath(); ctx.ellipse(x, y, er * 0.68, ey * 0.70, 0, 0, Math.PI * 2); ctx.fill();

  // Straw lines
  ctx.strokeStyle = hovered ? '#a08018' : '#78540e';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * er * 0.18, y + Math.sin(angle) * ey * 0.18);
    ctx.lineTo(x + Math.cos(angle) * er * 0.62, y + Math.sin(angle) * ey * 0.62);
    ctx.stroke();
  }

  // Name on nest
  if (name) {
    const fontSize = Math.max(7, Math.round(r * (large ? 0.45 : 0.32)));
    ctx.font = `bold ${fontSize}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(60,30,5,0.85)';
    ctx.fillText(name, x, y + ey * 0.30 + fontSize * 0.35);
  }

  // Hover ring + tooltip
  if (hovered) {
    ctx.strokeStyle = 'rgba(255,220,60,0.75)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(x, y, er + 5, ey + 5, 0, 0, Math.PI * 2); ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Click to sleep', x, y - er - 8);
  }
}

function drawLeaveBtn(ctx, w, h) {
  const bw = 130, bh = Math.round(h * 0.056);
  const bx = 16, by = h - bh - 16;
  ctx.fillStyle = 'rgba(240,255,220,0.92)';
  rr(ctx, bx, by, bw, bh, 6); ctx.fill();
  ctx.strokeStyle = '#70c030'; ctx.lineWidth = 2;
  rr(ctx, bx, by, bw, bh, 6); ctx.stroke();
  ctx.fillStyle = '#2a6010';
  ctx.font = `bold ${Math.round(bh * 0.52)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText('◀ Leave Den', bx + bw / 2, by + bh * 0.70);
}

function drawWakeBtn(ctx, w, h) {
  const bw = 160, bh = Math.round(h * 0.065);
  const bx = (w - bw) / 2, by = h * 0.54;
  ctx.fillStyle = 'rgba(200,220,255,0.9)';
  rr(ctx, bx, by, bw, bh, 8); ctx.fill();
  ctx.strokeStyle = '#8090d0'; ctx.lineWidth = 2;
  rr(ctx, bx, by, bw, bh, 8); ctx.stroke();
  ctx.fillStyle = '#2030a0';
  ctx.font = `bold ${Math.round(bh * 0.5)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText('☀️ Wake Up', w / 2, by + bh * 0.68);
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}

function lcg(seed, max) {
  return ((1664525 * seed + 1013904223) % 2**32) / 2**32 * max;
}
