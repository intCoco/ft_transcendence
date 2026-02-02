import { Paddle } from "../entities/paddle.js";

export interface Controller {
    paddle: Paddle;
    score: number;

    update(paddle: Paddle, delta: number): void;
}
