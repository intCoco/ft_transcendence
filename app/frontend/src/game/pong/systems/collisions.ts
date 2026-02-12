import { game } from "../core/state.js";
import { Paddle, bottomPaddle, leftPaddle, rightPaddle, topPaddle } from "../entities/paddle.js";
import { ball, resetBall } from "../entities/ball.js";
import { GameModifiers } from "../modifiers/modifiers.js";
import { goal } from "../modifiers/arena.js";
import { updateAIZone } from "../ai/ai.js";
import { bottomController, leftController, rightController, topController } from "../game.js";
import { PlayerController } from "../controllers/playerController.js";
import { spawnGoalExplosion, spawnParticles } from "../entities/particles.js";
import { AIController } from "../controllers/aiController.js";
import { applyAngularBounce } from "../modifiers/angularBounce.js";
import { applySpeedIncrease } from "../modifiers/speedIncrease.js";
import { bounce } from "../modifiers/modifiers.js";
import { ARENA_MARGIN_LEFT, ARENA_MARGIN_RIGHT, ARENA_MARGIN_TOP } from "../core/constants.js";


export interface CollisionResult {
    hit: boolean;
    side?: "left" | "right" | "top" | "bottom";
    paddle?: Paddle;
}

function testPaddleCollision(paddle: Paddle, prevX: number, prevY: number, currX: number, currY: number): { hit: boolean; side?: "left" | "right" | "top" | "bottom" } {
    const left = paddle.x;
    const right = paddle.x + paddle.width;
    const top = paddle.y;
    const bottom = paddle.y + paddle.height;

    if (currX + ball.radius < left || currX - ball.radius > right
        || currY + ball.radius < top || currY - ball.radius > bottom) {
        return { hit: false, side: undefined };
    }

    if (prevX + ball.radius <= left && currX + ball.radius >= left)
        return { hit: true, side: "left" };

    if (prevX - ball.radius >= right && currX - ball.radius <= right)
        return { hit: true, side: "right" };

    if (prevY + ball.radius <= top && currY + ball.radius >= top)
        return { hit: true, side: "top" };

    if (prevY - ball.radius >= bottom && currY - ball.radius <= bottom)
        return { hit: true, side: "bottom" };

    if (paddle.orientation === "vertical")
        return { hit: true, side: currY < top ? "top" : "bottom" };
    else
        return { hit: true, side: currX < left ? "left" : "right" };
}

export function checkPaddleCollision(paddles: Paddle[], prevX: number, prevY: number, currX: number, currY: number): CollisionResult {
    let nearest: Paddle | null = null;
    let minDist = Infinity;

    for (const paddle of paddles) {
        const cx = paddle.x + paddle.width / 2;
        const cy = paddle.y + paddle.height / 2;

        const dist = paddle.orientation === "vertical" ? Math.abs(currX - cx) : Math.abs(currY - cy);

        if (dist > Math.max(paddle.width, paddle.height) + ball.radius + 20)
            continue;

        if (dist < minDist) {
            minDist = dist;
            nearest = paddle;
        }
    }


    if (!nearest) return { hit: false, side: undefined };

    const res = testPaddleCollision(nearest, prevX, prevY, currX, currY);

    if (!res.hit) return { hit: false, side: undefined };

    return { hit: true, side: res.side, paddle: nearest };
}

