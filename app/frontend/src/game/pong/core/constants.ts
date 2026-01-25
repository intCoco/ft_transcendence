
export const GAMEDURATION = 60;

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const CANVAS_WIDTH = 860;
export const CANVAS_HEIGHT = 660;

export const ARENA_MARGIN_TOP = 30;
export const ARENA_MARGIN_BOTTOM = 30;

export const ARENA_MARGIN_LEFT = 30;
export const ARENA_MARGIN_RIGHT = 30;

export const ARENA_TOP = 0 + ARENA_MARGIN_TOP;
export const ARENA_BOTTOM = CANVAS_HEIGHT - ARENA_MARGIN_BOTTOM;

export const ARENA_LEFT = 0 + ARENA_MARGIN_LEFT;
export const ARENA_RIGHT = CANVAS_WIDTH - ARENA_MARGIN_RIGHT;

export enum GameState {
    MENU,
    COIN_TOSS,
    SERVE,
    PLAY,
    END
}