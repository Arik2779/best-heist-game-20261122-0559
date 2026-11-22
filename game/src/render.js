// The Midnight Vault — the renderer. One canvas, all procedural drawing: the
// bank floor, carpet and cover, guard and camera vision cones, the thief, the
// loot and the exit, the HUD with its alarm meter, and the title / caught /
// clear / win screens. Nothing is loaded from anywhere: every pixel is drawn.
import { PALETTE, VIEW_H, VIEW_W } from './config.js';
import {
  WORLD_STATE_CAUGHT,
  WORLD_STATE_LEVEL_CLEAR,
  WORLD_STATE_TITLE,
  WORLD_STATE_WIN,
} from './world.js';

const TILE = 80;

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    scale = Math.min(w / VIEW_W, h / VIEW_H);
    offsetX = (w - VIEW_W * scale) / 2;
    offsetY = (h - VIEW_H * scale) / 2;
  }

  function drawCone(x, y, facing, range, halfAngle, colour) {
    const grad = ctx.createRadialGradient(x, y, 8, x, y, range);
    grad.addColorStop(0, colour);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = colour.replace(/[\d.]+\)$/, '0.55)');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(facing - halfAngle) * range, y + Math.sin(facing - halfAngle) * range);
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(facing + halfAngle) * range, y + Math.sin(facing + halfAngle) * range);
    ctx.stroke();
  }

  function drawFloor(level) {
    for (let ty = 0; ty < VIEW_H / TILE; ty += 1) {
      for (let tx = 0; tx < VIEW_W / TILE; tx += 1) {
        ctx.fillStyle = (tx + ty) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
        ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
      }
    }
    ctx.strokeStyle = PALETTE.floorLine;
    ctx.lineWidth = 1;
    for (let x = 0; x <= VIEW_W; x += TILE) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, VIEW_H); ctx.stroke();
    }
    for (let y = 0; y <= VIEW_H; y += TILE) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW_W, y); ctx.stroke();
    }
    // Red carpet runner from the door to the vault: the thief's route, readable at a glance.
    ctx.fillStyle = PALETTE.carpet;
    ctx.fillRect(600, 120, 80, 656);
    ctx.strokeStyle = PALETTE.carpetEdge;
    ctx.lineWidth = 3;
    ctx.strokeRect(600, 120, 80, 656);
    // Warm light pools from the ceiling lamps.
    for (const [lx, ly] of [[320, 200], [960, 200], [320, 560], [960, 560], [640, 360]]) {
      const pool = ctx.createRadialGradient(lx, ly, 10, lx, ly, 150);
      pool.addColorStop(0, 'rgba(255, 214, 130, 0.10)');
      pool.addColorStop(1, 'rgba(255, 214, 130, 0)');
      ctx.fillStyle = pool;
      ctx.fillRect(lx - 150, ly - 150, 300, 300);
    }
  }

  function drawWalls(level) {
    for (const wall of [...level.walls, ...level.interiorWalls]) {
      ctx.fillStyle = PALETTE.wall;
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.fillStyle = PALETTE.wallTop;
      if (wall.h <= 24) ctx.fillRect(wall.x, wall.y, wall.w, 4);
      else ctx.fillRect(wall.x, wall.y, 4, wall.h);
    }
  }

  function drawCover(level) {
    for (const c of level.cover) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      if (c.kind === 'desk') {
        ctx.fillStyle = PALETTE.desk;
        ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.fillStyle = PALETTE.deskTop;
        ctx.fillRect(c.x + 5, c.y + 5, c.w - 10, c.h - 10);
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.fillRect(c.x + 12, c.y + 12, 26, 18);
        ctx.fillRect(c.x + c.w - 44, c.y + c.h - 26, 30, 14);
      } else {
        ctx.fillStyle = PALETTE.vaultBlock;
        ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.strokeStyle = PALETTE.vaultTrim;
        ctx.lineWidth = 2;
        ctx.strokeRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6);
        ctx.fillStyle = PALETTE.vaultTrim;
        ctx.beginPath();
        ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawLoot(world, time) {
    for (const loot of world.levelData.loot) {
      if (loot.taken) continue;
      const pulse = 0.6 + 0.4 * Math.sin(time * 3 + loot.x);
      if (loot.kind === 'vault') {
        const glow = ctx.createRadialGradient(loot.x, loot.y, 4, loot.x, loot.y, 60);
        glow.addColorStop(0, `rgba(245, 197, 66, ${0.5 * pulse})`);
        glow.addColorStop(1, 'rgba(245, 197, 66, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(loot.x - 60, loot.y - 60, 120, 120);
        ctx.fillStyle = PALETTE.gold;
        for (let i = 0; i < 3; i += 1) {
          ctx.save();
          ctx.translate(loot.x - 18 + i * 18, loot.y + 6 - i * 2);
          ctx.rotate(-0.25);
          ctx.fillRect(-11, -6, 22, 12);
          ctx.restore();
        }
        ctx.fillStyle = PALETTE.goldGlow;
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('VAULT', loot.x, loot.y - 26);
      } else {
        const glow = ctx.createRadialGradient(loot.x, loot.y, 2, loot.x, loot.y, 34);
        glow.addColorStop(0, `rgba(87, 230, 201, ${0.55 * pulse})`);
        glow.addColorStop(1, 'rgba(87, 230, 201, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(loot.x - 34, loot.y - 34, 68, 68);
        ctx.fillStyle = PALETTE.gem;
        ctx.beginPath();
        ctx.moveTo(loot.x, loot.y - 12);
        ctx.lineTo(loot.x + 10, loot.y);
        ctx.lineTo(loot.x, loot.y + 12);
        ctx.lineTo(loot.x - 10, loot.y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.moveTo(loot.x, loot.y - 12);
        ctx.lineTo(loot.x + 10, loot.y);
        ctx.lineTo(loot.x, loot.y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  function drawExit(world) {
    const exit = world.levelData.exit;
    const open = exit.open;
    ctx.fillStyle = open ? PALETTE.exitOpen : PALETTE.exitClosed;
    ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
    if (open) {
      const glow = ctx.createRadialGradient(exit.x + 40, exit.y, 4, exit.x + 40, exit.y, 90);
      glow.addColorStop(0, 'rgba(57, 217, 138, 0.5)');
      glow.addColorStop(1, 'rgba(57, 217, 138, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(exit.x - 50, exit.y - 90, 180, 90);
    }
    ctx.fillStyle = open ? '#062b16' : '#d8f5e3';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(open ? 'EXIT — OPEN' : 'EXIT — LOCKED', exit.x + exit.w / 2, exit.y - 10);
  }

  function drawTerminal(world) {
    const t = world.levelData.terminal;
    ctx.fillStyle = '#20263a';
    ctx.fillRect(t.x - 22, t.y - 16, 44, 32);
    ctx.strokeStyle = t.used ? '#555f7a' : PALETTE.gem;
    ctx.lineWidth = 2;
    ctx.strokeRect(t.x - 22, t.y - 16, 44, 32);
    ctx.fillStyle = t.used ? '#555f7a' : PALETTE.gem;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t.used ? 'HACKED' : 'HACK', t.x, t.y + 4);
    const near = Math.hypot(world.player.x - t.x, world.player.y - t.y) <= 70;
    if (near && !t.used && world.state === 'play') {
      ctx.fillStyle = '#e8ecf7';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText('Press E — hack all cameras', t.x, t.y - 28);
    }
  }

  function drawCameras(world) {
    for (const camera of world.cameras) {
      if (!camera.disabled) {
        drawCone(camera.x, camera.y, camera.angle, 285, 0.44,
          camera.spotted ? 'rgba(255, 90, 78, 0.34)' : 'rgba(255, 165, 60, 0.24)');
      }
      ctx.fillStyle = PALETTE.camera;
      ctx.beginPath();
      ctx.arc(camera.x, camera.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = camera.disabled ? '#666f85' : PALETTE.cameraLens;
      ctx.beginPath();
      ctx.arc(camera.x + Math.cos(camera.angle) * 5, camera.y + Math.sin(camera.angle) * 5, 4, 0, Math.PI * 2);
      ctx.fill();
      if (camera.disabled) {
        ctx.fillStyle = '#e8ecf7';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('OFF', camera.x, camera.y - 16);
      }
    }
  }

  function drawGuards(world) {
    for (const guard of world.guards) {
      drawCone(guard.x, guard.y, guard.facing, 215, 0.62, guard.coneColour());
      ctx.fillStyle = PALETTE.guard;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.guardTrim;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Cap brim shows which way the guard faces.
      ctx.fillStyle = PALETTE.guardTrim;
      ctx.beginPath();
      ctx.arc(guard.x + Math.cos(guard.facing) * 8, guard.y + Math.sin(guard.facing) * 8, 5, 0, Math.PI * 2);
      ctx.fill();
      // Suspicion: a "?" while wary, a "!" while hunting.
      if (guard.state === 'chase' || guard.state === 'alarm') {
        ctx.fillStyle = '#ff5a4e';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', guard.x, guard.y - 24);
      } else if (guard.suspicion > 0.3 || guard.state === 'investigate') {
        ctx.fillStyle = '#f5c542';
        ctx.font = 'bold 20px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', guard.x, guard.y - 24);
      }
      // Suspicion arc under a wary guard.
      if (guard.suspicion > 0.05 && guard.state !== 'chase' && guard.state !== 'alarm') {
        ctx.strokeStyle = '#f5c542';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(guard.x, guard.y, 21, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * guard.suspicion);
        ctx.stroke();
      }
    }
  }

  function drawPlayer(world) {
    const p = world.player;
    if (p.noiseRadius > 0) {
      ctx.strokeStyle = 'rgba(255, 90, 78, 0.5)';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.noiseRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255, 90, 78, 0.9)';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NOISE!', p.x, p.y - p.noiseRadius - 6);
    }
    const r = p.crouched ? 11 : p.radius;
    ctx.fillStyle = PALETTE.player;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.playerTrim;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = PALETTE.playerTrim;
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(p.facing) * (r - 3), p.y + Math.sin(p.facing) * (r - 3), 4, 0, Math.PI * 2);
    ctx.fill();
    if (p.crouched) {
      ctx.fillStyle = '#e8ecf7';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SNEAK', p.x, p.y - r - 8);
    }
  }

  function drawHud(world) {
    ctx.fillStyle = PALETTE.hudBack;
    ctx.fillRect(0, 0, VIEW_W, 56);
    ctx.fillStyle = PALETTE.hudText;
    ctx.textAlign = 'left';
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.fillText(world.levelData.name, 16, 24);
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.hudDim;
    ctx.fillText('Grab the gold, then reach the EXIT', 16, 44);

    // Loot counter.
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.fillText(`◆ LOOT ${world.lootCollected}/${world.levelData.loot.length}`, 400, 24);
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(`EMP ×${world.player.empCharges}  (Q)`, 400, 44);

    // Alarm meter: the big one, centre stage, labelled and segmented.
    const ax = 560;
    const ay = 14;
    const aw = 300;
    const ah = 22;
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(world.alarmActive ? 'ALARM!' : 'ALARM', ax + aw / 2, ay - 2 + 12);
    ctx.fillStyle = '#0b0e18';
    ctx.fillRect(ax, ay + 14, aw, ah);
    const frac = world.alarm / 100;
    ctx.fillStyle = frac < 0.45 ? PALETTE.alarmLow : frac < 0.8 ? PALETTE.alarmMid : PALETTE.alarmHigh;
    ctx.fillRect(ax + 2, ay + 16, (aw - 4) * frac, ah - 4);
    ctx.strokeStyle = world.alarmActive && Math.floor(world.time * 4) % 2 === 0 ? '#ff5a4e' : '#4a5470';
    ctx.lineWidth = 2;
    ctx.strokeRect(ax, ay + 14, aw, ah);
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(`${Math.round(world.alarm)}%`, ax + aw + 30, ay + 30);

    // Timer and score, right side.
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = 'bold 17px system-ui, sans-serif';
    const mins = Math.floor(world.time / 60);
    const secs = Math.floor(world.time % 60);
    ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, VIEW_W - 16, 24);
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.hudDim;
    ctx.fillText(`SCORE ${world.score}`, VIEW_W - 16, 44);

    // Bottom hint bar.
    ctx.fillStyle = 'rgba(8, 10, 18, 0.7)';
    ctx.fillRect(0, VIEW_H - 26, VIEW_W, 26);
    ctx.fillStyle = PALETTE.hudDim;
    ctx.font = '13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WASD / arrows move   •   SHIFT run (loud)   •   C sneak   •   Q EMP   •   E hack terminal   •   P pause', VIEW_W / 2, VIEW_H - 8);

    // Flash message under the HUD.
    if (world.messageTimer > 0 && world.message) {
      ctx.fillStyle = 'rgba(8, 10, 18, 0.85)';
      const mw = ctx.measureText(world.message).width + 32;
      ctx.fillRect((VIEW_W - mw) / 2, 66, mw, 30);
      ctx.fillStyle = '#ffe9a3';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(world.message, VIEW_W / 2, 86);
    }
  }

  function drawOverlay(title, lines, accent) {
    ctx.fillStyle = 'rgba(6, 8, 15, 0.78)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = accent;
    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.fillText(title, VIEW_W / 2, 300);
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = '20px system-ui, sans-serif';
    lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 350 + i * 34));
  }

  function draw(world, screen) {
    resize();
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    const time = world.time;
    drawFloor(world.levelData);
    drawWalls(world.levelData);
    drawCover(world.levelData);
    drawExit(world);
    drawTerminal(world);
    drawLoot(world, time);
    drawCameras(world);
    drawGuards(world);
    drawPlayer(world);
    // Soft vignette so the room reads as a night interior.
    const vig = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 320, VIEW_W / 2, VIEW_H / 2, 760);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    drawHud(world);

    if (screen === WORLD_STATE_TITLE) {
      drawOverlay('THE MIDNIGHT VAULT', [
        'A top-down heist: slip past the guards, blind the cameras, crack the vault, get out.',
        'Three floors. The vault loot opens the exit. Full alarm sends every guard at you.',
        '',
        'Press SPACE or click to start',
      ], PALETTE.gold);
    } else if (screen === WORLD_STATE_CAUGHT) {
      drawOverlay('CAUGHT!', [
        'A guard got hands on the thief. The vault keeps its gold — for now.',
        `Loot this floor: ${world.lootCollected}   •   Alarms raised: ${world.alarmsRaised}`,
        '',
        'Press R or SPACE to try the floor again',
      ], PALETTE.alarmHigh);
    } else if (screen === WORLD_STATE_LEVEL_CLEAR) {
      drawOverlay('CLEAN GETAWAY', [
        `${world.levelData.name} cleared — the crew slips out into the night.`,
        `Score so far: ${world.score}   •   Alarms raised: ${world.alarmsRaised}`,
        '',
        'Press SPACE for the next floor',
      ], PALETTE.exitOpen);
    } else if (screen === WORLD_STATE_WIN) {
      drawOverlay('THE PERFECT HEIST', [
        'All three floors cracked. The Midnight Vault is empty and the crew is gone.',
        `Final score: ${world.score}   •   Loot value: ${world.lootValue}   •   Alarms raised: ${world.alarmsRaised}`,
        '',
        'Press SPACE to run it back',
      ], PALETTE.gold);
    }
  }

  return { draw, resize };
}
