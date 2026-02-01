import { AIController } from "../controllers/aiController.js";
import { GAME_HEIGHT, GAME_WIDTH } from "../core/constants.js";
import { ball } from "../entities/ball.js";
import { Paddle } from "../entities/paddle.js";


export interface AIProfile {
    reactionTime: number;
    maxSpeedFactor: number;
    zoneError: number;
    stickiness: number;
    anticipation: boolean;
    spinChance: number;
}


export const AI_EASY: AIProfile = {
    reactionTime: 0.4,
    maxSpeedFactor: 0.8,
    zoneError: 220,
    stickiness: 0.7,
    anticipation: true,
    spinChance: 0
};

export const AI_NORMAL: AIProfile = {
    reactionTime: 0.3,
    maxSpeedFactor: 0.9,
    zoneError: 200,
    stickiness: 0.5,
    anticipation: true,
    spinChance: 0.5
};

export const AI_HARD: AIProfile = {
    reactionTime: 0.2,
    maxSpeedFactor: 1,
    zoneError: 150,
    stickiness: 0.45,
    anticipation: true,
    spinChance: 0.75
};



// export const aiState: AIState = {
//     zoneCenter: GAME_HEIGHT / 2,
//     zoneRadius: 200,
//     aimY: GAME_HEIGHT / 2,
//     nextDecisionTime: 0,
//     nextReactionTime: 0,
//     wantsSpin: false,
//     spinDir: false
// };


export function predictBallY(paddle: Paddle): number {
    let y = ball.y;
    let vy = ball.velY * ball.speedCoef;
    let x = ball.x;
    let vx = ball.velX * ball.speedCoef;

    const isRightPaddle = paddle.x > GAME_WIDTH / 2;
    const isBallComing =
        (isRightPaddle && vx > 0) ||
        (!isRightPaddle && vx < 0);

    if (!isBallComing)
        return y;

    const timeToPaddle = (paddle.x - x - ball.radius) / vx;
    let predictedY = y + vy * timeToPaddle;

    while (predictedY - ball.radius < 0 || predictedY + ball.radius > GAME_HEIGHT) {
        if (predictedY - ball.radius < 0)
            predictedY = -predictedY + 2 * ball.radius;
        else
            predictedY = 2 * (GAME_HEIGHT - ball.radius) - predictedY;
    }

    return predictedY;
}


export function updateAIZone(controller: AIController, now: number) {
    const isRightPaddle = controller.paddle.x > GAME_WIDTH / 2;
    const isBallComing =
        (isRightPaddle && ball.velX > 0) ||
        (!isRightPaddle && ball.velX < 0);

    const distance = isBallComing ? Math.abs(controller.paddle.x - ball.x) : GAME_WIDTH;
    const t = Math.min(1, distance / GAME_WIDTH);

    const baseRadius = controller.profile.zoneError;
    const minRadius = controller.paddle.height / 3;

    controller.state.zoneRadius = minRadius + baseRadius * t;

    if (controller.profile.anticipation && isBallComing)
        controller.state.zoneCenter = predictBallY(controller.paddle);
    else
        controller.state.zoneCenter = ball.y;
}


export function updateAIAim(controller: AIController, now: number) {
    if (now < controller.state.nextReactionTime) return;
    if (now < controller.state.nextDecisionTime) return;

    const offset = (Math.random() * 2 - 1) * controller.state.zoneRadius;
    controller.state.aimY = controller.state.zoneCenter + offset;

    if (controller.state.wantsSpin) {
        controller.state.aimY = controller.state.zoneCenter + (controller.state.spinDir === "up" ? -50 : 50);
    }

    controller.state.aimY += ball.spin ? (ball.spin > 0 ? 5 : -5) : 0;

    controller.state.nextDecisionTime = now + controller.profile.stickiness;
}


export function updateAIMovement(controller: AIController, delta: number) {
    const isRightPaddle = controller.paddle.x > GAME_WIDTH / 2;
    const isBallComing =
        (isRightPaddle && ball.velX > 0) ||
        (!isRightPaddle && ball.velX < 0);

    if (!isBallComing) {
        controller.state.aimY = GAME_HEIGHT / 2;
    }

    const paddleCenter = controller.paddle.y + controller.paddle.height / 2;
    let targetY = controller.state.aimY;

    let speed =
        controller.paddle.speed *
        controller.profile.maxSpeedFactor *
        (!isBallComing ? 0.4 : 1) *
        (isBallComing &&
        (paddleCenter > controller.state.zoneCenter - controller.state.zoneRadius) &&
        (paddleCenter < controller.state.zoneCenter + controller.state.zoneRadius) &&
        !controller.state.wantsSpin ? 0.5 : 1);

    // spin
    if (controller.state.wantsSpin && isBallComing) {
        const timeToImpact =
            Math.abs(controller.paddle.x - ball.x) / (Math.abs(ball.velX) * ball.speedCoef);

        if (timeToImpact < 0.20 + (Math.random() - 0.5) * 0.2) {
            targetY += (controller.state.spinDir === "up" ? 100 : -100);
            speed *= 1.2;
        }
        else {
            let t = (Math.abs(controller.state.zoneCenter - paddleCenter) - 5) / (200 - 5);
            t = Math.max(0, Math.min(1, t));
            speed *= 0.6 + (1 - 0.6) * t * t;
        }
    }

    const diff = targetY - paddleCenter;
    if (Math.abs(diff) < 8) return;

    const direction = diff > 0 ? 1 : -1;

    controller.paddle.y += direction * speed * delta;

    controller.paddle.y = Math.max(
        0,
        Math.min(GAME_HEIGHT - controller.paddle.height, controller.paddle.y)
    );
}
