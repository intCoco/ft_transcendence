
export class Paddle {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;

    constructor(x: number, y: number, orientation: "vertical" | "horizontal") {
        this.x = x;
        this.y = y;
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
        this.y = Math.max(5, Math.min(maxHeight - this.height - 5, this.y));
    }

    clampX(maxWidth: number) {
        this.x = Math.max(5, Math.min(maxWidth - this.width - 5, this.x));
    }
}

export const leftPaddle = new Paddle(20, 600 / 2 - 40, "vertical");
export const rightPaddle = new Paddle(800 - 35, 600 / 2 - 40, "vertical");
export const topPaddle = new Paddle(800 / 2 - 40, 20, "horizontal");
export const bottomPaddle = new Paddle(800 / 2 - 40, 600 - 35, "horizontal");


