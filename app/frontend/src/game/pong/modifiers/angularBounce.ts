import { game } from "../core/state.js";
import { ball } from "../entities/ball.js";
import { Paddle } from "../entities/paddle.js";
import { bounce } from "./modifiers.js";

/**
 * Apply angular bounce for 2P / 4P paddles
 */
export function applyAngularBounce(paddle: Paddle) {
    let relative: number;
    let angleRange: number;

    angleRange = game.mode === "4P" ? (3 * Math.PI) / 4 : Math.PI / 2;

    if (paddle.orientation === "vertical") relative = (ball.y - paddle.y) / paddle.height;
    else relative = (ball.x - paddle.x) / paddle.width;

    const clamped = Math.max(0, Math.min(1, relative));
    const angle = (clamped - 0.5) * angleRange;

    bounce(ball, angle, paddle.orientation);
}