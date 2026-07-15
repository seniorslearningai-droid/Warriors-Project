export const WORLD_W = 3000;
export const WORLD_H = 2000;

// Camp clearing bounds (used for area checks)
export const CAMP = { x: 880, y: 580, w: 1240, h: 860 };

export const MAP_AREAS = [
  {
    id: 'jadewind_den',
    label: "Jadewind's Den",
    x: 1780, y: 595, w: 265, h: 210,
    color: '#7a5a2a', borderColor: '#e8c060',
    entrance: { x: 1912, y: 805, r: 22 },
    restingSpot: { x: 1912, y: 700 },
    isLeaderDen: true,
    desc: "The den of Jadewind, leader and healer of the Tribe."
  },
  {
    id: 'deputy_den',
    label: "Deputy's Den",
    x: 955, y: 595, w: 265, h: 210,
    color: '#6a5228', borderColor: '#c8a848',
    entrance: { x: 1087, y: 805, r: 22 },
    restingSpot: { x: 1087, y: 700 },
    isDeputyDen: true,
    desc: "The den of the Tribe's Deputy."
  },
  {
    id: 'meeting_rock',
    label: 'Meeting Rock',
    x: 1310, y: 620, w: 380, h: 155,
    color: '#b09878', borderColor: '#d0b890',
    entrance: null,
    desc: "A great flat boulder where Jadewind addresses the Tribe."
  },
  {
    id: 'warrior_den',
    label: "Warriors' Den",
    x: 1930, y: 875, w: 240, h: 290,
    color: '#5a4820', borderColor: '#a08838',
    entrance: { x: 1930, y: 1020, r: 22 },
    restingSpot: { x: 2050, y: 1020 },
    forRank: 'warrior',
    desc: "Where the warriors of the Tribe rest and sleep."
  },
  {
    id: 'apprentice_den',
    label: "Apprentices' Den",
    x: 830, y: 875, w: 240, h: 290,
    color: '#3a5a28', borderColor: '#70aa48',
    entrance: { x: 1070, y: 1020, r: 22 },
    restingSpot: { x: 950, y: 1020 },
    forRank: 'apprentice',
    desc: "Where the apprentices of the Tribe rest and sleep."
  },
  {
    id: 'kit_den',
    label: "Kit's Den",
    x: 955, y: 1250, w: 235, h: 175,
    color: '#7a4a30', borderColor: '#e08858',
    entrance: { x: 1072, y: 1250, r: 20 },
    restingSpot: { x: 1072, y: 1340 },
    forRank: 'kit',
    desc: "Where the kits of the Tribe stay safe and warm."
  },
  {
    id: 'elder_den',
    label: "Elders' Den",
    x: 1810, y: 1250, w: 235, h: 175,
    color: '#607060', borderColor: '#a0b090',
    entrance: { x: 1928, y: 1250, r: 20 },
    restingSpot: { x: 1928, y: 1340 },
    forRank: 'elder',
    desc: "Where the honored elders of the Tribe rest."
  },
  {
    id: 'fresh_kill',
    label: 'Fresh-kill Pile',
    x: 1365, y: 1090, w: 270, h: 180,
    color: '#4a7030', borderColor: '#80b858',
    entrance: null,
    desc: "The Tribe's food store — prey brought back from hunts."
  },
  {
    id: 'medicine',
    label: 'Medicine Stores',
    x: 2045, y: 595, w: 175, h: 200,
    color: '#3a6848', borderColor: '#68c080',
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
  // Bright forest floor base
  ctx.fillStyle = '#3a8c1a';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  // Undergrowth texture
  drawUndergrowth(ctx);

  // Sunbeam dapples on forest floor
  drawDapples(ctx);

  // Stream
  drawStream(ctx);

  // Hunting trails
  drawTrails(ctx);

  // Camp clearing
  drawClearing(ctx);

  // Flowers scattered around
  drawFlowers(ctx);

  // Camp features / dens
  for (const area of MAP_AREAS) drawArea(ctx, area);

  // Trees on top
  drawTrees(ctx);

  // Territory border
  drawBorder(ctx);
}

function drawClearing(ctx) {
  // Warm sunny grass clearing
  ctx.fillStyle = '#8ab030';
  rrect(ctx, CAMP.x, CAMP.y, CAMP.w, CAMP.h, 40);
  ctx.fill();

  // Sunlit center glow
  const cg = ctx.createRadialGradient(1500, 1010, 60, 1500, 1010, 520);
  cg.addColorStop(0, 'rgba(255,230,100,0.28)');
  cg.addColorStop(1, 'rgba(255,230,100,0)');
  ctx.fillStyle = cg;
  rrect(ctx, CAMP.x, CAMP.y, CAMP.w, CAMP.h, 40);
  ctx.fill();

  // Soft edge ring from surrounding trees
  ctx.strokeStyle = '#2a7010';
  ctx.lineWidth = 14;
  ctx.lineJoin = 'round';
  rrect(ctx, CAMP.x, CAMP.y, CAMP.w, CAMP.h, 40);
  ctx.stroke();

  // Pebble path around camp center
  ctx.strokeStyle = '#c8b060';
  ctx.lineWidth = 5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.ellipse(1500, 1010, 260, 190, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Label
  ctx.fillStyle = 'rgba(80,120,20,0.4)';
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
  ctx.lineWidth = 2.5;
  rrect(ctx, area.x, area.y, area.w, area.h, 10);
  ctx.stroke();

  // Label
  ctx.fillStyle = '#5a3a10';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(area.label, area.x + area.w / 2, area.y + 22);

  // Entrance marker
  if (area.entrance) {
    const { x, y, r } = area.entrance;

    // Glow
    const g = ctx.createRadialGradient(x, y, 0, x, y, r + 12);
    g.addColorStop(0, 'rgba(100,220,80,0.6)');
    g.addColorStop(1, 'rgba(100,220,80,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r + 12, 0, Math.PI * 2); ctx.fill();

    // Circle
    ctx.fillStyle = '#2a7a10';
    ctx.strokeStyle = '#80e040';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▶', x, y + 4);
  }

  // Resting spot (faint cozy oval)
  if (area.restingSpot) {
    const { x, y } = area.restingSpot;
    ctx.fillStyle = 'rgba(200,160,80,0.25)';
    ctx.strokeStyle = 'rgba(200,160,80,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(x, y, 22, 14, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  }
}

function drawStream(ctx) {
  // Stream base (wide, bright blue)
  ctx.strokeStyle = '#40a0e8';
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(350, 0);
  ctx.bezierCurveTo(400, 300, 280, 600, 350, 900);
  ctx.bezierCurveTo(420, 1100, 380, 1400, 500, 1700);
  ctx.lineTo(450, 2000);
  ctx.stroke();

  // Water shimmer highlight
  ctx.strokeStyle = '#80d0ff';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(350, 0);
  ctx.bezierCurveTo(400, 300, 280, 600, 350, 900);
  ctx.bezierCurveTo(420, 1100, 380, 1400, 500, 1700);
  ctx.lineTo(450, 2000);
  ctx.stroke();

  // Drinking pool
  ctx.fillStyle = '#50b8f0';
  ctx.strokeStyle = '#80d8ff';
  ctx.lineWidth = 3;
  rrect(ctx, 260, 855, 220, 140, 24);
  ctx.fill(); ctx.stroke();

  // Ripple
  ctx.strokeStyle = 'rgba(180,230,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(370, 925, 55, 22, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#1870b0';
  ctx.font = 'italic 12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Drinking Pool', 370, 930);
}

function drawTrails(ctx) {
  // Warm sandy dirt trails
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const trails = [
    [[1500, CAMP.y], [1500, 80]],
    [[1500, CAMP.y + CAMP.h], [1500, 1950]],
    [[CAMP.x, 1010], [370, 930]],
    [[CAMP.x + CAMP.w, 1010], [2900, 800]],
    [[CAMP.x + CAMP.w, CAMP.y], [2800, 200]],
  ];

  // Trail shadow
  ctx.strokeStyle = '#4a7a20';
  ctx.lineWidth = 18;
  for (const pts of trails) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.stroke();
  }
  // Trail surface
  ctx.strokeStyle = '#c8a850';
  ctx.lineWidth = 10;
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
    g.addColorStop(0, 'rgba(255,240,120,0.18)');
    g.addColorStop(1, 'rgba(255,240,120,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
  }
}

function drawFlowers(ctx) {
  const colors = ['#ff6688', '#ffcc00', '#ff88bb', '#ffffff', '#ffaa44', '#cc88ff'];
  for (let i = 0; i < 120; i++) {
    const x = lcg(i * 11 + 7, WORLD_W);
    const y = lcg(i * 11 + 3, WORLD_H);
    if (inCamp(x, y, 30)) continue;
    const c = colors[i % colors.length];
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    // Petals
    for (let p = 0; p < 5; p++) {
      const angle = (p / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * 4, y + Math.sin(angle) * 4, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawTrees(ctx) {
  for (const t of TREES) {
    if (inCamp(t.x, t.y, 60)) continue;

    // Soft shadow
    ctx.fillStyle = 'rgba(0,60,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(t.x + 5, t.y + 7, t.r * 0.9, t.r * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Outer canopy
    ctx.fillStyle = t.dark;
    ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill();

    // Mid canopy
    ctx.fillStyle = t.mid;
    ctx.beginPath(); ctx.arc(t.x - t.r * 0.14, t.y - t.r * 0.1, t.r * 0.72, 0, Math.PI * 2); ctx.fill();

    // Sunlit highlight
    ctx.fillStyle = t.light;
    ctx.beginPath(); ctx.arc(t.x - t.r * 0.26, t.y - t.r * 0.26, t.r * 0.38, 0, Math.PI * 2); ctx.fill();
  }
}

function drawBorder(ctx) {
  // Dense tree-wall border
  ctx.strokeStyle = '#1a5a08';
  ctx.lineWidth = 90;
  ctx.strokeRect(45, 45, WORLD_W - 90, WORLD_H - 90);

  // Bright inner edge
  ctx.strokeStyle = '#2d8012';
  ctx.lineWidth = 12;
  ctx.strokeRect(45, 45, WORLD_W - 90, WORLD_H - 90);

  // Territory marker — small flower clusters at border
  for (let x = 120; x < WORLD_W; x += 200) {
    flowerCluster(ctx, x, 60);
    flowerCluster(ctx, x, WORLD_H - 60);
  }
  for (let y = 120; y < WORLD_H; y += 200) {
    flowerCluster(ctx, 60, y);
    flowerCluster(ctx, WORLD_W - 60, y);
  }
}

function flowerCluster(ctx, x, y) {
  const colors = ['#ff6688','#ffcc00','#ff88bb','#ffffff'];
  ctx.fillStyle = colors[Math.floor((x + y) / 50) % colors.length];
  ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffee88';
  ctx.beginPath(); ctx.arc(x + 8, y - 4, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x - 6, y + 5, 3, 0, Math.PI * 2); ctx.fill();
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
    ['#2a7a10', '#44a020', '#70cc30'],
    ['#259010', '#3aaa1a', '#60c828'],
    ['#208c18', '#38a422', '#5ec030'],
    ['#2e8214', '#4aaa24', '#72cc38'],
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
  const colors = ['#2e7a14', '#348a18', '#2e8010', '#389018'];
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
