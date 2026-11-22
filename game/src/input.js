// The Midnight Vault — keyboard and mouse input. WASD or arrows to move,
// Shift to run, C or Control to sneak, Q for the EMP burst, E to hack the
// terminal, Space or Enter to confirm, P or Escape to pause, R to retry after
// being caught. Clicks land where the player points; the renderer turns a
// click on a button into the same confirm action.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_EMP = 4;
export const ACTION_HACK = 8;
export const ACTION_RESTART = 16;

const MOVE_KEYS = {
  KeyW: [0, -1], ArrowUp: [0, -1],
  KeyS: [0, 1], ArrowDown: [0, 1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0],
  KeyD: [1, 0], ArrowRight: [1, 0],
};

export function createInput(canvas, onFirstGesture) {
  const held = new Set();
  let actions = 0;
  let gestured = false;

  function gesture() {
    if (gestured) return;
    gestured = true;
    if (onFirstGesture) onFirstGesture();
  }

  function keyDown(event) {
    gesture();
    if (event.repeat) return;
    held.add(event.code);
    if (event.code === 'Space' || event.code === 'Enter') {
      actions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      actions |= ACTION_PAUSE;
    } else if (event.code === 'KeyQ') {
      actions |= ACTION_EMP;
    } else if (event.code === 'KeyE') {
      actions |= ACTION_HACK;
    } else if (event.code === 'KeyR') {
      actions |= ACTION_RESTART;
    }
    if (event.code in MOVE_KEYS || event.code === 'Space') event.preventDefault();
  }

  function keyUp(event) {
    held.delete(event.code);
  }

  function mouseDown(event) {
    gesture();
    actions |= ACTION_CONFIRM;
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    mouse.clicked = true;
  }

  const mouse = { x: 0, y: 0, clicked: false };

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  canvas.addEventListener('mousedown', mouseDown);

  return {
    direction() {
      let x = 0;
      let y = 0;
      for (const code of held) {
        const d = MOVE_KEYS[code];
        if (d) {
          x += d[0];
          y += d[1];
        }
      }
      if (x === 0 && y === 0) return { x: 0, y: 0 };
      const len = Math.hypot(x, y);
      return { x: x / len, y: y / len };
    },
    runHeld() {
      return held.has('ShiftLeft') || held.has('ShiftRight');
    },
    crouchHeld() {
      return held.has('KeyC') || held.has('ControlLeft') || held.has('ControlRight');
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    takeClick() {
      const clicked = mouse.clicked;
      mouse.clicked = false;
      return clicked ? { x: mouse.x, y: mouse.y } : null;
    },
  };
}
