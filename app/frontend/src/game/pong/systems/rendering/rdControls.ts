import { AIController } from "../../controllers/aiController";
import { ARENA_MARGIN_LEFT, ARENA_MARGIN_TOP } from "../../core/constants";
import { game } from "../../core/state";
import { leftController, rightController, topController, bottomController } from "../../game";
import { controlsHint } from "../controlsHint";


function formatKey(key: string): string {
	switch (key.toLowerCase()) {
		case "arrowup":
			return "↑";
		case "arrowdown":
			return "↓";
		case "arrowleft":
			return "←";
		case "arrowright":
			return "→";
		default:
			return key.length === 1 ? key.toUpperCase() : key;
	}
}

function drawKeyHintReverse(ctx: CanvasRenderingContext2D, x: number, y: number, key: string, label: string) {
	const keySize = 32;
	const gap = 10;

	ctx.save();

	// label
	ctx.font = "13px system-ui";
	ctx.textAlign = "right";
	ctx.textBaseline = "middle";
	ctx.fillStyle = `rgba(0, 255, 255, ${0.85 * controlsHint.alpha})`;
	ctx.fillText(label, x - gap, y);

	// key box
	ctx.fillStyle = `rgba(0, 255, 255, ${0.22 * controlsHint.alpha})`;
	ctx.strokeStyle = `rgba(0, 255, 255, ${0.45 * controlsHint.alpha})`;
	ctx.lineWidth = 1.5;

	ctx.beginPath();
	ctx.roundRect(x, y - keySize / 2, keySize, keySize, 6);
	ctx.fill();
	ctx.stroke();

	// key character
	ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * controlsHint.alpha})`;
	ctx.font = "bold 15px system-ui";
	ctx.textAlign = "center";
	ctx.fillText(formatKey(key), x + keySize / 2, y);

	ctx.restore();
}


function drawKeyHint(ctx: CanvasRenderingContext2D, x: number, y: number, key: string, label: string) {
	const keySize = 32;
	const radius = 6;
	const gap = 10;

	ctx.save();

	// key box
	ctx.fillStyle = `rgba(0, 255, 255, ${0.22 * controlsHint.alpha})`;
	ctx.strokeStyle = `rgba(0, 255, 255, ${0.45 * controlsHint.alpha})`;
	ctx.lineWidth = 1.5;

	ctx.beginPath();
	ctx.roundRect(x, y - keySize / 2, keySize, keySize, radius);
	ctx.fill();
	ctx.stroke();

	// key character
	ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * controlsHint.alpha})`;
	ctx.font = "bold 15px system-ui";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(formatKey(key), x + keySize / 2, y);

	// label
	ctx.font = "13px system-ui";
	ctx.textAlign = "left";
	ctx.fillStyle = `rgba(0, 255, 255, ${0.85 * controlsHint.alpha})`;
	ctx.fillText(label, x + keySize + gap, y);

	ctx.restore();
}



export function drawControlsHint() {
	if (!controlsHint.show) return;

	const ctx = game.ctx!;
	const offset = 40;
	const spacing = 64;

	ctx.save();

	// left hints
	if (!(leftController instanceof AIController)) {
		const x = leftController.paddle.x + leftController.paddle.width + ARENA_MARGIN_LEFT + offset;
		const y = game.canvasHeight / 2;

		drawKeyHint(ctx, x, y - spacing, leftController.upKey, "Move up");
		drawKeyHint(ctx, x, y + spacing, leftController.downKey, "Move down");
	}

	// right hints
	if (!(rightController instanceof AIController)) {
		const x = rightController.paddle.x + ARENA_MARGIN_LEFT - offset - 32;
		const y = game.canvasHeight / 2;

		drawKeyHintReverse(ctx, x, y - spacing, rightController.upKey, "Move up");
		drawKeyHintReverse(ctx, x, y + spacing, rightController.downKey, "Move down");
	}

	// top hints
	if (game.mode === "4P" && !(topController instanceof AIController)) {
		const y = topController.paddle.y + topController.paddle.height + ARENA_MARGIN_TOP + offset;
		const x = game.canvasWidth / 2;

		drawKeyHintReverse(ctx, x - spacing - 16, y, topController.upKey, "Move left");
		drawKeyHint(ctx, x + spacing - 16, y, topController.downKey, "Move right");
	}

	// bottom hints
	if (game.mode === "4P" && !(bottomController instanceof AIController)) {
		const y = bottomController.paddle.y + ARENA_MARGIN_TOP - offset;
		const x = game.canvasWidth / 2;

		drawKeyHintReverse(ctx, x - spacing - 16, y, bottomController.upKey, "Move left");
		drawKeyHint(ctx, x + spacing - 16, y, bottomController.downKey, "Move right");
	}

	ctx.restore();
}
