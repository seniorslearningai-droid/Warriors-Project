export const WORLD_W = 3000;
export const WORLD_H = 2000;

// Camp clearing bounds (used for area checks)
export const CAMP = { x: 880, y: 580, w: 1240, h: 860 };

export const MAP_AREAS = [
  {
    id: 'jadewind_den',
    label: "Jadewind's Den",
    x: 1780, y: 595, w: 265, h: 210,
    color: '#221e14', borderColor: '#4a3a20',
    entrance: { x: 1912, y: 805, r: 22 },
    restingSpot: { x: 1912, y: 700 },
    isLeaderDen: true,
    desc: "The den of Jadewind, leader and healer of the Tribe."
  },
  {
    id: 'deputy_den',
    label: "Deputy's Den",
    x: 955, y: 595, w: 265, h: 210,
    color: '#1e1d14', borderColor: '#3a3820',
    entrance: { x: 1087, y: 805, r: 22 },
    restingSpot: { x: 1087, y: 700 },
    isDeputyDen: true,
    desc: "The den of the Tribe's Deputy."
  },
  {
    id: 'meeting_rock',
    label: 'Meeting Rock',
    x: 1310, y: 620, w: 380, h: 155,
    color: '#2a2520', borderColor: '#4a4035',
    entrance: null,
    desc: "A great flat boulder where Jadewind addresses the Tribe."
  },
  {
    id: 'warrior_den',
    label: "Warriors' Den",
    x: 1930, y: 875, w: 240, h: 290,
    color: '#1e1a10', borderColor: '#3a3020',
    entrance: { x: 1930, y: 1020, r: 22 },
    restingSpot: { x: 2050, y: 1020 },
    forRank: 'warrior',
    desc: "Where the warriors of the Tribe rest and sleep."
  },
  {
    id: 'apprentice_den',
    label: "Apprentices' Den",
    x: 830, y: 875, w: 240, h: 290,
    color: '#181e10', borderColor: '#283820',
    entrance: { x: 1070, y: 1020, r: 22 },
    restingSpot: { x: 950, y: 1020 },
    forRank: 'apprentice',
    desc: "Where the apprentices of the Tribe rest and sleep."
  },
  {
    id: 'kit_den',
    label: "Kit's Den",
    x: 955, y: 1250, w: 235, h: 175,
    color: '#1e1510', borderColor: '#3a2a18',
    entrance: { x: 1072, y: 1250, r: 20 },
    restingSpot: { x: 1072, y: 1340 },
    forRank: 'kit',
    desc: "Where the kits of the Tribe stay safe and warm."
  },
  {
    id: 'elder_den',
    label: "Elders' Den",
    x: 1810, y: 1250, w: 235, h: 175,
    color: '#181a1c', borderColor: '#283040',
    entrance: { x: 1928, y: 1250, r: 20 },
    restingSpot: { x: 1928, y: 1340 },
    forRank: 'elder',
    desc: "Where the honored elders of the Tribe rest."
  },
  {
    id: 'fresh_kill',
    label: 'Fresh-kill Pile',
    x: 1365, y: 1090, w: 270, h: 180,
    color: '#1a1e10', borderColor: '#304020',
    entrance: null,
    desc: "The Tribe's food store — prey brought back from hunts."
  },
  {
    id: 'medicine',
    label: 'Medicine Stores',
    x: 2045, y: 595, w: 175, h: 200,
    color: '#101814', borderColor: '#1c3025',
    entrance: { x: 2132, y: 795, r: 18 },
    desc: "Jadewind's store of healing herbs and remedies."
  }
];

// Offscreen canvas cache — built once on first call
let _mapCache = null;

export function getMapCache() {
  if (_mapCache) return _mapCache;
  const oc = new OffscreenCanvas(WORLD_W, WORLD_H);
  const octx = oc.getContext('2d');
  renderMap(octx);
  _mapCache = oc;
  return _mapCache;
}

export function getDenAtPoint(wx, wy) {
  for (const area of MAP_AREAS) {
    if (!area.entrance) continue;
    const { x, y, r } = area.entrance;
    if (Math.hypot(wx - x, wy - y) < r + 14) return area;
  }
  return null;
}

// ─── Rendering ───────────────────────────────────────────────────────────────

// Pre-seeded tree positions (outside camp clearing)
const TREES = buildTrees(210);
const UNDERGROWTH = buildUndergrowth(320);
const DAPPLES = buildDapples(90);

