// The Midnight Vault — the world: one level's state, the detection rules and
// the win / caught flow. Each frame it moves the thief, the guards and the
// cameras, then asks who can see the thief: a guard cone or a camera cone with
// a clear sight line raises the alarm; hiding lets it cool. A full alarm
// sends every guard converging and locks the cameras on the thief, and the
// thief gets one chance to break line of sight and cool it back down —
// caught only when a hunting guard actually reaches the thief.
import {
  ALARM_ACTIVE_DECAY,
  ALARM_COOLDOWN_END,
  ALARM_DECAY,
  CAMERA_ALARM_RISE,
  CATCH_DISTANCE,
  CROUCH_CONE_FACTOR,
  EMP_RADIUS,
  EMP_SECONDS,
  GUARD_ALARM_RISE,
  GUARD_CONE_HALF_ANGLE,
  GUARD_CONE_RANGE,
  GUARD_SUSPICION_FALL,
  GUARD_SUSPICION_RISE,
  CAMERA_CONE_HALF_ANGLE,
  CAMERA_CONE_RANGE,
  LOOT_PICKUP_DISTANCE,
  TERMINAL_DISABLE_SECONDS,
} from './config.js';
import { buildLevel, LEVEL_COUNT } from './level.js';
import { Guard, GUARD_STATE_ALARM, GUARD_STATE_CHASE } from './guards.js';
import { Camera } from './cameras.js';
import { Player } from './player.js';
import { hasLineOfSight, pointInCone } from './vision.js';

export const WORLD_STATE_TITLE = 'title';
export const WORLD_STATE_PLAY = 'play';
export const WORLD_STATE_CAUGHT = 'caught';
export const WORLD_STATE_LEVEL_CLEAR = 'levelclear';
export const WORLD_STATE_WIN = 'win';

export class World {
  constructor() {
    this.levelIndex = 0;
    this.state = WORLD_STATE_TITLE;
    this.time = 0;
    this.alarm = 0;
    this.alarmActive = false;
    this.alarmsRaised = 0;
    this.lootCollected = 0;
    this.lootValue = 0;
    this.score = 0;
    this.totalLootValue = 0;
    this.best = 0;
    this.message = '';
    this.messageTimer = 0;
    this.sound = null;
    this.reset(0);
  }

  get level() {
    return this.levelData;
  }

  get blockers() {
    return this.solidRects;
  }

  reset(levelIndex) {
    this.levelIndex = levelIndex;
    this.levelData = buildLevel(levelIndex);
    this.solidRects = [
      ...this.levelData.walls,
      ...this.levelData.interiorWalls,
      ...this.levelData.cover,
    ];
    this.player = new Player(this.levelData.playerStart.x, this.levelData.playerStart.y);
    this.guards = this.levelData.guards.map((g) => new Guard(g));
    this.cameras = this.levelData.cameras.map((c) => new Camera(c));
    this.alarm = 0;
    this.alarmActive = false;
    this.lootCollected = 0;
    this.lootValue = 0;
    this.time = 0;
    this.message = '';
    this.messageTimer = 0;
    this.state = WORLD_STATE_TITLE;
    this.totalLootValue = this.levelData.loot.reduce((sum, l) => sum + l.value, 0);
    if (this.sound) this.sound.stopAlarmLoop();
  }

  startLevel() {
    this.state = WORLD_STATE_PLAY;
    this.time = 0;
  }

  restartLevel() {
    const keptScore = this.score;
    const keptAlarms = this.alarmsRaised;
    this.reset(this.levelIndex);
    this.score = keptScore;
    this.alarmsRaised = keptAlarms;
    this.state = WORLD_STATE_PLAY;
  }

  nextLevel() {
    if (this.levelIndex + 1 >= LEVEL_COUNT) {
      this.state = WORLD_STATE_WIN;
      if (this.sound) this.sound.winJingle();
      return;
    }
    const keptScore = this.score;
    const keptAlarms = this.alarmsRaised;
    this.reset(this.levelIndex + 1);
    this.score = keptScore;
    this.alarmsRaised = keptAlarms;
    this.state = WORLD_STATE_PLAY;
  }

