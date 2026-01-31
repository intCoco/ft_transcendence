import { game } from "../core/state.js";
import { Paddle, leftPaddle, rightPaddle } from "../entities/paddle.js";
import { ball, resetBall } from "../entities/ball.js";
import { GameModifiers } from "../modifiers/modifiers.js";
import { GOAL_TOP, GOAL_BOTTOM } from "../modifiers/arena.js";
import { updateAIZone } from "../ai/ai.js";
import { leftController, rightController } from "../game.js";
import { PlayerController } from "../controllers/playerController.js";
import { spawnGoalExplosion, spawnParticles } from "../entities/particles.js";
import { AIController } from "../controllers/aiController.js";
import { applyAngularBounce } from "../modifiers/angularBounce.js";
import { applySpeedIncrease } from "../modifiers/speedIncrease.js";
import { bounce } from "../modifiers/modifiers.js";
import { ARENA_MARGIN_LEFT, ARENA_MARGIN_RIGHT } from "../core/constants.js";


export interface CollisionResult {
    hit: boolean;
    side: "vertical" | "horizontal";
    paddle?: Paddle;
}

function testPaddleCollision(paddle: Paddle, prevX: number, prevY: number, currX: number, currY: number): { hit: boolean; side: "vertical" | "horizontal" } {
    const left = paddle.x;
    const right = paddle.x + paddle.width;
    const top = paddle.y;
    const bottom = paddle.y + paddle.height;

    if (currX + ball.radius < left || currX - ball.radius > right
        || currY + ball.radius < top || currY - ball.radius > bottom) {
        return { hit: false, side: "horizontal" };
    }

    if (prevX + ball.radius <= left && currX + ball.radius >= left)
        return { hit: true, side: "vertical" };

    if (prevX - ball.radius >= right && currX - ball.radius <= right)
        return { hit: true, side: "vertical" };

    if (prevY + ball.radius <= top && currY + ball.radius >= top)
        return { hit: true, side: "horizontal" };

    if (prevY - ball.radius >= bottom && currY - ball.radius <= bottom)
        return { hit: true, side: "horizontal" };

    return { hit: true, side: "horizontal" };
}

export function checkPaddleCollision(paddles: Paddle[], prevX: number, prevY: number, currX: number, currY: number): CollisionResult {
    let nearest: Paddle | null = null;
    let minDist = Infinity;

    for (const paddle of paddles) {
        const paddleCenterX = paddle.x + paddle.width / 2;
        const dist = Math.abs(currX - paddleCenterX);

        if (dist > paddle.width + ball.radius + 20) continue;

        if (dist < minDist) {
            minDist = dist;
            nearest = paddle;
        }
    }

    if (!nearest) return { hit: false, side: "horizontal" };

    const res = testPaddleCollision(nearest, prevX, prevY, currX, currY);

    if (!res.hit) return { hit: false, side: "horizontal" };

    return { hit: true, side: res.side, paddle: nearest };
}

export function handleTopBotCollision(modifiers: GameModifiers) {
    if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.velY *= -1;
        ball.spin = 0;
        spawnParticles("horizontal");
    }

    if (ball.y + ball.radius >= game.height) {
        ball.y = game.height - ball.radius;
        ball.velY *= -1;
        ball.spin = 0;
        spawnParticles("horizontal");
    }

    if (!modifiers.arena) return;

    // left tunnel
    if (ball.x <= 0) {
        if (ball.y - ball.radius <= GOAL_TOP && Math.abs(ball.y - GOAL_TOP) < Math.abs(ball.x)) {
            ball.y = GOAL_TOP + ball.radius;
            ball.velY *= -1;
            ball.spin = 0;
            spawnParticles("horizontal");
        }
        if (ball.y + ball.radius >= GOAL_BOTTOM && Math.abs(GOAL_BOTTOM - ball.y) < Math.abs(ball.x)) {
            ball.y = GOAL_BOTTOM - ball.radius;
            ball.velY *= -1;
            ball.spin = 0;
            spawnParticles("horizontal");
        }
    }

    // right tunnel
    if (ball.x >= game.width) {
        if (ball.y - ball.radius <= GOAL_TOP && Math.abs(ball.y - GOAL_TOP) < Math.abs(game.width - ball.x)) {
            ball.y = GOAL_TOP + ball.radius;
            ball.velY *= -1;
            ball.spin = 0;
            spawnParticles("horizontal");
        }
        if (ball.y + ball.radius >= GOAL_BOTTOM && Math.abs(GOAL_BOTTOM - ball.y) < Math.abs(game.width - ball.x)) {
            ball.y = GOAL_BOTTOM - ball.radius;
            ball.velY *= -1;
            ball.spin = 0;
            spawnParticles("horizontal");
        }
    }
}


