import { MAX_POINTS, ARENA_MARGIN_LEFT, ARENA_MARGIN_TOP } from "../../core/constants";
import { game } from "../../core/state";
import { leftController, rightController, topController, bottomController } from "../../game";
import { goal } from "../../modifiers/arena";

function drawScoreDots(score: number, max: number, startX: number, startY: number, dirX: number, dirY: number) {
	const ctx = game.ctx!;
	const spacing = game.mode === "2P" ? 24 : 18;
	const radius = game.mode === "2P" ? 8 : 6;

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

export function drawScore() {
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