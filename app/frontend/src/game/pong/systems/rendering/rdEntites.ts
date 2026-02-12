import { ARENA_MARGIN_LEFT, ARENA_MARGIN_TOP } from "../../core/constants";
import { game } from "../../core/state";
import { ball } from "../../entities/ball";
import { leftPaddle, rightPaddle, topPaddle, bottomPaddle } from "../../entities/paddle";
import { particles } from "../../entities/particles";

function drawPaddle(paddle: any) {
	game.ctx!.save();

	game.ctx!.lineWidth = 4;
	game.ctx!.strokeStyle = "magenta";
	game.ctx!.shadowColor = "magenta";
	game.ctx!.shadowBlur = 15;

	game.ctx!.beginPath();
	game.ctx!.roundRect(paddle.x + ARENA_MARGIN_LEFT, paddle.y + ARENA_MARGIN_TOP, paddle.width, paddle.height, 8);
	game.ctx!.stroke();

	game.ctx!.lineWidth = 3;
	game.ctx!.shadowBlur = 0;
	game.ctx!.strokeStyle = "white";
	game.ctx!.beginPath();
	game.ctx!.roundRect(paddle.x + ARENA_MARGIN_LEFT, paddle.y + ARENA_MARGIN_TOP, paddle.width, paddle.height, 8);
	game.ctx!.stroke();

	game.ctx!.restore();
}

function drawBall() {
	game.ctx!.save();

	game.ctx!.lineWidth = 4;
	game.ctx!.strokeStyle = "cyan";
	game.ctx!.shadowColor = "cyan";
	game.ctx!.shadowBlur = 20;

	game.ctx!.beginPath();
	game.ctx!.arc(ball.x + ARENA_MARGIN_LEFT, ball.y + ARENA_MARGIN_TOP, ball.radius, 0, Math.PI * 2);
	game.ctx!.stroke();

	game.ctx!.lineWidth = 2;
	game.ctx!.shadowBlur = 0;
	game.ctx!.strokeStyle = "white";
	game.ctx!.beginPath();
	game.ctx!.arc(ball.x + ARENA_MARGIN_LEFT, ball.y + ARENA_MARGIN_TOP, ball.radius, 0, Math.PI * 2);
	game.ctx!.stroke();

	game.ctx!.restore();
}

function drawParticles() {
	for (const p of particles) {
		game.ctx!.save();
		game.ctx!.globalAlpha = p.alpha;
		game.ctx!.fillStyle = "cyan";
		game.ctx!.beginPath();
		game.ctx!.arc(p.x + ARENA_MARGIN_LEFT, p.y + ARENA_MARGIN_TOP, 2 + Math.random() * 2, 0, Math.PI * 2);
		game.ctx!.fill();
		game.ctx!.restore();
	}
}

export function drawEntites() {
	drawPaddle(leftPaddle);
	drawPaddle(rightPaddle);
	if (game.mode === "4P") {
		drawPaddle(topPaddle);
		drawPaddle(bottomPaddle);
	}
	drawBall();
	drawParticles();
}
