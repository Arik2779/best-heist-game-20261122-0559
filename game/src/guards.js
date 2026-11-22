// The Midnight Vault — guards. A guard walks a waypoint patrol, pauses at each
// end to look around, grows suspicious while the thief is in its cone, chases
// the last place it saw the thief, investigates a noise, and during a full
// alarm converges on the thief. Suspicion and the alarm are driven by world.js.
import {
  GUARD_CHASE_SECONDS,
  GUARD_CHASE_SPEED,
  GUARD_PATROL_SPEED,
  GUARD_WAIT_SECONDS,
} from './config.js';
import { angleDifference } from './vision.js';

export const GUARD_STATE_PATROL = 'patrol';
export const GUARD_STATE_SUSPICIOUS = 'suspicious';
export const GUARD_STATE_CHASE = 'chase';
export const GUARD_STATE_INVESTIGATE = 'investigate';
export const GUARD_STATE_ALARM = 'alarm';

export class Guard {
  constructor(def) {
    this.x = def.x;
    this.y = def.y;
    this.waypoints = def.waypoints;
    this.waypointIndex = 1;
    this.speed = def.speed || GUARD_PATROL_SPEED;
    this.facing = Math.PI / 2;
    this.state = GUARD_STATE_PATROL;
    this.suspicion = 0;
    this.waitTimer = 0;
    this.chaseTimer = 0;
    this.lastSeenX = this.x;
    this.lastSeenY = this.y;
    this.investigateX = this.x;
    this.investigateY = this.y;
    this.pauseScan = 0;
  }

  // Called by world.js when this guard's cone holds the thief.
  spotThief(px, py) {
    this.lastSeenX = px;
    this.lastSeenY = py;
    if (this.state === GUARD_STATE_PATROL || this.state === GUARD_STATE_SUSPICIOUS) {
      this.state = GUARD_STATE_SUSPICIOUS;
    }
  }

  hearNoise(nx, ny) {
    if (this.state === GUARD_STATE_PATROL || this.state === GUARD_STATE_SUSPICIOUS) {
      this.state = GUARD_STATE_INVESTIGATE;
      this.investigateX = nx;
      this.investigateY = ny;
    }
  }

  raiseAlarm(px, py) {
    this.state = GUARD_STATE_ALARM;
    this.lastSeenX = px;
    this.lastSeenY = py;
  }

  calmDown() {
    if (this.state === GUARD_STATE_ALARM) this.state = GUARD_STATE_PATROL;
    this.suspicion = 0;
  }

  moveToward(tx, ty, speed, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return true;
    const step = Math.min(dist, speed * dt);
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
    this.facing = Math.atan2(dy, dx);
    return dist - step < 2;
  }

  update(dt, player) {
    if (this.suspicion >= 1 && this.state === GUARD_STATE_SUSPICIOUS) {
      this.state = GUARD_STATE_CHASE;
      this.chaseTimer = GUARD_CHASE_SECONDS;
    }

    if (this.state === GUARD_STATE_CHASE) {
      this.chaseTimer -= dt;
      const arrived = this.moveToward(this.lastSeenX, this.lastSeenY, GUARD_CHASE_SPEED, dt);
      if (arrived || this.chaseTimer <= 0) {
        this.state = GUARD_STATE_SUSPICIOUS;
        this.suspicion = 0.45;
        this.waitTimer = GUARD_WAIT_SECONDS;
      }
      return;
    }

    if (this.state === GUARD_STATE_ALARM) {
      this.moveToward(player.x, player.y, GUARD_CHASE_SPEED, dt);
      return;
    }

    if (this.state === GUARD_STATE_INVESTIGATE) {
      const arrived = this.moveToward(this.investigateX, this.investigateY, GUARD_PATROL_SPEED * 1.4, dt);
      if (arrived) {
        this.state = GUARD_STATE_SUSPICIOUS;
        this.suspicion = 0.3;
        this.waitTimer = GUARD_WAIT_SECONDS;
      }
      return;
    }

    if (this.state === GUARD_STATE_SUSPICIOUS) {
      this.waitTimer -= dt;
      // Look around while suspicious: slow scan, then back to the beat.
      this.pauseScan += dt * 1.4;
      this.facing += Math.sin(this.pauseScan) * dt * 1.2;
      if (this.waitTimer <= 0 && this.suspicion < 0.5) {
        this.state = GUARD_STATE_PATROL;
        this.suspicion = 0;
      }
      return;
    }

    // Patrol: walk to the next waypoint, wait and scan at each end.
    if (this.waitTimer > 0) {
      this.waitTimer -= dt;
      this.pauseScan += dt;
      this.facing += Math.sin(this.pauseScan * 1.6) * dt * 0.9;
      if (this.waitTimer <= 0) this.waypointIndex = (this.waypointIndex + 1) % this.waypoints.length;
      return;
    }
    const target = this.waypoints[this.waypointIndex];
    const arrived = this.moveToward(target[0], target[1], this.speed, dt);
    if (arrived) this.waitTimer = GUARD_WAIT_SECONDS;
  }

  // Cone colour reads the guard's mood at a glance: calm yellow, wary orange, hunting red.
  coneColour() {
    if (this.state === GUARD_STATE_CHASE || this.state === GUARD_STATE_ALARM) return 'rgba(255, 70, 60, 0.30)';
    if (this.suspicion > 0.45) return 'rgba(255, 150, 50, 0.28)';
    return 'rgba(245, 197, 66, 0.22)';
  }
}
