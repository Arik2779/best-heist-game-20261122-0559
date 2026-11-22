// The Midnight Vault — the thief. Walk (WASD / arrows), run with Shift (fast
// but loud: guards inside the noise radius come to look), sneak with C or
// Control (slow, harder to spot), EMP with Q (limited charges), hack with E
// at the terminal. Movement collides against walls and cover as a circle.
import {
  EMP_CHARGES,
  NOISE_RUN_RADIUS,
  PLAYER_CROUCH_SPEED,
  PLAYER_RADIUS,
  PLAYER_RUN_SPEED,
  PLAYER_WALK_SPEED,
} from './config.js';
import { resolveCircleRect } from './vision.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = PLAYER_RADIUS;
    this.facing = -Math.PI / 2;
    this.crouched = false;
    this.running = false;
    this.moving = false;
    this.empCharges = EMP_CHARGES;
    this.stepTimer = 0;
    this.stepped = false;
  }

  get speed() {
    if (this.crouched) return PLAYER_CROUCH_SPEED;
    if (this.running) return PLAYER_RUN_SPEED;
    return PLAYER_WALK_SPEED;
  }

  // Radius guards can hear right now: running is loud, everything else is silent.
  get noiseRadius() {
    return this.running && this.moving ? NOISE_RUN_RADIUS : 0;
  }

  update(dt, input, blockers) {
    const dir = input.direction();
    this.crouched = input.crouchHeld();
    this.running = input.runHeld() && !this.crouched;
    this.moving = dir.x !== 0 || dir.y !== 0;
    if (!this.moving) {
      this.stepped = false;
      return;
    }
    const speed = this.speed;
    this.facing = Math.atan2(dir.y, dir.x);
    let nx = this.x + dir.x * speed * dt;
    let ny = this.y + dir.y * speed * dt;
    for (const rect of blockers) {
      const fixed = resolveCircleRect(nx, ny, this.radius, rect);
      nx = fixed.x;
      ny = fixed.y;
    }
    this.x = nx;
    this.y = ny;
    // Footstep tick: the audio engine plays one per step while the thief moves.
    this.stepTimer -= dt;
    if (this.stepTimer <= 0) {
      this.stepTimer = this.crouched ? 0.55 : this.running ? 0.26 : 0.38;
      this.stepped = true;
    } else {
      this.stepped = false;
    }
  }
}
