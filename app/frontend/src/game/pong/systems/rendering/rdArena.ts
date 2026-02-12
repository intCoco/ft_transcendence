import { ARENA_MARGIN_LEFT, ARENA_MARGIN_TOP } from "../../core/constants";
import { game } from "../../core/state";
import { goal } from "../../modifiers/arena";
import { gameConfig } from "../../modifiers/modifiers";

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

export function drawArena() {
	drawDash();

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