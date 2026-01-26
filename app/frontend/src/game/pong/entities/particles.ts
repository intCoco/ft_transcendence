import { ball } from "../entities/ball.js";
import { GAME_HEIGHT, GAME_WIDTH, ARENA_MARGIN_TOP, ARENA_MARGIN_LEFT, ARENA_MARGIN_RIGHT } from "../core/constants.js";
import { GOAL_TOP, GOAL_HEIGHT, GOAL_BOTTOM } from "../modifiers/arena.js";
import { gameConfig } from "../modifiers/modifiers.js";
import { Paddle, leftPaddle, rightPaddle } from "../entities/paddle.js";


interface Particle {
	x: number;
	y: number;
	prevX: number;
	prevY: number;
	velX: number;
	velY: number;
	life: number;
	alpha: number;
}

export const particles: Particle[] = [];

/**
 * Spawn particles from ball collision
 */
export function spawnParticles(side: "horizontal" | "vertical") {
	const numParticles = 20 + Math.floor(Math.random() * 10);

	let nx = 0, ny = 0;
	if (side === "horizontal") ny = ball.velY > 0 ? -1 : 1;
	else nx = ball.velX > 0 ? -1 : 1;

	const dot = ball.velX * nx + ball.velY * ny;
	const reflectedX = ball.velX - 2 * dot * nx;
	const reflectedY = ball.velY - 2 * dot * ny;
	const speed = Math.sqrt(reflectedX ** 2 + reflectedY ** 2);

	for (let i = 0; i < numParticles; i++) {
		const angle = Math.atan2(reflectedY, reflectedX);
		const angleOffset = (Math.random() * Math.PI / 3) - Math.PI / 6;
		const finalAngle = angle + angleOffset;
		const particleSpeed = speed * (0.3 + Math.random() * 0.7);

		particles.push({
			x: ball.x,
			y: ball.y,
			prevX: ball.x,
			prevY: ball.y,
			velX: Math.cos(finalAngle) * particleSpeed,
			velY: Math.sin(finalAngle) * particleSpeed,
			life: 0.4 + Math.random() * 0.4,
			alpha: 1
		});
	}
}

function handleParticleTopBotCollision(p: Particle) {
	if (p.y <= 0) {
		p.y = 0;
		p.velY *= -0.5;
	}

	if (p.y >= GAME_HEIGHT) {
		p.y = GAME_HEIGHT;
		p.velY *= -0.5;
	}

	if (!gameConfig.modifiers.arena) return;

	// left tunnel
	if (p.x <= 0) {
		if (p.y <= GOAL_TOP && Math.abs(p.y - GOAL_TOP) < Math.abs(p.x)) {
			p.y = GOAL_TOP;
			p.velY *= -0.5;
		}
		if (p.y >= GOAL_BOTTOM && Math.abs(GOAL_BOTTOM - p.y) < Math.abs(p.x)) {
			p.y = GOAL_BOTTOM;
			p.velY *= -0.5;
		}
	}

	// right tunnel
	if (p.x >= GAME_WIDTH) {
		if (p.y <= GOAL_TOP && Math.abs(p.y - GOAL_TOP) < Math.abs(GAME_WIDTH - p.x)) {
			p.y = GOAL_TOP;
			p.velY *= -0.5;
		}
		if (p.y >= GOAL_BOTTOM && Math.abs(GOAL_BOTTOM - p.y) < Math.abs(GAME_WIDTH - p.x)) {
			p.y = GOAL_BOTTOM;
			p.velY *= -0.5;
		}
	}
}

