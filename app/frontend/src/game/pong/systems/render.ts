import { AI_HARD, AI_NORMAL } from "../ai/ai";
import { AIController } from "../controllers/aiController";
import { ARENA_MARGIN_BOTTOM, ARENA_MARGIN_LEFT, ARENA_MARGIN_RIGHT, ARENA_MARGIN_TOP, GameState, MAX_POINTS } from "../core/constants";
import { game } from "../core/state";
import { ball } from "../entities/ball";
import { bottomController, leftController, rightController, topController } from "../game";
import { goal } from "../modifiers/arena";
import { gameConfig } from "../modifiers/modifiers";
import { coinToss } from "./coinToss";
import { bottomPaddle, leftPaddle, Paddle, rightPaddle, topPaddle } from "../entities/paddle";
import { particles } from "../entities/particles";
import i18n from "../../../i18n.jsx";

// display functions
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

function drawDash() {
	game.ctx!.setLineDash([12, 24]);
	game.ctx!.lineWidth = 2;

	game.ctx!.save();
	game.ctx!.strokeStyle = "purple";
	game.ctx!.shadowColor = "purple";
	game.ctx!.shadowBlur = 10;

	game.ctx!.beginPath();
	game.ctx!.moveTo(game.canvasWidth / 2, game.mode === "4P" ? 4 : ARENA_MARGIN_TOP);
	game.ctx!.lineTo(game.canvasWidth / 2, game.canvasHeight - (game.mode === "4P" ? 4 : ARENA_MARGIN_TOP));
	game.ctx!.stroke();

	if (game.mode === "4P") {
		game.ctx!.beginPath();
		game.ctx!.moveTo(4, game.canvasHeight / 2);
		game.ctx!.lineTo(game.canvasWidth, game.canvasHeight / 2);
		game.ctx!.stroke();
	}

	game.ctx!.restore();
	game.ctx!.setLineDash([]);
}

function drawScoreDots(score: number, max: number, startX: number, startY: number, dirX: number, dirY: number) {
	const ctx = game.ctx!;
	const spacing = game.mode === "2P" ? 24 : 18;
	const radius =  game.mode === "2P" ? 8 : 6;

	for (let i = 0; i < max; i++) {
		const x = startX + dirX * i * spacing;
		const y = startY + dirY * i * spacing;

		ctx.save();
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, Math.PI * 2);

		if (i < score) {
			ctx.fillStyle = "cyan";
			ctx.shadowColor = "cyan";
			ctx.shadowBlur = 12;
			ctx.fill();
		} else {
			ctx.lineWidth = 2;
			ctx.strokeStyle = "white";
			ctx.shadowBlur = 0;
			ctx.stroke();
		}

		ctx.restore();
	}
}

function drawScore() {
	game.ctx!.save();

	if (game.mode === "2P") {
		// left score
		drawScoreDots(leftController.score, MAX_POINTS, game.canvasWidth / 2 - ARENA_MARGIN_LEFT, ARENA_MARGIN_TOP / 2 - 2, -1, 0);

		// right score
		drawScoreDots(rightController.score, MAX_POINTS, game.canvasWidth / 2 + ARENA_MARGIN_LEFT, ARENA_MARGIN_TOP / 2 - 2, 1, 0);

		game.ctx!.restore();
		return ;
	}
	// left score
	drawScoreDots(leftController.score, MAX_POINTS, ARENA_MARGIN_LEFT / 2 - 3, goal.top + ARENA_MARGIN_TOP / 2, 0, -1);

	// right score
	drawScoreDots(rightController.score, MAX_POINTS, game.canvasWidth - ARENA_MARGIN_LEFT / 2 + 3, goal.bottom + ARENA_MARGIN_TOP * 1.5, 0, 1);

	if (game.mode === "4P") {
		// top score
		drawScoreDots(topController.score, MAX_POINTS, goal.right + ARENA_MARGIN_LEFT * 1.5, ARENA_MARGIN_TOP / 2 - 3, 1, 0);

		// bottom score
		drawScoreDots(bottomController.score, MAX_POINTS, goal.left + ARENA_MARGIN_LEFT / 2, game.canvasHeight - ARENA_MARGIN_TOP / 2 + 3, -1, 0);
	}

	game.ctx!.restore();
}

