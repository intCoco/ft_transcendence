import { ball } from "../entities/ball.js";

export function applySpeedIncrease() {
    ball.speedCoef *= 1.05;
}