export function handleTopBotCollision(modifiers: GameModifiers) {
    if (game.mode === "2P") {
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
    } else {
        if (ball.y - ball.radius < 0) { // top side
            if (ball.x >= goal.left && ball.x <= goal.right) {
                if (ball.y < 0 - ARENA_MARGIN_TOP - ball.radius * 2 && !game.isGameOver) {
                    if (game.lastHitPaddle !== topPaddle) game.lastHitPaddle!.controller!.score++;
                    else game.penultimateHitPaddle!.controller!.score++;
                    spawnGoalExplosion("top");
                    resetBall("top");
                }
            } else { // side collisions
                if (Math.abs(ball.y) <= (ball.x < goal.left ? Math.abs(ball.x - goal.left) : Math.abs(goal.right - ball.x))) {
                    ball.y = ball.radius;
                    ball.velY *= -1;
                    ball.spin = 0;
                    spawnParticles("horizontal");
                }
            }
        }

        if (ball.y + ball.radius > game.height) { // bottom side
            if (ball.x >= goal.left && ball.x <= goal.right) {
                if (ball.y > game.height + ARENA_MARGIN_TOP + ball.radius * 2 && !game.isGameOver) {
                    if (game.lastHitPaddle !== bottomPaddle) game.lastHitPaddle!.controller!.score++;
                    else game.penultimateHitPaddle!.controller!.score++;
                    spawnGoalExplosion("bottom");
                    resetBall("bottom");
                }
            } else {
                if (Math.abs(game.height - ball.y) <= (ball.x < goal.left ? Math.abs(ball.x - goal.left) : Math.abs(goal.right - ball.x))) {
                    ball.y = game.height - ball.radius;
                    ball.velY *= -1;
                    ball.spin = 0;
                    spawnParticles("horizontal");
                }
            }
        }
    }

    if (!modifiers.arena) return;

    // left tunnel
    if (ball.x <= 0) {
        if (ball.y - ball.radius <= goal.top && Math.abs(ball.y - goal.top) < Math.abs(ball.x)) {
            ball.y = goal.top + ball.radius;
            ball.velY *= -1;
            ball.spin = 0;
            spawnParticles("horizontal");
        }
        if (ball.y + ball.radius >= goal.bottom && Math.abs(goal.bottom - ball.y) < Math.abs(ball.x)) {
            ball.y = goal.bottom - ball.radius;
            ball.velY *= -1;
            ball.spin = 0;
            spawnParticles("horizontal");
        }
    }

    // right tunnel
    if (ball.x >= game.width) {
        if (ball.y - ball.radius <= goal.top && Math.abs(ball.y - goal.top) < Math.abs(game.width - ball.x)) {
            ball.y = goal.top + ball.radius;
            ball.velY *= -1;
            ball.spin = 0;
            spawnParticles("horizontal");
        }
        if (ball.y + ball.radius >= goal.bottom && Math.abs(goal.bottom - ball.y) < Math.abs(game.width - ball.x)) {
            ball.y = goal.bottom - ball.radius;
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
        if ((modifiers.arena && ball.y >= goal.top && ball.y <= goal.bottom) || !modifiers.arena) {
            if (ball.x < 0 - ARENA_MARGIN_LEFT - ball.radius * 2 && !game.isGameOver) {
                if (game.lastHitPaddle !== leftPaddle) game.lastHitPaddle!.controller!.score++;
                else game.penultimateHitPaddle!.controller!.score++;
                spawnGoalExplosion("left");
                resetBall("left");
            }
        } else { // if arena modifiers, side collisions
            if (Math.abs(ball.x) <= (ball.y < goal.top ? Math.abs(ball.y - goal.top) : Math.abs(goal.bottom - ball.y))) {
                ball.x = ball.radius;
                ball.velX *= -1;
                ball.spin = 0;
                spawnParticles("vertical");
            }
        }
    }

    if (ball.x + ball.radius > game.width) { // right side
        if ((modifiers.arena && ball.y >= goal.top && ball.y <= goal.bottom) || !modifiers.arena) {
            if (ball.x > game.width + ARENA_MARGIN_RIGHT + ball.radius * 2 && !game.isGameOver) {
                if (game.lastHitPaddle !== rightPaddle) game.lastHitPaddle!.controller!.score++;
                else game.penultimateHitPaddle!.controller!.score++;
                spawnGoalExplosion("right");
                resetBall("right");
            }
        } else {
            if (Math.abs(game.width - ball.x) <= (ball.y < goal.top ? Math.abs(ball.y - goal.top) : Math.abs(goal.bottom - ball.y))) {
                ball.x = game.width - ball.radius;
                ball.velX *= -1;
                ball.spin = 0;
                spawnParticles("vertical");
            }
        }
    }

    if (game.mode !== "4P") return;

    // top tunnel
    if (ball.y <= 0) {
        if (ball.x - ball.radius <= goal.left && Math.abs(ball.x - goal.left) < Math.abs(ball.y)) {
            ball.x = goal.left + ball.radius;
            ball.velX *= -1;
            ball.spin = 0;
            spawnParticles("vertical");
        }
        if (ball.x + ball.radius >= goal.right && Math.abs(goal.right - ball.x) < Math.abs(ball.y)) {
            ball.x = goal.right - ball.radius;
            ball.velX *= -1;
            ball.spin = 0;
            spawnParticles("vertical");
        }
    }

    // bottom tunnel
    if (ball.y >= game.height) {
        if (ball.x - ball.radius <= goal.left && Math.abs(ball.x - goal.left) < Math.abs(game.height - ball.y)) {
            ball.x = goal.left + ball.radius;
            ball.velX *= -1;
            ball.spin = 0;
            spawnParticles("vertical");
        }
        if (ball.x + ball.radius >= goal.right && Math.abs(goal.right - ball.x) < Math.abs(game.height - ball.y)) {
            ball.x = goal.right - ball.radius;
            ball.velX *= -1;
            ball.spin = 0;
            spawnParticles("vertical");
        }
    }
}

export function handlePaddleCollision(now: number, modifiers: GameModifiers) {
    const paddles = game.mode === "4P" ? [leftPaddle, rightPaddle, topPaddle, bottomPaddle] : [leftPaddle, rightPaddle];
    let collision = checkPaddleCollision(paddles, ball.prevX, ball.prevY, ball.x, ball.y);

    if (!collision.hit || !collision.paddle) return;

    const paddle = collision.paddle;
    if (game.lastHitPaddle !== paddle) {
        game.penultimateHitPaddle = game.lastHitPaddle;
        game.lastHitPaddle = paddle;
    }

    let controller;
    if (paddle === leftPaddle) controller = leftController;
    else if (game.mode === "4P" && paddle === topPaddle) controller = topController;
    else if (game.mode === "4P" && paddle === bottomPaddle) controller = bottomController;
    else controller = rightController;

    if (collision.side === "left" || collision.side === "right") {
        if (collision.side === "left" && ball.velX > 0 || collision.side === "right" && ball.velX < 0)
            ball.x = ball.prevX;
        ball.velX *= (collision.side === "left" ? (ball.velX > 0 ? -1 : 1) : (ball.velX > 0 ? 1 : -1));
        spawnParticles("vertical");
    } else {
        if (collision.side === "top" && ball.velY > 0 || collision.side === "bottom" && ball.velY < 0)
            ball.y = ball.prevY;
        ball.velY *= (collision.side === "top" ? (ball.velY > 0 ? -1 : 1) : (ball.velY > 0 ? 1 : -1));
        spawnParticles("horizontal");
    }

    if (modifiers.paddleBounceAngle && paddle)
        applyAngularBounce(paddle);

    if (modifiers.increaseSpeed)
        applySpeedIncrease();

    // spin management
    if (modifiers.spin && collision.side === paddle.front) {
        if (controller instanceof PlayerController) {
            if (controller.isUpPressed()) {
                ball.spin = (controller.paddle === leftPaddle || (game.mode === "4P" && controller.paddle === bottomPaddle)) ? 0.7 : -0.7;
                if (game.mode === "2P") bounce(ball, -0.6747, "vertical");
                else bounce(ball, -0.785398, controller.paddle.orientation);
            }
            else if (controller.isDownPressed()) {
                ball.spin = (controller.paddle === leftPaddle || (game.mode === "4P" && controller.paddle === bottomPaddle)) ? -0.7 : 0.7;
                if (game.mode === "2P") bounce(ball, 0.6747, "vertical");
                else bounce(ball, 0.785398, controller.paddle.orientation);
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
            }
        } else if (controller instanceof AIController && controller.state.wantsSpin) {
            const dir = controller.state.spinDir === "up" ? 1 : -1;

            ball.spin = dir * 0.7;
            const angle = dir * 0.6747;
            bounce(ball, angle, "vertical");

            controller.state.wantsSpin = false;
            controller.state.spinDir = false;
        } else
            ball.spin = 0;
    }
}