import { AIController } from "../controllers/aiController";
import { Controller } from "../controllers/controller";
import { PlayerController } from "../controllers/playerController";
import { game } from "../core/state";

export class Paddle {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
    orientation: "vertical" | "horizontal";
    controller: AIController | PlayerController | null = null;

    constructor(x: number, y: number, orientation: "vertical" | "horizontal") {
        this.x = x;
        this.y = y;
        this.orientation = orientation;
        if (orientation === "horizontal") {
            this.width = 80;
            this.height = 15;
        } else {
            this.width = 15;
            this.height = 80;
        }
        this.speed = 300;
    }

    moveUp(delta: number) {
        this.y -= this.speed * delta;
    }

    moveDown(delta: number) {
        this.y += this.speed * delta;
    }
    
    moveLeft(delta: number) {
        this.x -= this.speed * delta;
    }

    moveRight(delta: number) {
        this.x += this.speed * delta;
    }

    clampY(maxHeight: number) {
        const offset = game.mode === "4P" ? 35 : 5;
        this.y = Math.max(offset, Math.min(maxHeight - this.height - offset, this.y));
    }

    clampX(maxWidth: number) {
        const offset = game.mode === "4P" ? 35 : 5;
        this.x = Math.max(offset, Math.min(maxWidth - this.width - offset, this.x));
    }
}

export const leftPaddle = new Paddle(20, 600 / 2 - 40, "vertical");
export const rightPaddle = new Paddle(800 - 35, 600 / 2 - 40, "vertical");
export const topPaddle = new Paddle(800 / 2 - 40, 20, "horizontal");
export const bottomPaddle = new Paddle(800 / 2 - 40, 800 - 20, "horizontal");


