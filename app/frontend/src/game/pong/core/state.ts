import { Paddle } from "../entities/paddle.js";
import { GameState, GAMEDURATION } from "./constants.js";

export const game = {
    state: GameState.COIN_TOSS,
    isPaused: false,
    isGameOver: false,

    gameTimer: GAMEDURATION,
    serveTimer: 3,

    lastTime: performance.now(), // time var for non-performance-dependant speed

    aiDebug: false,

    ctx: null as CanvasRenderingContext2D | null,

    onGameOver: undefined as (() => void) | undefined,
    mode: "2P" as "2P" | "4P",

    width: 800,
    height: 600,

    canvasWidth: 920,
    canvasHeight: 720,

    lastHitPaddle: undefined as Paddle | undefined,
    penultimateHitPaddle: undefined as Paddle | undefined,

    winner: undefined as "left" | "right" | "top" | "bottom" | undefined,
};
