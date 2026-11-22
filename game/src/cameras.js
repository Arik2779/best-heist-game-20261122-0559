// The Midnight Vault — security cameras. A camera sweeps its cone back and
// forth across its arc, beeps as it passes, and can be knocked out two ways:
// an EMP burst (Q, limited charges, short range) or the hack terminal (E, once
// per level, all cameras). During a full alarm a live camera locks onto the
// thief instead of sweeping.
export class Camera {
  constructor(def) {
    this.x = def.x;
    this.y = def.y;
    this.baseAngle = def.baseAngle;
    this.sweep = def.sweep;
    this.speed = def.speed;
    this.phase = def.phase || 0;
    this.time = this.phase;
    this.angle = this.baseAngle;
    this.disabledUntil = 0;
    this.spotted = false;
  }

  get disabled() {
    return this.time < this.disabledUntil;
  }

  disableFor(seconds) {
    this.disabledUntil = Math.max(this.disabledUntil, this.time + seconds);
  }

  update(dt, alarmActive, player) {
    this.time += dt;
    if (this.disabled) return;
    if (alarmActive && player) {
      this.angle = Math.atan2(player.y - this.y, player.x - this.x);
      return;
    }
    this.angle = this.baseAngle + Math.sin(this.time * this.speed) * this.sweep;
  }
}
