# The Midnight Vault — a heist game

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Arik2779/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Arik2779/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A top-down stealth heist that plays offline in a desktop browser from static
files. Slip past patrolling guards and sweeping security cameras, crack the
vault, pocket the gems, and reach the exit before the alarm brings every
guard down on you.

Bounty: https://make.fun/bounty/best-heist-game-20261122-0559
Repo: Arik2779/best-heist-game-20261122-0559

## How to play

Serve `game/` with any static server (for example `node serve.ts` from the
repo root, then open http://localhost:8080) and press Space to start.

- **Goal:** grab the vault gold — that opens the exit door — then reach the
  green EXIT. Gems are optional bonus loot.
- **Guards** patrol fixed routes with visible vision cones. A cone that
  touches you raises your suspicion and the alarm. A guard that gets
  suspicious pauses to look around; a fully suspicious guard chases the last
  place it saw you.
- **Cameras** sweep their cones back and forth. Being seen by a camera fills
  the alarm fast. During a full alarm, cameras lock onto you.
- **Alarm meter:** rises while any guard or camera sees you, cools while you
  stay hidden. At 100% the alarm trips: guards converge and cameras lock on.
  Break line of sight and stay hidden to cool it back down. A hunting guard
  that reaches you ends the run — press R to retry the floor.
- **Cover:** desks, vault blocks and walls block sight lines. Crouch behind
  them and cones cannot reach you.
- **Tools, at a cost:** Q fires an EMP burst (2 per floor) that blinds nearby
  cameras for 6 seconds. E at the hack terminal (once per floor) blinds all
  cameras for 8 seconds. Running (Shift) is fast but loud — guards inside
  the red noise ring come to investigate.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Move |
| Shift | Run (loud) |
| C / Ctrl | Sneak (slow, harder to spot) |
| Q | EMP burst (blinds nearby cameras) |
| E | Hack terminal (near the console) |
| Space / click | Start, continue |
| P / Esc | Pause |
| R | Retry after being caught |

Three floors of rising difficulty: more guards, more cameras, faster
patrols, tighter cover. Score rewards loot, speed (par time per floor) and
keeping the alarm count low.

## Tech

- Plain HTML + canvas + ES modules under `game/`, no build step, no network
  requests, no external assets. All art is procedural canvas drawing; all
  sound is synthesised WebAudio (footsteps, camera beeps, alert stings,
  loot clinks, alarm loop).
- Source is split by job: `config.js` (tuning), `level.js` (floor layouts),
  `vision.js` (sight lines and cones), `guards.js` (patrols and suspicion),
  `cameras.js` (sweeps and disabling), `player.js` (movement and noise),
  `world.js` (detection, alarm, win/caught), `render.js` (all drawing and
  HUD), `audio.js` (synth sounds), `input.js` (keyboard and mouse),
  `shots.js` (screenshot scenes), `main.js` (boot and game loop).
- Screenshots are reproducible: `?shot=start|play|end&seed=1` stages each
  scene from the real game rules.

## License

MIT — see `LICENSE`.

<sub>Entered on [make.fun](https://make.fun/?ref=808mq1jq&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