export function renderMap(ctx) {
  // Forest floor base
  ctx.fillStyle = '#111a09';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  // Undergrowth texture
  drawUndergrowth(ctx);

  // Dappled light on forest floor
  drawDapples(ctx);

  // Stream
  drawStream(ctx);

  // Hunting trails (leading out of camp)
  drawTrails(ctx);

  // Camp clearing
  drawClearing(ctx);

  // Camp features / dens
  for (const area of MAP_AREAS) drawArea(ctx, area);

  // Trees on top (occlude anything behind them)
  drawTrees(ctx);

  // Territory border
  drawBorder(ctx);
}

function drawClearing(ctx) {
  // Main clearing — earthy dirt/leaf litter
  ctx.fillStyle = '#2e2616';
  rrect(ctx, CAMP.x, CAMP.y, CAMP.w, CAMP.h, 40);
  ctx.fill();

  // Inner clearing — slightly lighter in the center
  const cg = ctx.createRadialGradient(1500, 1010, 50, 1500, 1010, 520);
  cg.addColorStop(0, 'rgba(60,48,24,0.5)');
  cg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cg;
  rrect(ctx, CAMP.x, CAMP.y, CAMP.w, CAMP.h, 40);
  ctx.fill();

  // Clearing edge — soft shadow from trees
  ctx.strokeStyle = '#0d1508';
  ctx.lineWidth = 18;
  ctx.lineJoin = 'round';
  rrect(ctx, CAMP.x, CAMP.y, CAMP.w, CAMP.h, 40);
  ctx.stroke();

  // Pebble path around camp center (thin lighter ring)
  ctx.strokeStyle = '#3a3020';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(1500, 1010, 260, 190, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Label "Camp"
  ctx.fillStyle = 'rgba(160,130,60,0.25)';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('~ Camp ~', 1500, 1290);
}

function drawArea(ctx, area) {
  // Den body
  ctx.fillStyle = area.color;
  rrect(ctx, area.x, area.y, area.w, area.h, 10);
  ctx.fill();

  // Border
  ctx.strokeStyle = area.borderColor;
  ctx.lineWidth = 2;
  rrect(ctx, area.x, area.y, area.w, area.h, 10);
  ctx.stroke();

  // Label
  ctx.fillStyle = '#b89040';
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(area.label, area.x + area.w / 2, area.y + 20);

  // Entrance marker
  if (area.entrance) {
    const { x, y, r } = area.entrance;

    // Glow
    const g = ctx.createRadialGradient(x, y, 0, x, y, r + 10);
    g.addColorStop(0, 'rgba(180,140,40,0.45)');
    g.addColorStop(1, 'rgba(180,140,40,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r + 10, 0, Math.PI * 2); ctx.fill();

    // Circle
    ctx.fillStyle = '#5a3e10';
    ctx.strokeStyle = '#b89040';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#f0d060';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▶', x, y + 4);
  }

  // Resting spot (faint oval)
  if (area.restingSpot) {
    const { x, y } = area.restingSpot;
    ctx.fillStyle = 'rgba(120,90,30,0.2)';
    ctx.strokeStyle = 'rgba(160,120,40,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(x, y, 22, 14, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  }
}

function drawStream(ctx) {
  // Stream winds from top-left through the forest
  ctx.strokeStyle = '#0e2338';
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(350, 0);
  ctx.bezierCurveTo(400, 300, 280, 600, 350, 900);
  ctx.bezierCurveTo(420, 1100, 380, 1400, 500, 1700);
  ctx.lineTo(450, 2000);
  ctx.stroke();

  // Lighter water highlight
  ctx.strokeStyle = '#163050';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(350, 0);
  ctx.bezierCurveTo(400, 300, 280, 600, 350, 900);
  ctx.bezierCurveTo(420, 1100, 380, 1400, 500, 1700);
  ctx.lineTo(450, 2000);
  ctx.stroke();

  // Small pool where stream widens
  ctx.fillStyle = '#0e2338';
  ctx.strokeStyle = '#163050';
  ctx.lineWidth = 2;
  rrect(ctx, 270, 860, 200, 130, 20);
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = '#1a4060';
  ctx.font = 'italic 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Drinking Pool', 370, 930);
}

function drawTrails(ctx) {
  // Faint dirt trails leading from camp into forest
  ctx.strokeStyle = '#241e0e';
  ctx.lineWidth = 14;
  ctx.setLineDash([]);

  const trails = [
    // North trail
    [[1500, CAMP.y], [1500, 80]],
    // South trail
    [[1500, CAMP.y + CAMP.h], [1500, 1950]],
    // West trail (to stream/drinking pool)
    [[CAMP.x, 1010], [370, 930]],
    // East trail
    [[CAMP.x + CAMP.w, 1010], [2900, 800]],
    // Northeast
    [[CAMP.x + CAMP.w, CAMP.y], [2800, 200]],
  ];

  ctx.strokeStyle = '#221c0c';
  for (const pts of trails) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.stroke();
  }
}

function drawUndergrowth(ctx) {
  for (const u of UNDERGROWTH) {
    ctx.fillStyle = u.color;
    ctx.beginPath();
    ctx.ellipse(u.x, u.y, u.rx, u.ry, u.angle, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDapples(ctx) {
  for (const d of DAPPLES) {
    const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
    g.addColorStop(0, 'rgba(80,70,20,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
  }
}

function drawTrees(ctx) {
  for (const t of TREES) {
    // Skip trees inside the camp clearing (with margin)
    if (inCamp(t.x, t.y, 60)) continue;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(t.x + 6, t.y + 8, t.r * 0.9, t.r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Outer canopy
    ctx.fillStyle = t.dark;
    ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill();

    // Mid canopy
    ctx.fillStyle = t.mid;
    ctx.beginPath(); ctx.arc(t.x - t.r * 0.15, t.y - t.r * 0.1, t.r * 0.72, 0, Math.PI * 2); ctx.fill();

    // Highlight
    ctx.fillStyle = t.light;
    ctx.beginPath(); ctx.arc(t.x - t.r * 0.25, t.y - t.r * 0.25, t.r * 0.38, 0, Math.PI * 2); ctx.fill();
  }
}

function drawBorder(ctx) {
  // Thick dark tree-wall at world edges
  ctx.strokeStyle = '#070e04';
  ctx.lineWidth = 80;
  ctx.strokeRect(40, 40, WORLD_W - 80, WORLD_H - 80);

  // Territory marker stones along border (every ~200px)
  ctx.fillStyle = '#2a2820';
  ctx.strokeStyle = '#3a3825';
  ctx.lineWidth = 1;
  for (let x = 120; x < WORLD_W; x += 220) {
    stone(ctx, x, 55);
    stone(ctx, x, WORLD_H - 55);
  }
  for (let y = 120; y < WORLD_H; y += 220) {
    stone(ctx, 55, y);
    stone(ctx, WORLD_W - 55, y);
  }
}

function stone(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((x * 0.07) % (Math.PI * 2));
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inCamp(x, y, margin = 0) {
  return x > CAMP.x - margin && x < CAMP.x + CAMP.w + margin &&
         y > CAMP.y - margin && y < CAMP.y + CAMP.h + margin;
}

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Seeded tree data
function buildTrees(count) {
  const trees = [];
  const greens = [
    ['#0d1a08', '#152810', '#1e3814'],
    ['#0a1806', '#12220d', '#1a3010'],
    ['#0f1e0a', '#182e12', '#223e18'],
    ['#081405', '#10200b', '#182c0f'],
  ];
  for (let i = 0; i < count; i++) {
    const x = lcg(i * 3 + 1, WORLD_W);
    const y = lcg(i * 3 + 2, WORLD_H);
    const r = 28 + lcg(i * 3 + 3, 30);
    const g = greens[i % greens.length];
    trees.push({ x, y, r, dark: g[0], mid: g[1], light: g[2] });
  }
  return trees;
}

function buildUndergrowth(count) {
  const patches = [];
  const colors = ['#0c1708', '#0e1a09', '#101c0a', '#0b1507'];
  for (let i = 0; i < count; i++) {
    const x = lcg(i * 5 + 10, WORLD_W);
    const y = lcg(i * 5 + 20, WORLD_H);
    if (inCamp(x, y, 50)) continue;
    patches.push({
      x, y,
      rx: 20 + lcg(i * 5 + 30, 40),
      ry: 10 + lcg(i * 5 + 40, 20),
      angle: lcg(i * 5 + 50, 314) / 100,
      color: colors[i % colors.length]
    });
  }
  return patches;
}

function buildDapples(count) {
  const d = [];
  for (let i = 0; i < count; i++) {
    d.push({
      x: lcg(i * 7 + 3, WORLD_W),
      y: lcg(i * 7 + 11, WORLD_H),
      r: 40 + lcg(i * 7 + 17, 80)
    });
  }
  return d;
}

// Simple deterministic pseudo-random (LCG)
function lcg(seed, max) {
  const a = 1664525, c = 1013904223, m = 2 ** 32;
  return ((a * seed + c) % m) / m * max;
}
