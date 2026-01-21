// entities/ball.ts

import { game } from "../core/state.js";
import { GAME_HEIGHT, GAME_WIDTH, GameState } from "../core/constants.js";
import { leftPaddle, rightPaddle } from "./paddle.js";
import { leftController, rightController } from "../game.js";
import { AIController } from "../controllers/aiController.js";

export interface Ball {
    x: number;
    y: number;
    prevX: number;
    prevY: number;
    radius: number;
    velX: number;
    velY: number;
    speedCoef: number;
    spin: number;
}

export const ball: Ball = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    prevX: 0,
    prevY: 0,
    radius: 8,
    velX: 300,
    velY: 210,
    speedCoef: 1,
    spin: 0
};


export function resetBall(scorer: "left" | "right") {
    ball.x =
        scorer === "left"
            ? rightPaddle.x - 4 * rightPaddle.width
            : leftPaddle.x + leftPaddle.width + 4 * leftPaddle.width;

    if (leftController instanceof AIController) {
        leftController.state.wantsSpin = false;
        leftController.state.spinDir = false;
    }
    if (rightController instanceof AIController) {
        rightController.state.wantsSpin = false;
        rightController.state.spinDir = false;
    }

    ball.y = GAME_HEIGHT / 2;

    const direction = scorer === "left" ? -1 : 1;

    ball.velX = 300 * direction;
    ball.velY = (Math.random() < 0.5 ? -1 : 1) * 210;
    ball.speedCoef = 1;
    ball.spin = 0;

    game.serveTimer = 3;
    game.state = GameState.SERVE;
}


// export let ball: Ball;
