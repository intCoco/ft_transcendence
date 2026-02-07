import { AIController } from "../controllers/aiController.js";
import { game } from "../core/state.js";
import { ball } from "../entities/ball.js";
import { Paddle } from "../entities/paddle.js";


export interface AIProfile {
	reactionDist: number;
	// reactionTime: number;
	// maxSpeedFactor: number;
	zoneError: number;
	stickiness: number;
	anticipation: boolean;
	spinChance: number;
}


export const AI_EASY: AIProfile = {
    reactionDist: game.width / 2,
    // reactionTime: 0.6,
    // maxSpeedFactor: 0.8,
    zoneError: 40,
    stickiness: 0.6,
    anticipation: false,
    spinChance: 0
};

export const AI_NORMAL: AIProfile = {
    reactionDist: game.width - game.width / 4,
    // reactionTime: 0.3,
    // maxSpeedFactor: 0.9,
    zoneError: 30,
    stickiness: 0.6,
    anticipation: true,
    spinChance: 0.4
};

export const AI_HARD: AIProfile = {
    reactionDist: game.width - game.width / 6,
    // reactionTime: 0.2,
    // maxSpeedFactor: 1,
    zoneError: 20,
    stickiness: 0.5,
    anticipation: true,
    spinChance: 0.7
};



// export const aiState: AIState = {
//     zoneCenter: game.height / 2,
//     zoneRadius: 200,
//     aimY: game.height / 2,
//     nextDecisionTime: 0,
//     nextReactionTime: 0,
//     wantsSpin: false,
//     spinDir: false
// };


// export function predictBallY(paddle: Paddle): number {
//     let y = ball.y;
//     let vy = ball.velY * ball.speedCoef;
//     let x = ball.x;
//     let vx = ball.velX * ball.speedCoef;

//     const isRightPaddle = paddle.x > game.width / 2;
//     const isBallComing =
//         (isRightPaddle && vx > 0) ||
//         (!isRightPaddle && vx < 0);

//     if (!isBallComing)
//         return y;

//     const timeToPaddle = (paddle.x - x - ball.radius) / vx;
//     let predictedY = y + vy * timeToPaddle;

//     while (predictedY - ball.radius < 0 || predictedY + ball.radius > game.height) {
//         if (predictedY - ball.radius < 0)
//             predictedY = -predictedY + 2 * ball.radius;
//         else
//             predictedY = 2 * (game.height - ball.radius) - predictedY;
//     }

//     return predictedY;
// }

export function predictBallY(controller: AIController, paddle: Paddle): number {
    let x = ball.x;
    let y = ball.y;
    let vx = ball.velX * ball.speedCoef;
    let vy = ball.velY * ball.speedCoef;

    const isRight = paddle.x > game.width / 2;
    const isBallComing = (isRight && vx > 0) || (!isRight && vx < 0);

    if (!isBallComing) return y;

    const MAX_ANGLE = game.mode === "4P" ? 0.786 : 0.728;
    let angle = Math.abs(Math.atan2(vy, vx));

    const dt = 1 / 240;

    while ((isRight && x < paddle.x) || (!isRight && x > paddle.x)) {
        // spin
        if (ball.spin && angle < MAX_ANGLE) {
            const nvx = vx * Math.cos(ball.spin * dt) - vy * Math.sin(ball.spin * dt);
            const nvy = vx * Math.sin(ball.spin * dt) + vy * Math.cos(ball.spin * dt);

            vx = nvx;
            vy = nvy;

            angle = Math.abs(Math.atan2(vy, vx));
        }
        x += vx * dt;
        y += vy * dt;

        // wall bounce
		if (controller.profile.anticipation) {
			if (y - ball.radius < 0) {
				y = ball.radius * 2 - y;
				vy *= -1;
			} else if (y + ball.radius > game.height) {
				y = 2 * (game.height - ball.radius) - y;
				vy *= -1;
			}
		}
    }

    return y;
}



export function updateAIZone(controller: AIController, now: number) {
    const isRightPaddle = controller.paddle.x > game.width / 2;
    const isBallComing = (isRightPaddle && ball.velX > 0) || (!isRightPaddle && ball.velX < 0);

    const distance = isBallComing ? Math.abs(controller.paddle.x - ball.x) : game.width;
    const t = Math.min(1, distance / game.width);

    // const baseRadius = controller.profile.zoneError;
    // const minRadius = controller.paddle.height / 3;

    controller.state.zoneRadius = controller.profile.zoneError + 200 * t;

    // if (controller.profile.anticipation && isBallComing)
        controller.state.zoneCenter = predictBallY(controller, controller.paddle);
    // else
    //     controller.state.zoneCenter = ball.y;
}


export function updateAIAim(controller: AIController, now: number) {
    // if (now < controller.state.nextReactionTime) return;
    if (now < controller.state.nextDecisionTime) return;

	if (Math.abs(controller.paddle.x - ball.x) > controller.profile.reactionDist) return;

    const offset = (Math.random() * 2 - 1) * controller.state.zoneRadius;
    controller.state.aimY = controller.state.zoneCenter + offset;

    if (controller.state.wantsSpin) {
        controller.state.aimY = controller.state.zoneCenter + (controller.state.spinDir === "up" ? -50 : 50) + offset;
    }

    const distance = Math.abs(ball.x - controller.paddle.x);
	const t = Math.min(1, distance / game.width);

	const minDelay = controller.profile.stickiness * 0.4;
	const maxDelay = controller.profile.stickiness * 2;

	const delay = minDelay + (maxDelay - minDelay) * t;

	controller.state.nextDecisionTime = now + delay;
}


export function updateAIMovement(controller: AIController, delta: number) {
    const isRightPaddle = controller.paddle.x > game.width / 2;
    const isBallComing = (isRightPaddle && ball.velX > 0) || (!isRightPaddle && ball.velX < 0);

    if (!isBallComing && controller.profile.anticipation) 
		controller.state.aimY = game.height / 2;

    const paddleCenter = controller.paddle.y + controller.paddle.height / 2;
    let targetY = controller.state.aimY;

    // let speed =
    //     controller.paddle.speed *
    //     controller.profile.maxSpeedFactor *
    //     (!isBallComing ? 0.4 : 1) *
    //     (isBallComing &&
    //     (paddleCenter > controller.state.zoneCenter - controller.state.zoneRadius) &&
    //     (paddleCenter < controller.state.zoneCenter + controller.state.zoneRadius) &&
    //     !controller.state.wantsSpin ? 0.5 : 1);

    // spin
    if (controller.state.wantsSpin && isBallComing) {
        const timeToImpact =
            Math.abs(controller.paddle.x - ball.x) / (Math.abs(ball.velX) * ball.speedCoef);

        if (timeToImpact < 0.20 + (Math.random() - 0.5) * 0.2) {
            targetY += (controller.state.spinDir === "up" ? 100 : -100);
            // speed *= 1.2;
        }
        else {
            let t = (Math.abs(controller.state.zoneCenter - paddleCenter) - 5) / (200 - 5);
            t = Math.max(0, Math.min(1, t));
            // speed *= 0.6 + (1 - 0.6) * t * t;
        }
    }

    const diff = targetY - paddleCenter;
    if (Math.abs(diff) < 8) return;

    if (diff > 0)
        controller.paddle.moveDown(delta);
    else if (diff < 0)
        controller.paddle.moveUp(delta);
    // const direction = diff > 0 ? 1 : -1;

    // controller.paddle.y += direction * speed * delta;

    controller.paddle.clampY(game.height);
}
