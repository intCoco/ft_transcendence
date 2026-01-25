// entities/paddle.ts

export class Paddle {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.width = 15;
        this.height = 80;
        this.speed = 300;
    }

    moveUp(delta: number) {
        this.y -= this.speed * delta;
    }

    moveDown(delta: number) {
        this.y += this.speed * delta;
    }

    clamp(maxHeight: number) {
        this.y = Math.max(5, Math.min(maxHeight - this.height - 5, this.y));
    }
}

export const leftPaddle = new Paddle(20, 600 / 2 - 40);
export const rightPaddle = new Paddle(800 - 35, 600 / 2 - 40);


