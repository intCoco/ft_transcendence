import { Controller } from "./controller.js";
import { Paddle } from "../entities/paddle.js";
import { isKeyDown } from "../core/input.js";

export class PlayerController implements Controller {
    paddle: Paddle;
    upKey: string;
    downKey: string;
    score: number = 0;

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
        if (paddle.height > paddle.width && isKeyDown(this.upKey)) {
            paddle.moveUp(delta);
        }
        if (paddle.height > paddle.width && isKeyDown(this.downKey)) {
            paddle.moveDown(delta);
        }
        if (paddle.width > paddle.height && isKeyDown(this.upKey)) {
            paddle.moveLeft(delta);
        }
        if (paddle.width > paddle.height && isKeyDown(this.downKey)) {
            paddle.moveRight(delta);
        }
    }
    
    isUpPressed(): boolean {
        return isKeyDown(this.upKey);
    }

    isDownPressed(): boolean {
        return isKeyDown(this.downKey);
    }
}
