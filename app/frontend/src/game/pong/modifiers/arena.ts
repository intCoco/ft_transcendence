import { game } from "../core/state.js";
import { ball } from "../entities/ball.js";

export const GOAL_HEIGHT = 250;
export const GOAL_TOP = (game.height - GOAL_HEIGHT) / 2;
export const GOAL_BOTTOM = GOAL_TOP + GOAL_HEIGHT;

export function checkArenaCollision() {
    if (ball.x - ball.radius < 0 && (ball.y < GOAL_TOP || ball.y > GOAL_BOTTOM)) return "left";
    if (ball.x + ball.radius > game.width && (ball.y < GOAL_TOP || ball.y > GOAL_BOTTOM)) return "right";
    return null;
}
