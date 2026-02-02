import { game } from "../core/state.js";
import { GameState, MAX_POINTS } from "../core/constants.js";
import { bottomPaddle, leftPaddle, rightPaddle, topPaddle } from "./paddle.js";
import { bottomController, endGame, leftController, rightController, topController } from "../game.js";
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

export function resetBall(side: "left" | "right" | "top" | "bottom") {
    for (const controller of [leftController, rightController, topController, bottomController]) {
        if (controller.score >= MAX_POINTS) {
            endGame();
            return;
        }
    }
    if (side === "top") {
        ball.y = topPaddle.y + topPaddle.height + 4 * topPaddle.height;
        game.lastHitPaddle = topPaddle;
    }
    else if (side === "bottom") {
        ball.y = bottomPaddle.y - 4 * bottomPaddle.height;
        game.lastHitPaddle = bottomPaddle;
    }
    else if (side === "right") {
        ball.x = rightPaddle.x - 4 * rightPaddle.width;
        game.lastHitPaddle = rightPaddle;
    }
    else if (side === "left") { 
        ball.x = leftPaddle.x + leftPaddle.width + 4 * leftPaddle.width;
        game.lastHitPaddle = leftPaddle;
    }

    if (side === "left" || side === "right") ball.y = game.height / 2;
    else ball.x = game.width / 2;

    if (leftController instanceof AIController) {
        leftController.state.wantsSpin = false;
        leftController.state.spinDir = false;
    }
    if (rightController instanceof AIController) {
        rightController.state.wantsSpin = false;
        rightController.state.spinDir = false;
    }

    if (game.mode === "2P" || side === "left" || side === "right") {
        const direction = side === "left" ? 1 : -1;

        ball.velX = (game.mode === "2P" ? 300 : 255) * direction;
        ball.velY = (Math.random() < 0.5 ? -1 : 1) * (game.mode === "2P" ? 210 : 255);
    } else {
        const direction = side === "top" ? 1 : -1;

        ball.velY = 300 * direction;
        ball.velX = (Math.random() < 0.5 ? -1 : 1) * 300;
    }

    ball.speedCoef = 1;
    ball.spin = 0;

    game.ctx!.fillStyle = "#0a0214";
    game.ctx!.fillRect(0, 0, game.canvasWidth, game.canvasHeight);

    game.serveTimer = 3;
    game.state = GameState.SERVE;
}

