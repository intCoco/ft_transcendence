import { game } from "../core/state.js";
import { GameState } from "../core/constants.js";
import { leftPaddle, rightPaddle } from "./paddle.js";
import { leftController, rightController } from "../game.js";
import { AIController } from "../controllers/aiController.js";
import { gameConfig } from "../modifiers/modifiers.js";
import { applySpin } from "../modifiers/spin.js";
import { handleLeftRightCollision, handlePaddleCollision, handleTopBotCollision } from "../systems/collisions.js";

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
    x: game.width / 2,
    y: game.height / 2,
    prevX: 0,
    prevY: 0,
    radius: 8,
    velX: 300,
    velY: 210,
    speedCoef: 1,
    spin: 0
};

export function updateBall(now: number, delta: number) {
    if (game.state === GameState.END) { ball.velX /= 1.05; ball.velY /= 1.05; }
    
    ball.prevX = ball.x; // save ball position before moving for anti tunneling
    ball.prevY = ball.y;
    if (gameConfig.modifiers.spin)
        applySpin(delta);
    ball.x += ball.velX * ball.speedCoef * delta * (ball.spin ? 1.1 : 1); // moves the ball
    ball.y += ball.velY * ball.speedCoef * delta * (ball.spin ? 1.1 : 1); //

    // collisions: handles collisions with every collidable elements (top, bottom, paddles, ...)
    handleTopBotCollision(gameConfig.modifiers);
    handlePaddleCollision(now, gameConfig.modifiers);
    handleLeftRightCollision(gameConfig.modifiers);
}

export function resetBall(scorer: "left" | "right") {
    ball.x = scorer === "left" ? rightPaddle.x - 4 * rightPaddle.width : leftPaddle.x + leftPaddle.width + 4 * leftPaddle.width;

    if (leftController instanceof AIController) {
        leftController.state.wantsSpin = false;
        leftController.state.spinDir = false;
    }
    if (rightController instanceof AIController) {
        rightController.state.wantsSpin = false;
        rightController.state.spinDir = false;
    }

    ball.y = game.height / 2;

    const direction = scorer === "left" ? -1 : 1;

    ball.velX = 300 * direction;
    ball.velY = (Math.random() < 0.5 ? -1 : 1) * 210;
    ball.speedCoef = 1;
    ball.spin = 0;

    game.serveTimer = 3;
    game.state = GameState.SERVE;
}


// export let ball: Ball;
