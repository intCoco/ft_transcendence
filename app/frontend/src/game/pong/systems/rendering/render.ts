import { GameState } from "../../core/constants.js";
import { game } from "../../core/state.js";
import { drawControlsHint } from "./rdControls.js";
import { drawArena } from "./rdArena.js";
import { drawAIDebug } from "./rdDebug.js";
import { drawEntites } from "./rdEntites.js";
import { drawScore } from "./rdScore.js";
import { drawCoinToss, drawServeTimer, drawTimer } from "./rdInfos.js";

export function render() {
	if (game.isPaused) return;

	game.ctx!.fillStyle = "#0a021492";
	game.ctx!.fillRect(0, 0, game.canvasWidth, game.canvasHeight);

	if (game.state === GameState.COIN_TOSS) {
		drawCoinToss();
		return;
	}

	drawArena();
	drawScore();
	drawServeTimer();
	drawTimer();
	drawAIDebug();
	drawEntites();
	drawControlsHint();
}
