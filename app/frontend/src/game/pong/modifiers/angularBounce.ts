import { ball } from "../entities/ball.js";
import { Paddle } from "../entities/paddle.js";
import { bounce } from "./modifiers.js";

/**
 * Apply angular bounce
 */
export function applyAngularBounce(paddle: Paddle, isLeft: boolean) {
    const relativeY = (ball.y - paddle.y) / paddle.height; // 0 -> 1
    const clamped = Math.max(0, Math.min(1, relativeY));
    const angle = (clamped - 0.5) * (Math.PI / 2); // -45deg -> 45deg

    bounce(ball, angle);
}