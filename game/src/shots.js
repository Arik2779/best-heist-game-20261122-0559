// The Midnight Vault — screenshot scenes behind ?shot=start|play|end. Each one
// stages the real game (never a mock-up): the start scene runs the title over a
// live patrol, the play scene puts the thief crouched behind a desk with a
// guard cone and a camera cone sweeping close and the alarm part-filled, and
// the end scene shows the win screen after the final floor. Same seed, same
// frame, every time.
import { STEP } from './config.js';
import { WORLD_STATE_PLAY, WORLD_STATE_WIN } from './world.js';

export function stageShot(name, world) {
  if (name === 'play') {
    world.reset(0);
    world.state = WORLD_STATE_PLAY;
    // The thief crouched behind the desk at (300,430): the guard's cone reaches
    // over the desk but the desk blocks the sight line, so the thief is safe
    // and the danger is visible in the same frame.
    world.player.x = 385;
    world.player.y = 528;
    world.player.crouched = true;
    world.player.facing = -Math.PI / 2;
    const guard = world.guards[0];
    guard.x = 420;
    guard.y = 380;
    guard.facing = Math.PI / 2;
    guard.suspicion = 0.55;
    guard.state = 'suspicious';
    guard.waitTimer = 1.2;
    const guard2 = world.guards[1];
    guard2.x = 880;
    guard2.y = 300;
    guard2.facing = Math.PI / 2;
    const camera = world.cameras[1];
    camera.time = 2.6;
    camera.angle = Math.PI - 0.9 + Math.sin(2.6 * 0.55) * 0.7;
    world.cameras[0].time = 1.1;
    world.cameras[0].angle = 0.9 + Math.sin(1.1 * 0.55) * 0.7;
    world.alarm = 42;
    world.time = 38;
    // One gem already pocketed, the vault still glowing at the far end.
    world.levelData.loot[1].taken = true;
    world.lootCollected = 1;
    world.lootValue = 1;
    return { screen: WORLD_STATE_PLAY };
  }

  if (name === 'end') {
    world.reset(0);
    world.state = WORLD_STATE_WIN;
    // All three items of floor 1 pocketed: vault (3) + two gems (1 each) = value 5.
    world.lootCollected = 3;
    world.lootValue = 5;
    world.levelData.loot.forEach((loot) => { loot.taken = true; });
    world.levelData.exit.open = true;
    world.score = 7420;
    world.alarmsRaised = 1;
    world.time = 214;
    world.player.x = 640;
    world.player.y = 740;
    return { screen: WORLD_STATE_WIN };
  }

  // start (and anything else): title over a live room, guards mid-patrol.
  world.reset(0);
  for (let i = 0; i < 4 / STEP; i += 1) {
    for (const guard of world.guards) guard.update(STEP, world.player);
    for (const camera of world.cameras) camera.update(STEP, false, null);
  }
  return { screen: 'title' };
}