  flash(message, seconds) {
    this.message = message;
    this.messageTimer = seconds;
  }

  guardSeesThief(guard) {
    const range = GUARD_CONE_RANGE * (this.player.crouched ? CROUCH_CONE_FACTOR : 1);
    if (!pointInCone(guard.x, guard.y, guard.facing, range, GUARD_CONE_HALF_ANGLE, this.player.x, this.player.y)) return false;
    return hasLineOfSight(guard.x, guard.y, this.player.x, this.player.y, this.solidRects);
  }

  cameraSeesThief(camera) {
    if (camera.disabled) return false;
    const range = CAMERA_CONE_RANGE * (this.player.crouched ? CROUCH_CONE_FACTOR : 1);
    if (!pointInCone(camera.x, camera.y, camera.angle, range, CAMERA_CONE_HALF_ANGLE, this.player.x, this.player.y)) return false;
    return hasLineOfSight(camera.x, camera.y, this.player.x, this.player.y, this.solidRects);
  }

  useEmp() {
    if (this.state !== WORLD_STATE_PLAY) return;
    if (this.player.empCharges <= 0) {
      this.flash('No EMP charges left — find the hack terminal.', 2);
      return;
    }
    this.player.empCharges -= 1;
    let hit = 0;
    for (const camera of this.cameras) {
      if (Math.hypot(camera.x - this.player.x, camera.y - this.player.y) <= EMP_RADIUS) {
        camera.disableFor(EMP_SECONDS);
        hit += 1;
      }
    }
    if (this.sound) this.sound.empZap();
    this.flash(hit > 0 ? `EMP burst — ${hit} camera${hit > 1 ? 's' : ''} blind for ${EMP_SECONDS}s.` : 'EMP burst — no camera in range.', 2);
  }

  useTerminal() {
    if (this.state !== WORLD_STATE_PLAY) return;
    const t = this.levelData.terminal;
    if (t.used) {
      this.flash('Terminal already used this floor.', 2);
      return;
    }
    if (Math.hypot(t.x - this.player.x, t.y - this.player.y) > 70) {
      this.flash('Get closer to the hack terminal.', 2);
      return;
    }
    t.used = true;
    for (const camera of this.cameras) camera.disableFor(TERMINAL_DISABLE_SECONDS);
    if (this.sound) this.sound.hackBlip();
    this.flash(`Terminal hacked — all cameras blind for ${TERMINAL_DISABLE_SECONDS}s.`, 2.5);
  }

