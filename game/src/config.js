// The Midnight Vault — shared tuning: sizes, speeds, colours, detection rules.
// One place for every number the other files argue about, so a balance change
// never means hunting through the renderer or the world step.
export const VIEW_W = 1280;
export const VIEW_H = 800;
export const STEP = 1 / 60;

export const PLAYER_RADIUS = 14;
export const PLAYER_WALK_SPEED = 170;
export const PLAYER_RUN_SPEED = 275;
export const PLAYER_CROUCH_SPEED = 95;
// A crouched thief is harder to spot: cones reach this much shorter against one.
export const CROUCH_CONE_FACTOR = 0.62;
export const NOISE_RUN_RADIUS = 130;

export const GUARD_RADIUS = 15;
export const GUARD_PATROL_SPEED = 72;
export const GUARD_CHASE_SPEED = 155;
export const GUARD_CONE_RANGE = 215;
export const GUARD_CONE_HALF_ANGLE = 0.62;
export const GUARD_SUSPICION_RISE = 1.4;
export const GUARD_SUSPICION_FALL = 0.5;
export const GUARD_CHASE_SECONDS = 4;
export const GUARD_WAIT_SECONDS = 1.6;

export const CAMERA_CONE_RANGE = 285;
export const CAMERA_CONE_HALF_ANGLE = 0.44;
export const CAMERA_ALARM_RISE = 70;
export const GUARD_ALARM_RISE = 55;
export const ALARM_DECAY = 18;
export const ALARM_ACTIVE_DECAY = 12;
export const ALARM_COOLDOWN_END = 40;
export const CATCH_DISTANCE = 28;

export const EMP_CHARGES = 2;
export const EMP_RADIUS = 330;
export const EMP_SECONDS = 6;
export const TERMINAL_DISABLE_SECONDS = 8;

export const LOOT_PICKUP_DISTANCE = 32;

// Night palette: deep blue floor, warm gold loot, red guard cones, amber camera cones.
export const PALETTE = {
  floorA: '#1b2338',
  floorB: '#161d2e',
  floorLine: '#232c46',
  carpet: '#5a1f2b',
  carpetEdge: '#7a2a38',
  wall: '#2c3550',
  wallTop: '#46538a',
  desk: '#6b4a2f',
  deskTop: '#8a623c',
  vaultBlock: '#3a4152',
  vaultTrim: '#9aa3b8',
  pedestal: '#4d5468',
  gold: '#f5c542',
  goldGlow: '#ffe9a3',
  gem: '#57e6c9',
  guard: '#2e4a7a',
  guardTrim: '#d8e2f5',
  camera: '#c8ccd8',
  cameraLens: '#ff5a4e',
  player: '#14101f',
  playerTrim: '#8b5cf6',
  exitClosed: '#3f6b4f',
  exitOpen: '#39d98a',
  hudBack: 'rgba(8, 10, 18, 0.82)',
  hudText: '#e8ecf7',
  hudDim: '#9aa5c4',
  alarmLow: '#39d98a',
  alarmMid: '#f5c542',
  alarmHigh: '#ff5a4e',
};
