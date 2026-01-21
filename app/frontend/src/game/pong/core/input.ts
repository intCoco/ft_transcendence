// core/input.ts
import { game } from "./state.ts";


export const keysPressed: Record<string, boolean> = {};

export function setKey(key: string, pressed: boolean) {
  keysPressed[key] = pressed;
}

export function isKeyDown(key: string): boolean {
  return !!keysPressed[key];
}

export function resetKeys() {
  for (const k in keysPressed) {
    keysPressed[k] = false;
  }
}

window.addEventListener("keydown", (e) => {
    // if (e.key === "Escape") togglePause();
    if (e.key === "q") game.aiDebug = !game.aiDebug;
});
