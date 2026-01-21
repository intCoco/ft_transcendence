// core/state.ts

import { GameState, GAMEDURATION } from "./constants.js";

export const game = {
    state: GameState.MENU,
    isPaused: false,
    isGameOver: false,

    scoreLeft: 0,
    scoreRight: 0,

    gameTimer: GAMEDURATION,
    serveTimer: 3,

    lastTime: performance.now(), // time var for non-performance-dependant speed

    aiDebug: false,

    ctx: null as CanvasRenderingContext2D | null,

    onGameOver: undefined as (() => void) | undefined,
};
