import { getSprite } from './sprites.js';

export const SPEED = 3;

export const RANK_COLORS = {
  kit: '#ffcc00', apprentice: '#44aaff', warrior: '#44cc44',
  deputy: '#ff8800', elder: '#aaaaaa', leader: '#cc44ff'
};

export function renderPlayer(ctx, player, isLocal) {
  const { x, y, color = '#FF8C00', name = '?', rank = 'kit', asleep } = player;
  ctx.save();
  ctx.translate(x, y);

  const sprite = getSprite(name);
  if (sprite) {
    // Photo sprite — draw slightly wider than tall to match cat proportions
    const sw = 46, sh = 32;
    ctx.drawImage(sprite, -sw / 2, -sh / 2, sw, sh);
    if (asleep) {
      ctx.fillStyle = '#9090ff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('z z', sw / 2 - 4, -sh / 2 - 4);
    }
  } else {
    drawCatShape(ctx, color, isLocal, asleep);
  }

  // Name tag always drawn on top
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  const tagY = -22;
  const tw = ctx.measureText(name).width + 10;
  ctx.fillStyle = isLocal ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.45)';
  ctx.fillRect(-tw / 2, tagY - 12, tw, 14);
  ctx.fillStyle = isLocal ? '#ffffff' : '#e0e0e0';
  ctx.fillText(name, 0, tagY);
  ctx.fillStyle = RANK_COLORS[rank] || '#ffffff';
  ctx.font = '8px sans-serif';
  ctx.fillText(`[${rank}]`, 0, tagY - 13);

  ctx.restore();
}

function drawCatShape(ctx, color, isLocal, asleep) {
  const lighter = shiftColor(color, 45);

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath(); ctx.ellipse(1, 14, 13, 5, 0, 0, Math.PI * 2); ctx.fill();

  // Tail
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(10, 5);
  ctx.quadraticCurveTo(24, -3, 17, -17);
  ctx.stroke();

  // Body
  ctx.fillStyle = color;
  ctx.strokeStyle = isLocal ? '#ffffff' : 'rgba(0,0,0,0.45)';
  ctx.lineWidth = isLocal ? 2 : 1;
  ctx.beginPath(); ctx.ellipse(0, 6, 13, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Head
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(0, -7, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Ears
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
  drawEar(ctx, -7, -13, -4, -22, -1, -14, color);
  drawEar(ctx, 7, -13, 4, -22, 1, -14, color);
  drawEar(ctx, -6, -14.5, -4, -20, -2, -15, lighter);
  drawEar(ctx, 6, -14.5, 4, -20, 2, -15, lighter);

  // Eyes
  ctx.fillStyle = '#181818';
  ctx.beginPath(); ctx.ellipse(-3, -8, 2.2, 1.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(3, -8, 2.2, 1.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath(); ctx.arc(-2.3, -8.5, 0.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(3.7, -8.5, 0.8, 0, Math.PI * 2); ctx.fill();

  // Nose
  ctx.fillStyle = '#cc5577';
  ctx.beginPath(); ctx.arc(0, -5.5, 1.3, 0, Math.PI * 2); ctx.fill();

  if (asleep) {
    ctx.fillStyle = '#9090ff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('z z', 13, -18);
  }
}

function drawEar(ctx, x1, y1, x2, y2, x3, y3, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
  ctx.closePath(); ctx.fill(); ctx.stroke();
}

function shiftColor(hex, amt) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (n >> 16) + amt);
  const g = Math.min(255, ((n >> 8) & 0xff) + amt);
  const b = Math.min(255, (n & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
}
