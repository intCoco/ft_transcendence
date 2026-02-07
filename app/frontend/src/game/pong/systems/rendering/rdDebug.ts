import { AI_HARD, AI_NORMAL } from "../../ai/ai";
import { AIController } from "../../controllers/aiController";
import { ARENA_MARGIN_LEFT, ARENA_MARGIN_TOP } from "../../core/constants";
import { game } from "../../core/state";
import { ball } from "../../entities/ball";
import { rightController, leftController } from "../../game";
import { gameConfig } from "../../modifiers/modifiers";

function drawAIZone() {
	const controller = ball.velX > 0 ? rightController : leftController;

	if (controller instanceof AIController) {
		game.ctx!.save();

		game.ctx!.fillStyle = "rgba(0, 255, 255, 0.12)";
		game.ctx!.fillRect(controller.paddle.x - 6 + ARENA_MARGIN_LEFT, controller.state.zoneCenter - controller.state.zoneRadius + ARENA_MARGIN_TOP, controller.paddle.width + 12, controller.state.zoneRadius * 2);

		game.ctx!.strokeStyle = "cyan";
		game.ctx!.lineWidth = 2;
		game.ctx!.beginPath();
		game.ctx!.moveTo(controller.paddle.x - 10 + ARENA_MARGIN_LEFT, controller.state.zoneCenter + ARENA_MARGIN_TOP);
		game.ctx!.lineTo(controller.paddle.x + controller.paddle.width + 10 + ARENA_MARGIN_LEFT, controller.state.zoneCenter + ARENA_MARGIN_TOP);
		game.ctx!.stroke();

		game.ctx!.restore();
	}
}

function drawAITarget() {
	const controller = ball.velX > 0 ? rightController : leftController;

	if (controller instanceof AIController) {
		game.ctx!.save();

		game.ctx!.fillStyle = "yellow";
		game.ctx!.beginPath();
		game.ctx!.arc(controller.paddle.x + controller.paddle.width / 2 + ARENA_MARGIN_LEFT, controller.state.aimY + ARENA_MARGIN_TOP, 6, 0, Math.PI * 2);
		game.ctx!.fill();

		game.ctx!.restore();
	}
}

function drawAIPredictionMirror() {
	const controller = ball.velX > 0 ? rightController : leftController;

	if (controller instanceof AIController) {
		let x = ball.x;
		let y = ball.y;

		let vx = ball.velX;
		let vy = ball.velY;

		game.ctx!.save();
		game.ctx!.strokeStyle = "rgba(255, 0, 0, 0.8)";
		game.ctx!.lineWidth = 2;
		game.ctx!.setLineDash([8, 8]);

		game.ctx!.beginPath();
		game.ctx!.moveTo(x + ARENA_MARGIN_LEFT, y + ARENA_MARGIN_TOP);

		while (1) {
			let tX = 10;
			let tY = 10;

			tX = (controller.paddle.x - x) / vx; // s to reach rightpaddle
			if (vy > 0)
				tY = (game.height - ball.radius - y) / vy; // s to reach bot
			else if (vy < 0) tY = (ball.radius - y) / vy; // s to reach top
			const t = tX < tY ? tX : tY; // s to reach next obstacle

			x += vx * t; // speed * time = distance
			y += vy * t;

			game.ctx!.lineTo(x - ball.radius + ARENA_MARGIN_LEFT, y + ARENA_MARGIN_TOP);

			if (t === tY)
				vy *= -1; // if next obstacle top/bot -> vertical reflect
			else break; // stops when hit paddle
		}

		game.ctx!.stroke();
		game.ctx!.restore();
	}
}

function drawAIInfos() {
	const controller = ball.velX > 0 ? rightController : leftController;
	game.ctx!.save();

	game.ctx!.font = "14px monospace";
	game.ctx!.fillStyle = "white";
	game.ctx!.textAlign = "left";

	let y = 20 + ARENA_MARGIN_TOP;
	let x = 20 + ARENA_MARGIN_LEFT;

	game.ctx!.fillText(`DEBUG MODE: ON`, x, y);
	y += 16;
	game.ctx!.fillText(`difficulty left: ${leftController instanceof AIController ? (leftController.profile === AI_HARD ? "Hard" : leftController.profile === AI_NORMAL ? "Normal" : "Easy") : "N/A"}`, x, y);
	y += 16;
	game.ctx!.fillText(`difficulty right: ${rightController instanceof AIController ? (rightController.profile === AI_HARD ? "Hard" : rightController.profile === AI_NORMAL ? "Normal" : "Easy") : "N/A"}`, x, y);
	y += 16;
	if (gameConfig.modifiers.spin) {
		game.ctx!.fillText(`spin intentions: ${controller instanceof AIController ? controller.state.wantsSpin : "N/A"}`, x, y);
		y += 16;
		game.ctx!.fillText(`spin direction: ${controller instanceof AIController ? controller.state.spinDir : "N/A"}`, x, y);
		y += 16;
	}
	// game.ctx!.fillText(`spin: ${game.state}`, x, y); y += 16;
	game.ctx!.fillText(`spin: ${ball.velX}`, x, y);
	y += 16;

	game.ctx!.restore();
}

export function drawAIDebug() {
	if (!game.aiDebug) return;

	if (
		(ball.velX > 0 && rightController instanceof AIController) ||
		(ball.velX < 0 && leftController instanceof AIController)
	) {
		drawAIZone();
		drawAIPredictionMirror();
	}
	drawAITarget();
	drawAIInfos();
}
