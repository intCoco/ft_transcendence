import { ball } from "../entities/ball.js";
import { ARENA_MARGIN_BOTTOM, ARENA_MARGIN_LEFT, ARENA_MARGIN_RIGHT, ARENA_MARGIN_TOP } from "../core/constants.js";
import { goal } from "../modifiers/arena.js";
import { gameConfig } from "../modifiers/modifiers.js";
import { Paddle, bottomPaddle, leftPaddle, rightPaddle, topPaddle } from "../entities/paddle.js";
import { game } from "../core/state.js";


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
	if (game.mode === "2P") {
		if (p.y <= 0) {
			p.y = 0;
			p.velY *= -0.5;
		}

		if (p.y >= game.height) {
			p.y = game.height;
			p.velY *= -0.5;
		}
	}
	else {
		// top side
		if (p.y < 0) {
			if (p.x >= goal.left && p.x <= goal.right) {
				return;
			} else {
				if (Math.abs(p.y) <= (p.x < goal.left ? Math.abs(p.x - goal.left) : Math.abs(goal.right - p.x))) {
					p.y = 0;
					p.velY *= -0.5;
				}
			}
		}

		// bot side
		if (p.y > game.height) {
			if (p.x >= goal.left && p.x <= goal.right) {
				return;
			} else {
				if (Math.abs(game.height - p.y) <= (p.x < goal.left ? Math.abs(p.x - goal.left) : Math.abs(goal.right - p.x))) {
					p.y = game.height;
					p.velY *= -0.5;
				}
			}
		}
	}

	if (!gameConfig.modifiers.arena) return;

	// left tunnel
	if (p.x <= 0) {
		if (p.y <= goal.top && Math.abs(p.y - goal.top) < Math.abs(p.x)) {
			p.y = goal.top;
			p.velY *= -0.5;
		}
		if (p.y >= goal.bottom && Math.abs(goal.bottom - p.y) < Math.abs(p.x)) {
			p.y = goal.bottom;
			p.velY *= -0.5;
		}
	}

	// right tunnel
	if (p.x >= game.width) {
		if (p.y <= goal.top && Math.abs(p.y - goal.top) < Math.abs(game.width - p.x)) {
			p.y = goal.top;
			p.velY *= -0.5;
		}
		if (p.y >= goal.bottom && Math.abs(goal.bottom - p.y) < Math.abs(game.width - p.x)) {
			p.y = goal.bottom;
			p.velY *= -0.5;
		}
	}
}

function handleParticleLeftRightCollision(p: Particle) {
	// left side
	if (p.x < 0) {
		if (gameConfig.modifiers.arena && p.y >= goal.top && p.y <= goal.bottom || !gameConfig.modifiers.arena) {
			return;
		} else {
			if (Math.abs(p.x) <= (p.y < goal.top ? Math.abs(p.y - goal.top) : Math.abs(goal.bottom - p.y))) {
				p.x = 0;
				p.velX *= -0.5;
			}
		}
	}

	// right side
	if (p.x > game.width) {
		if ((gameConfig.modifiers.arena && p.y >= goal.top && p.y <= goal.bottom) || !gameConfig.modifiers.arena) {
			return;
		} else {
			if (Math.abs(game.width - p.x) <= (p.y < goal.top ? Math.abs(p.y - goal.top) : Math.abs(goal.bottom - p.y))) {
				p.x = game.width;
				p.velX *= -0.5;
			}
		}
	}

	if (game.mode === "2P") return;

	// top tunnel
	if (p.y <= 0) {
		if (p.x <= goal.left && Math.abs(p.x - goal.left) < Math.abs(p.y)) {
			p.x = goal.left;
			p.velX *= -0.5;
		}
		if (p.x >= goal.right && Math.abs(goal.right - p.x) < Math.abs(p.y)) {
			p.x = goal.right;
			p.velX *= -0.5;
		}
	}

	// bot tunnel
	if (p.y >= game.height) {
		if (p.x <= goal.left && Math.abs(p.x - goal.left) < Math.abs(p.y - game.height)) {
			p.x = goal.left;
			p.velX *= -0.5;
		}
		if (p.x >= goal.right && Math.abs(goal.right - p.x) < Math.abs(p.y - game.height)) {
			p.x = goal.right;
			p.velX *= -0.5;
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
	for (const paddle of [leftPaddle, rightPaddle, topPaddle, bottomPaddle]) {
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

export function updateParticles(delta: number) {
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

		if (p.life <= 0) particles.splice(i, 1);
	}
}

export function spawnGoalExplosion(side: "left" | "right" | "top" | "bottom") {
	const startX = side === "left" ? -ARENA_MARGIN_LEFT : side === "right" ? game.width + ARENA_MARGIN_RIGHT : undefined;
	const startY = side === "top" ? -ARENA_MARGIN_TOP : side === "bottom" ? game.height + ARENA_MARGIN_BOTTOM : undefined;

	const min = gameConfig.modifiers.arena ? goal.top : game.height * 0.05;
	const max = gameConfig.modifiers.arena ? goal.bottom : game.height * 0.95;

	for (let i = 0; i < 80 + Math.floor(Math.random() * 40); i++) {
		const x = side === "top" || side === "bottom" ? min + Math.random() * (max - min) : startX!;
		const y = side === "left" || side === "right" ? min + Math.random() * (max - min) : startY!;
		const angle =
			side === "left"
				? (Math.random() - 0.5) * Math.PI / 2
				: side === "right"
					? Math.PI + (Math.random() - 0.5) * Math.PI / 2
					: side === "top"
						? Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 2
						: -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 2;

		const speed = 600 + Math.random() * 500;

		particles.push({
			x,
			y,
			prevX: x,
			prevY: y,
			velX: Math.cos(angle) * speed,
			velY: Math.sin(angle) * speed,
			life: 0.6 + Math.random() * 0.5,
			alpha: 1
		});
	}
}

