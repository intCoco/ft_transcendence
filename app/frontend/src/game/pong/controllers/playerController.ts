import { Controller } from "./controller.js";
import { Paddle } from "../entities/paddle.js";
import { isKeyDown } from "../core/input.js";

export class PlayerController implements Controller {
    paddle: Paddle;
    upKey: string;
    downKey: string;

    constructor(
        paddle: Paddle,
        upKey: string,
        downKey: string,
    ) {
        this.paddle = paddle;
        this.upKey = upKey;
        this.downKey = downKey;
    }

    update(paddle: Paddle, delta: number) {
        if (isKeyDown(this.upKey)) {
            paddle.moveUp(delta);
        }
        if (isKeyDown(this.downKey)) {
            paddle.moveDown(delta);
        }
    }
    
    isUpPressed(): boolean {
        return isKeyDown(this.upKey);
    }

    isDownPressed(): boolean {
        return isKeyDown(this.downKey);
    }
}
