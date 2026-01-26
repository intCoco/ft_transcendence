import { Paddle } from "../entities/paddle.js";

export interface Controller {
    paddle: Paddle;
    update(paddle: Paddle, delta: number): void;
}