function drawTimer() {
	if (game.mode === "2P") {
		game.ctx!.save();
		game.ctx!.font = `bold 48px Arial`;
		game.ctx!.textAlign = "center";
		game.ctx!.textBaseline = "middle";

		game.ctx!.fillStyle = "white";
		game.ctx!.shadowColor = "cyan";
		game.ctx!.shadowBlur = 10;

		game.ctx!.fillText(`${Math.ceil(game.gameTimer)}`, game.canvasWidth / 2, ARENA_MARGIN_TOP / 2);

		game.ctx!.restore();
	} else {
		game.ctx!.save();

		game.ctx!.font = `bold 72px Arial`;
		game.ctx!.textAlign = "center";
		game.ctx!.textBaseline = "middle";
		game.ctx!.fillStyle = "rgba(255, 255, 255, 0.26)";
		if (!(game.mode === "4P" && game.state === GameState.SERVE))
			game.ctx!.fillText(`${Math.ceil(game.gameTimer)}`, game.canvasWidth / 2, game.canvasHeight / 2);

		game.ctx!.restore();
	}
}

function drawServeTimer() {
	if (game.state !== GameState.SERVE) return;
	const text = Math.ceil(game.serveTimer).toString();

	game.ctx!.save();
	game.ctx!.font = "bold 200px Arial";
	game.ctx!.textAlign = "center";
	game.ctx!.textBaseline = "middle";

	game.ctx!.lineWidth = 10;
	game.ctx!.strokeStyle = "magenta";
	game.ctx!.shadowColor = "magenta";
	game.ctx!.shadowBlur = 35;
	game.ctx!.strokeText(text, game.canvasWidth / 2, game.canvasHeight / 2);

	game.ctx!.lineWidth = 5;
	game.ctx!.shadowBlur = 0;
	game.ctx!.strokeStyle = "white";
	game.ctx!.strokeText(text, game.canvasWidth / 2, game.canvasHeight / 2);

	game.ctx!.restore();
}

function drawCoinToss() {
	game.ctx!.save();

	game.ctx!.textAlign = "center";
	game.ctx!.textBaseline = "middle";
	game.ctx!.font = "bold 72px Arial";

	game.ctx!.fillStyle = "white";
	game.ctx!.shadowColor = "cyan";
	game.ctx!.shadowBlur = 15;
	game.ctx!.fillText(i18n.t(coinToss.current === "left" ? "left" : "right").toUpperCase(), game.canvasWidth / 2, game.canvasHeight / 2);

	game.ctx!.font = "18px monospace";
	if (coinToss.winner && coinToss.elapsed > 0.7)
		game.ctx!.fillText(i18n.t("servesFirst").toUpperCase(), game.canvasWidth / 2, game.canvasHeight / 2 + 60);

	game.ctx!.restore();
}

