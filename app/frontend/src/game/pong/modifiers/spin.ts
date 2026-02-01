import { ball } from "../entities/ball.js";

const MAX_ANGLE = 0.728;


export function applySpin(delta: number) {
    if (!ball.spin) return;

    const newVelX = ball.velX * Math.cos(ball.spin * delta) - ball.velY * Math.sin(ball.spin * delta);
    const newVelY = ball.velX * Math.sin(ball.spin * delta) + ball.velY * Math.cos(ball.spin * delta);

    const angle = Math.abs(Math.atan2(newVelY, Math.abs(newVelX)));
    if (angle <= MAX_ANGLE) {
        ball.velX = newVelX;
        ball.velY = newVelY;
    }
}

export function setSpin(direction: "up" | "down", strength = 0.7) {
    ball.spin = direction === "up" ? strength : -strength;
}

export function resetSpin() {
    ball.spin = 0;
}
