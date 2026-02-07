import { game } from "../core/state.js";
import { GameState } from "../core/constants.js";
import { updateBall } from "../entities/ball.js";
import { bottomPaddle, leftPaddle, rightPaddle, topPaddle } from "../entities/paddle.js";
import { updateCoinToss } from "../systems/coinToss.js";
import { bottomController, endGame, leftController, rightController, topController } from "../game.js";
import { updateParticles } from "../entities/particles.js";
import { updateControlsHint } from "./controlsHint.js";
import { handleServe } from "./serve.js";

// actual game : function that runs every frame 
// handles movements, maths, behaviors
export function update(delta: number) {
	const now = performance.now() / 1000;

	// ball behavior: handles ball movement depending on the selected modifiers
	if ((game.state === GameState.PLAY && !game.isPaused) || game.state === GameState.END)
		updateBall(now, delta);

	if (!game.isPaused)
		updateParticles(delta);

	if (game.isPaused || game.state === GameState.END)
		return;

	if (game.state === GameState.COIN_TOSS) {
		updateCoinToss(now, delta);
		return;
	}
	
	// paddle controls: updates paddles positions based on player inputs or AI
	leftController.update(leftPaddle, delta);
	rightController.update(rightPaddle, delta);

	if (game.mode === "4P") {
		topController.update(topPaddle, delta);
		bottomController.update(bottomPaddle, delta);
	}

	// clamping: limits the paddles movements from all the way up to all the way down the canvas. Stops it from going OOB
	leftPaddle.clampY(game.height);
	rightPaddle.clampY(game.height);

	if (game.mode === "4P") {
		topPaddle.clampX(game.width);
		bottomPaddle.clampX(game.width);
	}

	updateControlsHint(delta);

	// serve timer: countdown from 3s when serving to let players time to replace
	if (game.state === GameState.SERVE)
		handleServe(delta);

	// game timer: handles game timer till game over
	if (game.state === GameState.PLAY) {
		if (game.gameTimer > 0)
			game.gameTimer -= delta;
		if (game.gameTimer <= 0) {
			game.gameTimer = 0;
			endGame();
		}
	}
}