function handleParticleLeftRightCollision(p: Particle) {
	// left side
	if (p.x < 0) {
		if (gameConfig.modifiers.arena && p.y >= GOAL_TOP && p.y <= GOAL_BOTTOM || !gameConfig.modifiers.arena) {
			return;
		} else {
			if (Math.abs(p.x) <= (p.y < GOAL_TOP ? Math.abs(p.y - GOAL_TOP) : Math.abs(GOAL_BOTTOM - p.y))) {
				p.x = 0;
				p.velX *= -0.5;
			}
		}
	}

	// right side
	if (p.x > GAME_WIDTH) {
		if ((gameConfig.modifiers.arena && p.y >= GOAL_TOP && p.y <= GOAL_BOTTOM) || !gameConfig.modifiers.arena) { // COLLISION ALORS QUE PAS DARENA
			return;
		} else {
			if (Math.abs(GAME_WIDTH - p.x) <= (p.y < GOAL_TOP ? Math.abs(p.y - GOAL_TOP) : Math.abs(GOAL_BOTTOM - p.y))) {
				p.x = GAME_WIDTH;
				p.velX *= -0.5;
			}
		}
	}
}

function testParticlePaddleCollision(p: Particle, paddle: Paddle): { hit: boolean; side: "vertical" | "horizontal" } {
	const left = paddle.x;
	const right = paddle.x + paddle.width;
	const top = paddle.y;
	const bottom = paddle.y + paddle.height;

	if (p.x < left || p.x > right || p.y < top || p.y > bottom) {
		return { hit: false, side: "horizontal" };
	}

	if (p.prevX <= left && p.x >= left) return { hit: true, side: "vertical" };
	if (p.prevX >= right && p.x <= right) return { hit: true, side: "vertical" };
	if (p.prevY <= top && p.y >= top) return { hit: true, side: "horizontal" };
	if (p.prevY >= bottom && p.y <= bottom) return { hit: true, side: "horizontal" };

	return { hit: true, side: "horizontal" };
}

function handleParticlePaddleCollision(p: Particle) {
	for (const paddle of [leftPaddle, rightPaddle]) {
		const res = testParticlePaddleCollision(p, paddle);
		if (!res.hit) continue;

		if (res.side === "vertical") {
			p.velX *= -0.5;
			p.x = p.prevX;
		} else {
			p.velY *= -0.5;
			p.y = p.prevY;
		}
	}
}

export function updateParticles(delta: number, ctx: CanvasRenderingContext2D) {
	for (let i = particles.length - 1; i >= 0; i--) {
		const p = particles[i];

		p.prevX = p.x;
		p.prevY = p.y;

		p.x += p.velX * delta;
		p.y += p.velY * delta;

		p.velX *= 0.95;
		p.velY *= 0.95;

		handleParticleTopBotCollision(p);
		handleParticleLeftRightCollision(p);
		handleParticlePaddleCollision(p);

		p.life -= delta;
		p.alpha = Math.max(0, p.life / 0.6);

		ctx.save();
		ctx.globalAlpha = p.alpha;
		ctx.fillStyle = "cyan";
		ctx.beginPath();
		ctx.arc(
			p.x + ARENA_MARGIN_LEFT,
			p.y + ARENA_MARGIN_TOP,
			2 + Math.random() * 2,
			0,
			Math.PI * 2
		);
		ctx.fill();
		ctx.restore();

		if (p.life <= 0) particles.splice(i, 1);
	}
}

export function spawnGoalExplosion(side: "left" | "right") {
	const startX = side === "left" ? 0 - ARENA_MARGIN_LEFT : GAME_WIDTH + ARENA_MARGIN_RIGHT;
	const minY = gameConfig.modifiers.arena ? GOAL_TOP : GAME_HEIGHT * 0.05;
	const maxY = gameConfig.modifiers.arena ? GOAL_BOTTOM : GAME_HEIGHT * 0.95;

	for (let i = 0; i < 80 + Math.floor(Math.random() * 40); i++) {
		const y = minY + Math.random() * (maxY - minY);
		const angle = side === "left" ? (Math.random() - 0.5) * Math.PI / 2 : Math.PI + (Math.random() - 0.5) * Math.PI / 2;
		const speed = 600 + Math.random() * 500;

		particles.push({
			x: startX,
			y,
			prevX: startX,
			prevY: y,
			velX: Math.cos(angle) * speed,
			velY: Math.sin(angle) * speed,
			life: 0.6 + Math.random() * 0.5,
			alpha: 1
		});
	}
}