export function handleLeftRightCollision(modifiers: GameModifiers) {
    // handles scoring (or collision if arena modifier)
    if (ball.x - ball.radius < 0) { // left side
        // if arena modifier AND in the goals limits OR if no arena modifier, same behavior
        if ((modifiers.arena && ball.y >= GOAL_TOP && ball.y <= GOAL_BOTTOM) || !modifiers.arena) {
            if (ball.x < 0 - ARENA_MARGIN_LEFT - ball.radius * 2 && !game.isGameOver) {
                game.scoreRight++;
                spawnGoalExplosion("left");
                resetBall("right");
            }
        } else { // if arena modifiers, side collisions
            if (Math.abs(ball.x) <= (ball.y < GOAL_TOP ? Math.abs(ball.y - GOAL_TOP) : Math.abs(GOAL_BOTTOM - ball.y))) { //?
                ball.x = ball.radius;
                ball.velX *= -1;
                ball.spin = 0;
                spawnParticles("vertical");
            }
        }
    }

    if (ball.x + ball.radius > game.width) { // right side
        if ((modifiers.arena && ball.y >= GOAL_TOP && ball.y <= GOAL_BOTTOM) || !modifiers.arena) {
            if (ball.x > game.width + ARENA_MARGIN_RIGHT + ball.radius * 2 && !game.isGameOver) {
                game.scoreLeft++;
                spawnGoalExplosion("right");
                resetBall("left");
            }
        } else {
            if (Math.abs(game.width - ball.x) <= (ball.y < GOAL_TOP ? Math.abs(ball.y - GOAL_TOP) : Math.abs(GOAL_BOTTOM - ball.y))) { //?
                ball.x = game.width - ball.radius;
                ball.velX *= -1;
                ball.spin = 0;
                spawnParticles("vertical");
            }
        }
    }
}

export function handlePaddleCollision(now: number, modifiers: GameModifiers) {
    let collision = checkPaddleCollision([leftPaddle, rightPaddle], ball.prevX, ball.prevY, ball.x, ball.y);
    if (collision.hit) {
        const paddle = collision.paddle;
        const controller = paddle === leftPaddle ? leftController : rightController;
        if (collision.side === "vertical") {
            ball.velX *= -1;

            // reposition to avoid unexpected behaviors
            ball.x = ball.prevX;

            if (modifiers.paddleBounceAngle && paddle)
                applyAngularBounce(paddle, true);

            if (modifiers.increaseSpeed)
                applySpeedIncrease();

            spawnParticles("vertical");

        } else {
            ball.velY *= -1;
            spawnParticles("horizontal");

            // reposition to avoid unexpected behaviors
            ball.y = ball.prevY;
            return;

        }

        // spin management
        if (modifiers.spin) {
            if (controller instanceof PlayerController) {
                if (controller.isUpPressed()) {
                    ball.spin = controller.paddle === leftPaddle ? 0.7 : -0.7;
                    bounce(ball, -0.6747);
                }
                else if (controller.isDownPressed()) {
                    ball.spin = controller.paddle === leftPaddle ? -0.7 : 0.7;
                    bounce(ball, 0.6747);
                }
                else ball.spin = 0;
                
                
                // AI decision making
                const opponent = controller.paddle === leftPaddle ? rightController : leftController;
                if (opponent instanceof AIController) {
                    updateAIZone(opponent, now);
                    if (!ball.spin && opponent.state.zoneCenter > game.height / 4 && opponent.state.zoneCenter < game.height - game.height / 4)
                        opponent.state.wantsSpin = Math.random() < opponent.profile.spinChance;
                    if (opponent.state.wantsSpin)
                        opponent.state.spinDir = (opponent.state.zoneCenter > game.height / 2) ? (Math.random() < 0.66 ? "up" : "down") : (Math.random() < 0.66 ? "down" : "up");
                    opponent.state.nextReactionTime = now + opponent.profile.reactionTime;
                }
            } else if (controller instanceof AIController && controller.state.wantsSpin) {
                    const dir = controller.state.spinDir === "up" ? 1 : -1;

                    ball.spin = dir * 0.7;
                    const angle = dir * 0.6747;
                    bounce(ball, angle);

                    controller.state.wantsSpin = false;
                    controller.state.spinDir = false;
            } else
                    ball.spin = 0;
        }
    }
}