// The Midnight Vault — level layouts. Each level is one bank floor: walls and
// cover that block both movement and sight, loot to grab, an exit door, guard
// patrol routes, wall cameras and one hack terminal. Later floors add guards,
// cameras and faster patrols, and tighten the cover so the lanes get meaner.
export function buildLevel(index) {
  const walls = [
    { x: 0, y: 0, w: 1280, h: 24 },
    { x: 0, y: 776, w: 600, h: 24 },
    { x: 680, y: 776, w: 600, h: 24 },
    { x: 0, y: 0, w: 24, h: 800 },
    { x: 1256, y: 0, w: 24, h: 800 },
  ];
  const exit = { x: 600, y: 776, w: 80, h: 24, open: false };

  if (index === 0) {
    return {
      name: 'LEVEL 1 — THE LOBBY VAULT',
      par: 75,
      walls,
      interiorWalls: [
        { x: 560, y: 300, w: 160, h: 24 },
        { x: 880, y: 520, w: 160, h: 24 },
      ],
      cover: [
        { x: 220, y: 180, w: 150, h: 64, kind: 'desk' },
        { x: 560, y: 150, w: 150, h: 64, kind: 'desk' },
        { x: 900, y: 190, w: 150, h: 64, kind: 'desk' },
        { x: 300, y: 430, w: 170, h: 70, kind: 'desk' },
        { x: 640, y: 470, w: 150, h: 64, kind: 'desk' },
        { x: 980, y: 440, w: 130, h: 64, kind: 'desk' },
        { x: 560, y: 64, w: 64, h: 54, kind: 'vault' },
        { x: 656, y: 64, w: 64, h: 54, kind: 'vault' },
      ],
      loot: [
        { x: 640, y: 92, kind: 'vault', value: 3, taken: false, label: 'THE MIDNIGHT VAULT' },
        { x: 250, y: 660, kind: 'gem', value: 1, taken: false, label: 'emerald' },
        { x: 1030, y: 660, kind: 'gem', value: 1, taken: false, label: 'sapphire' },
      ],
      exit,
      playerStart: { x: 640, y: 730 },
      terminal: { x: 170, y: 730, used: false },
      guards: [
        { x: 420, y: 180, waypoints: [[420, 180], [420, 560]], speed: 72 },
        { x: 880, y: 560, waypoints: [[880, 560], [880, 180]], speed: 72 },
      ],
      cameras: [
        { x: 40, y: 120, baseAngle: 0.9, sweep: 0.7, speed: 0.55, phase: 0 },
        { x: 1240, y: 120, baseAngle: Math.PI - 0.9, sweep: 0.7, speed: 0.55, phase: 2.1 },
      ],
    };
  }

  if (index === 1) {
    return {
      name: 'LEVEL 2 — THE GALLERY',
      par: 95,
      walls,
      interiorWalls: [
        { x: 300, y: 280, w: 200, h: 24 },
        { x: 780, y: 280, w: 200, h: 24 },
        { x: 540, y: 540, w: 200, h: 24 },
      ],
      cover: [
        { x: 180, y: 150, w: 130, h: 60, kind: 'desk' },
        { x: 480, y: 130, w: 130, h: 60, kind: 'desk' },
        { x: 780, y: 150, w: 130, h: 60, kind: 'desk' },
        { x: 1060, y: 150, w: 120, h: 60, kind: 'desk' },
        { x: 240, y: 400, w: 150, h: 64, kind: 'desk' },
        { x: 560, y: 400, w: 150, h: 64, kind: 'desk' },
        { x: 890, y: 400, w: 150, h: 64, kind: 'desk' },
        { x: 380, y: 600, w: 140, h: 60, kind: 'desk' },
        { x: 760, y: 600, w: 140, h: 60, kind: 'desk' },
        { x: 560, y: 64, w: 64, h: 54, kind: 'vault' },
        { x: 656, y: 64, w: 64, h: 54, kind: 'vault' },
      ],
      loot: [
        { x: 640, y: 92, kind: 'vault', value: 3, taken: false, label: 'THE MIDNIGHT VAULT' },
        { x: 180, y: 660, kind: 'gem', value: 1, taken: false, label: 'emerald' },
        { x: 1100, y: 660, kind: 'gem', value: 1, taken: false, label: 'ruby' },
        { x: 640, y: 330, kind: 'gem', value: 1, taken: false, label: 'topaz' },
      ],
      exit,
      playerStart: { x: 640, y: 730 },
      terminal: { x: 90, y: 730, used: false },
      guards: [
        { x: 340, y: 180, waypoints: [[340, 180], [340, 560]], speed: 80 },
        { x: 640, y: 560, waypoints: [[640, 560], [640, 220]], speed: 80 },
        { x: 940, y: 180, waypoints: [[940, 180], [940, 560]], speed: 80 },
      ],
      cameras: [
        { x: 40, y: 120, baseAngle: 0.9, sweep: 0.7, speed: 0.7, phase: 0 },
        { x: 1240, y: 120, baseAngle: Math.PI - 0.9, sweep: 0.7, speed: 0.7, phase: 1.4 },
        { x: 640, y: 40, baseAngle: Math.PI / 2, sweep: 0.6, speed: 0.6, phase: 2.8 },
      ],
    };
  }

  // Level 3 — the inner vault: four guards, four cameras, fastest patrols.
  return {
    name: 'LEVEL 3 — THE INNER VAULT',
    par: 120,
    walls,
    interiorWalls: [
      { x: 240, y: 260, w: 180, h: 24 },
      { x: 860, y: 260, w: 180, h: 24 },
      { x: 240, y: 520, w: 180, h: 24 },
      { x: 860, y: 520, w: 180, h: 24 },
      { x: 580, y: 380, w: 120, h: 24 },
    ],
    cover: [
      { x: 160, y: 140, w: 120, h: 56, kind: 'desk' },
      { x: 480, y: 130, w: 120, h: 56, kind: 'desk' },
      { x: 680, y: 130, w: 120, h: 56, kind: 'desk' },
      { x: 1000, y: 140, w: 120, h: 56, kind: 'desk' },
      { x: 200, y: 380, w: 140, h: 60, kind: 'desk' },
      { x: 940, y: 380, w: 140, h: 60, kind: 'desk' },
      { x: 340, y: 620, w: 140, h: 56, kind: 'desk' },
      { x: 800, y: 620, w: 140, h: 56, kind: 'desk' },
      { x: 560, y: 64, w: 64, h: 54, kind: 'vault' },
      { x: 656, y: 64, w: 64, h: 54, kind: 'vault' },
    ],
    loot: [
      { x: 640, y: 92, kind: 'vault', value: 3, taken: false, label: 'THE MIDNIGHT VAULT' },
      { x: 150, y: 660, kind: 'gem', value: 1, taken: false, label: 'emerald' },
      { x: 1130, y: 660, kind: 'gem', value: 1, taken: false, label: 'ruby' },
      { x: 640, y: 330, kind: 'gem', value: 1, taken: false, label: 'topaz' },
      { x: 320, y: 470, kind: 'gem', value: 1, taken: false, label: 'opal' },
    ],
    exit,
    playerStart: { x: 640, y: 730 },
    terminal: { x: 90, y: 730, used: false },
    guards: [
      { x: 300, y: 160, waypoints: [[300, 160], [300, 580]], speed: 92 },
      { x: 520, y: 580, waypoints: [[520, 580], [520, 200]], speed: 92 },
      { x: 760, y: 200, waypoints: [[760, 200], [760, 580]], speed: 92 },
      { x: 980, y: 580, waypoints: [[980, 580], [980, 160]], speed: 92 },
    ],
    cameras: [
      { x: 40, y: 120, baseAngle: 0.9, sweep: 0.7, speed: 0.8, phase: 0 },
      { x: 1240, y: 120, baseAngle: Math.PI - 0.9, sweep: 0.7, speed: 0.8, phase: 1.1 },
      { x: 480, y: 40, baseAngle: Math.PI / 2, sweep: 0.55, speed: 0.7, phase: 2.2 },
      { x: 800, y: 40, baseAngle: Math.PI / 2, sweep: 0.55, speed: 0.7, phase: 3.3 },
    ],
  };
}

export const LEVEL_COUNT = 3;