  update(dt, input) {
    if (this.state !== WORLD_STATE_PLAY) {
      // The room still lives behind the title: guards keep their patrol.
      for (const guard of this.guards) guard.update(dt, this.player);
      for (const camera of this.cameras) camera.update(dt, false, null);
      return;
    }
    this.time += dt;
    if (this.messageTimer > 0) this.messageTimer -= dt;

    this.player.update(dt, input, this.solidRects);
    if (this.player.stepped && this.sound) this.sound.footstep(this.player.crouched, this.player.running);

    // Running is loud: guards inside the noise radius come to look.
    if (this.player.noiseRadius > 0) {
      for (const guard of this.guards) {
        if (Math.hypot(guard.x - this.player.x, guard.y - this.player.y) <= this.player.noiseRadius) {
          guard.hearNoise(this.player.x, this.player.y);
        }
      }
    }

    let seenByGuard = false;
    let seenByCamera = false;
    for (const guard of this.guards) {
      if (this.guardSeesThief(guard)) {
        seenByGuard = true;
        guard.spotThief(this.player.x, this.player.y);
        guard.suspicion = Math.min(1, guard.suspicion + GUARD_SUSPICION_RISE * dt);
        this.alarm = Math.min(100, this.alarm + GUARD_ALARM_RISE * dt);
      } else {
        guard.suspicion = Math.max(0, guard.suspicion - GUARD_SUSPICION_FALL * dt);
      }
    }
    for (const camera of this.cameras) {
      camera.spotted = false;
      if (this.cameraSeesThief(camera)) {
        seenByCamera = true;
        camera.spotted = true;
        this.alarm = Math.min(100, this.alarm + CAMERA_ALARM_RISE * dt);
        if (this.sound) this.sound.cameraBeep();
      }
    }

    if (!seenByGuard && !seenByCamera) {
      this.alarm = Math.max(0, this.alarm - (this.alarmActive ? ALARM_ACTIVE_DECAY : ALARM_DECAY) * dt);
    }

    if (this.alarm >= 100 && !this.alarmActive) {
      this.alarmActive = true;
      this.alarmsRaised += 1;
      for (const guard of this.guards) guard.raiseAlarm(this.player.x, this.player.y);
      if (this.sound) {
        this.sound.alertSting();
        this.sound.startAlarmLoop();
      }
      this.flash('ALARM! Break line of sight and stay hidden to cool it down.', 3);
    }
    if (this.alarmActive && this.alarm <= ALARM_COOLDOWN_END) {
      this.alarmActive = false;
      for (const guard of this.guards) guard.calmDown();
      if (this.sound) this.sound.stopAlarmLoop();
      this.flash('Alarm cooled down. Stay quiet.', 2);
    }

    for (const guard of this.guards) guard.update(dt, this.player);
    for (const camera of this.cameras) camera.update(dt, this.alarmActive, this.player);

    // Caught: a hunting guard (chasing, investigating or on alarm) reaches the thief.
    for (const guard of this.guards) {
      const dist = Math.hypot(guard.x - this.player.x, guard.y - this.player.y);
      if (dist < CATCH_DISTANCE && (guard.state === GUARD_STATE_CHASE || guard.state === GUARD_STATE_ALARM)) {
        this.state = WORLD_STATE_CAUGHT;
        if (this.sound) {
          this.sound.stopAlarmLoop();
          this.sound.caughtBuzz();
        }
        return;
      }
      if (dist < CATCH_DISTANCE && guard.state !== 'patrol') {
        guard.suspicion = 1;
      }
    }

    // Loot: walk over it to pocket it. The vault loot opens the exit.
    for (const loot of this.levelData.loot) {
      if (loot.taken) continue;
      if (Math.hypot(loot.x - this.player.x, loot.y - this.player.y) <= LOOT_PICKUP_DISTANCE) {
        loot.taken = true;
        this.lootCollected += 1;
        this.lootValue += loot.value;
        if (this.sound) this.sound.lootClink();
        if (loot.kind === 'vault') {
          this.levelData.exit.open = true;
          if (this.sound) this.sound.doorOpen();
          this.flash('Vault cracked! The exit door is open — get out!', 3);
        } else {
          this.flash(`Pocketed the ${loot.label}.`, 1.6);
        }
      }
    }

    // Exit: only open once the vault loot is taken.
    const exit = this.levelData.exit;
    if (exit.open) {
      const px = Math.max(exit.x, Math.min(this.player.x, exit.x + exit.w));
      const py = Math.max(exit.y, Math.min(this.player.y, exit.y + exit.h));
      if (Math.hypot(this.player.x - px, this.player.y - py) <= this.player.radius + 6) {
        const timeBonus = Math.max(0, Math.round((this.levelData.par - this.time) * 10));
        this.score += this.lootValue * 1000 + timeBonus - this.alarmsRaised * 250;
        if (this.score < 0) this.score = 0;
        if (this.levelIndex + 1 >= LEVEL_COUNT) {
          this.state = WORLD_STATE_WIN;
          if (this.sound) this.sound.winJingle();
        } else {
          this.state = WORLD_STATE_LEVEL_CLEAR;
        }
      }
    }
  }
}
