// The Midnight Vault — boot and the one loop. Input is read every frame, the
// world advances in fixed 1/60 s steps, the renderer paints what is there.
// Screens: title, play, paused, caught, level clear, win.
//
// ?shot=start|play|end (with &seed=N) stages that scene instead of running the
// loop, paints it twice and sets window.__shotReady for a screenshot.
import { STEP } from './config.js';
import { World, WORLD_STATE_CAUGHT, WORLD_STATE_LEVEL_CLEAR, WORLD_STATE_PLAY, WORLD_STATE_TITLE, WORLD_STATE_WIN } from './world.js';
import { SoundEngine } from './audio.js';
import { ACTION_CONFIRM, ACTION_EMP, ACTION_HACK, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);
void seed;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = new World();
const sound = new SoundEngine();
world.sound = sound;
// Probe hook for play-testing: lets an automated harness read live state
// (alarm, loot, screen) without changing how the game plays.
window.__world = world;
const renderer = createRenderer(canvas);

function announce(message) {
  status.textContent = message;
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world, scene.screen);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, () => sound.unlock());
  let screen = WORLD_STATE_TITLE;
  let paused = false;
  let accumulator = 0;
  let last = performance.now();

  function startGame() {
    world.reset(0);
    world.score = 0;
    world.alarmsRaised = 0;
    world.startLevel();
    screen = WORLD_STATE_PLAY;
    paused = false;
    announce('Playing. Grab the vault gold, then reach the exit.');
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_RESTART && screen === WORLD_STATE_CAUGHT) {
      world.restartLevel();
      screen = WORLD_STATE_PLAY;
      announce('Trying the floor again.');
      return;
    }
    if (actions & ACTION_CONFIRM) {
      if (screen === WORLD_STATE_TITLE || screen === WORLD_STATE_WIN) startGame();
      else if (screen === WORLD_STATE_CAUGHT) {
        world.restartLevel();
        screen = WORLD_STATE_PLAY;
      } else if (screen === WORLD_STATE_LEVEL_CLEAR) {
        world.nextLevel();
        screen = world.state === WORLD_STATE_WIN ? WORLD_STATE_WIN : WORLD_STATE_PLAY;
      } else if (paused) {
        paused = false;
        announce('Playing.');
      }
    }
    if (actions & ACTION_PAUSE && screen === WORLD_STATE_PLAY) {
      paused = !paused;
      announce(paused ? 'Paused.' : 'Playing.');
    }
    if (screen === WORLD_STATE_PLAY && !paused) {
      if (actions & ACTION_EMP) world.useEmp();
      if (actions & ACTION_HACK) world.useTerminal();
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === WORLD_STATE_PLAY && !paused) {
      while (accumulator >= STEP) {
        world.update(STEP, input);
        accumulator -= STEP;
        if (world.state === WORLD_STATE_CAUGHT) {
          screen = WORLD_STATE_CAUGHT;
          announce('Caught! Press R to try again.');
          accumulator = 0;
          break;
        }
        if (world.state === WORLD_STATE_LEVEL_CLEAR) {
          screen = WORLD_STATE_LEVEL_CLEAR;
          announce('Floor cleared. Press Space for the next floor.');
          accumulator = 0;
          break;
        }
        if (world.state === WORLD_STATE_WIN) {
          screen = WORLD_STATE_WIN;
          announce('The perfect heist. Final score ' + world.score + '.');
          accumulator = 0;
          break;
        }
      }
    } else {
      accumulator = 0;
      if (screen === WORLD_STATE_TITLE) {
        // The room lives behind the title: patrols keep walking.
        world.update(STEP, input);
      }
    }
    renderer.draw(world, paused ? WORLD_STATE_PLAY : screen);
    if (paused) {
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = 'rgba(6, 8, 15, 0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#e8ecf7';
      ctx.font = 'bold 48px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
      ctx.restore();
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === WORLD_STATE_PLAY) {
      paused = true;
      announce('Paused.');
    }
  });

  announce('The Midnight Vault. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
