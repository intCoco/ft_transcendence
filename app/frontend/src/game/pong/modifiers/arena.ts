import { game } from "../core/state.js";
import { ball } from "../entities/ball.js";

export const goal = {
    width: 0,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
}

export function checkArenaCollision() {
    if (ball.x - ball.radius < 0 && (ball.y < goal.top || ball.y > goal.bottom)) return "left";
    if (ball.x + ball.radius > game.width && (ball.y < goal.top || ball.y > goal.bottom)) return "right";
    return null;
}
