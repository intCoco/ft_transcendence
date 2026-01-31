import { GameState, GAMEDURATION } from "./constants.js";

export const game = {
    state: GameState.COIN_TOSS,
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
    mode: "2P" as "2P" | "4P",

    width: 800,
    height: 600,

    canvasWidth: 860,
    canvasHeight: 660,
};