function drawArena() {
	const ctx = game.ctx!;

	ctx.save();

	if (game.mode === "4P") {
		// top goal
		let gradTop = ctx.createLinearGradient(0, 0, 0, 60);
		gradTop.addColorStop(0, "rgba(255, 0, 255, 0.23)");
		gradTop.addColorStop(1, "rgba(255, 0, 255, 0)");

		ctx.fillStyle = gradTop;
		ctx.fillRect(goal.left + ARENA_MARGIN_LEFT, 0, goal.right - goal.left, 60);

		// bottom goal
		let gradBottom = ctx.createLinearGradient(0, game.canvasHeight, 0, game.canvasHeight - 60);
		gradBottom.addColorStop(0, "rgba(255, 0, 255, 0.23)");
		gradBottom.addColorStop(1, "rgba(255, 0, 255, 0)");

		ctx.fillStyle = gradBottom;
		ctx.fillRect(goal.left + ARENA_MARGIN_LEFT, game.canvasHeight - 60, goal.right - goal.left, 60);
	}

	// left goal
	let gradLeft = ctx.createLinearGradient(0, 0, 60, 0);
	gradLeft.addColorStop(0, "rgba(255, 0, 255, 0.23)");
	gradLeft.addColorStop(1, "rgba(255, 0, 255, 0)");

	ctx.fillStyle = gradLeft;
	ctx.fillRect(0, gameConfig.modifiers.arena ? goal.top + ARENA_MARGIN_TOP : ARENA_MARGIN_TOP, 60, gameConfig.modifiers.arena ? goal.bottom - goal.top : game.height);

	// right goal
	let gradRight = ctx.createLinearGradient(game.canvasWidth, 0, game.canvasWidth - 60, 0);
	gradRight.addColorStop(0, "rgba(255, 0, 255, 0.23)");
	gradRight.addColorStop(1, "rgba(255, 0, 255, 0)");

	ctx.fillStyle = gradRight;
	ctx.fillRect(game.canvasWidth - 60, gameConfig.modifiers.arena ? goal.top + ARENA_MARGIN_TOP : ARENA_MARGIN_TOP, 60, gameConfig.modifiers.arena ? goal.bottom - goal.top : game.height);

	ctx.restore();




	const thickness = 4;
	const radius = 6;

	const topY = ARENA_MARGIN_TOP - thickness;
	const bottomY = game.canvasHeight - ARENA_MARGIN_TOP + thickness;
	const leftX = ARENA_MARGIN_LEFT - thickness;
	const rightX = game.canvasWidth - ARENA_MARGIN_LEFT + thickness;

	ctx.save();

	ctx.lineWidth = thickness;
	ctx.lineCap = "round";
	ctx.lineJoin = "round";
	ctx.strokeStyle = "white";
	ctx.shadowBlur = 18;
	ctx.shadowColor = "magenta";

	if (game.mode === "2P") {
		// Top wall
		ctx.beginPath();

		ctx.moveTo(gameConfig.modifiers.arena ? leftX + radius : 0, topY);
		ctx.lineTo(gameConfig.modifiers.arena ? rightX - radius : game.canvasWidth, topY);
		ctx.stroke();

		// Bottom wall
		ctx.beginPath();
		ctx.moveTo(gameConfig.modifiers.arena ? leftX + radius : 0, bottomY);
		ctx.lineTo(gameConfig.modifiers.arena ? rightX - radius : game.canvasWidth, bottomY);
		ctx.stroke();


		if (gameConfig.modifiers.arena === false) {
			ctx.restore();
			return;
		}
	}
	else {
		// Top wall
		ctx.beginPath();
		ctx.moveTo(leftX + radius, topY);
		ctx.lineTo(goal.left + ARENA_MARGIN_LEFT - radius, topY);
		ctx.stroke();

		ctx.beginPath();
		ctx.arc(goal.left + ARENA_MARGIN_LEFT - radius, topY - radius, radius, 0, Math.PI / 2);
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(goal.right + ARENA_MARGIN_LEFT + radius, topY);
		ctx.lineTo(rightX - radius, topY);
		ctx.stroke();

		ctx.beginPath();
		ctx.arc(goal.right + ARENA_MARGIN_LEFT + radius, topY - radius, radius, Math.PI / 2, Math.PI);
		ctx.stroke();

		// Top tunnel
		ctx.beginPath();
		ctx.moveTo(goal.left + ARENA_MARGIN_LEFT, topY - radius);
		ctx.lineTo(goal.left + ARENA_MARGIN_LEFT, 0);
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(goal.right + ARENA_MARGIN_LEFT, topY - radius);
		ctx.lineTo(goal.right + ARENA_MARGIN_LEFT, 0);
		ctx.stroke();

		// Bottom wall
		ctx.beginPath();
		ctx.moveTo(leftX + radius, bottomY);
		ctx.lineTo(goal.left + ARENA_MARGIN_LEFT - radius, bottomY);
		ctx.stroke();

		ctx.beginPath();
		ctx.arc(goal.left + ARENA_MARGIN_LEFT - radius, bottomY + radius, radius, -Math.PI / 2, 0);
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(goal.right + ARENA_MARGIN_LEFT + radius, bottomY);
		ctx.lineTo(rightX - radius, bottomY);
		ctx.stroke();

		ctx.beginPath();
		ctx.arc(goal.right + ARENA_MARGIN_LEFT + radius, bottomY + radius, radius, Math.PI, -Math.PI / 2);
		ctx.stroke();

		// Bottom tunnel
		ctx.beginPath();
		ctx.moveTo(goal.left + ARENA_MARGIN_LEFT, bottomY + radius);
		ctx.lineTo(goal.left + ARENA_MARGIN_LEFT, game.canvasHeight);
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(goal.right + ARENA_MARGIN_LEFT, bottomY + radius);
		ctx.lineTo(goal.right + ARENA_MARGIN_LEFT, game.canvasHeight);
		ctx.stroke();
	}

	// Top arcs
	ctx.beginPath();
	ctx.arc(leftX + radius, topY + radius, radius, Math.PI, -Math.PI / 2);
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(rightX - radius, topY + radius, radius, -Math.PI / 2, 0);
	ctx.stroke();

	// Bottom arcs
	ctx.beginPath();
	ctx.arc(leftX + radius, bottomY - radius, radius, Math.PI / 2, Math.PI);
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(rightX - radius, bottomY - radius, radius, 0, Math.PI / 2);
	ctx.stroke();



	// Left wall
	ctx.beginPath();
	ctx.moveTo(leftX, topY + radius);
	ctx.lineTo(leftX, goal.top + ARENA_MARGIN_TOP - radius);
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(leftX - radius, goal.top + ARENA_MARGIN_TOP - radius, radius, 0, Math.PI / 2);
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(leftX, goal.bottom + ARENA_MARGIN_TOP + radius);
	ctx.lineTo(leftX, bottomY - radius);
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(leftX - radius, goal.bottom + ARENA_MARGIN_TOP + radius, radius, -Math.PI / 2, 0);
	ctx.stroke();

	// Left tunnel
	ctx.beginPath();
	ctx.moveTo(leftX - radius, goal.top + ARENA_MARGIN_TOP);
	ctx.lineTo(0, goal.top + ARENA_MARGIN_TOP);
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(leftX - radius, goal.bottom + ARENA_MARGIN_TOP);
	ctx.lineTo(0, goal.bottom + ARENA_MARGIN_TOP);
	ctx.stroke();

	// Right wall
	ctx.beginPath();
	ctx.moveTo(rightX, topY + radius);
	ctx.lineTo(rightX, goal.top + ARENA_MARGIN_TOP - radius);
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(rightX + radius, goal.top + ARENA_MARGIN_TOP - radius, radius, Math.PI / 2, Math.PI);
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(rightX, goal.bottom + ARENA_MARGIN_TOP + radius);
	ctx.lineTo(rightX, bottomY - radius);
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(rightX + radius, goal.bottom + ARENA_MARGIN_TOP + radius, radius, Math.PI, -Math.PI / 2);
	ctx.stroke();

	// Right Tunnel
	ctx.beginPath();
	ctx.moveTo(rightX + radius, goal.top + ARENA_MARGIN_TOP);
	ctx.lineTo(game.canvasWidth, goal.top + ARENA_MARGIN_TOP);
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(rightX + radius, goal.bottom + ARENA_MARGIN_TOP);
	ctx.lineTo(game.canvasWidth, goal.bottom + ARENA_MARGIN_TOP);
	ctx.stroke();

	ctx.restore();
}

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

function drawAIDebug() {
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

function drawParticles() {
	for (const p of particles) {
		game.ctx!.save();
		game.ctx!.globalAlpha = p.alpha;
		game.ctx!.fillStyle = "cyan";
		game.ctx!.beginPath();
		game.ctx!.arc(p.x + ARENA_MARGIN_LEFT, p.y + ARENA_MARGIN_TOP, 2 + Math.random() * 2, 0, Math.PI * 2);
		game.ctx!.fill();
		game.ctx!.restore();
	}}

export function render() {
	if (!game.isPaused) {
		game.ctx!.fillStyle = "#0a021492";
		game.ctx!.fillRect(0, 0, game.canvasWidth, game.canvasHeight);

		if (game.state === GameState.COIN_TOSS) drawCoinToss();
		else {
			drawDash();
			drawArena();
			drawScore();
			drawPaddle(leftPaddle);
			drawPaddle(rightPaddle);
			if (game.mode === "4P") {
				drawPaddle(topPaddle);
				drawPaddle(bottomPaddle);
			}
			drawServeTimer();
			drawTimer();
			drawAIDebug();
			drawBall();
			drawParticles();
		}
	}
}
