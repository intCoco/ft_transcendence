import { game } from "../core/state.js";
import { GameState, GAME_HEIGHT } from "../core/constants.js";
import { updateBall } from "../entities/ball.js";
import { leftPaddle, rightPaddle } from "../entities/paddle.js";
import { updateCoinToss } from "../systems/coinToss.js";
import { leftController, rightController } from "../game.js";
import { updateParticles } from "../entities/particles.js";

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
	
	leftController.update(leftPaddle, delta);
	rightController.update(rightPaddle, delta);

	// clamping: limits the paddles movements from all the way up to all the way down the canvas. Stops it from going OOB
	leftPaddle.clamp(GAME_HEIGHT);
	rightPaddle.clamp(GAME_HEIGHT);

	// serve timer: countdown from 3s when serving to let players time to replace
	if (game.state === GameState.SERVE) {
		game.serveTimer -= delta;
		if (game.serveTimer <= 0)
			game.state = GameState.PLAY;
		return;
	}

	// game timer: handles game timer till game over
	if (game.state === GameState.PLAY) {
		game.gameTimer -= delta;
		if (game.gameTimer <= 0) {
			game.gameTimer = 0;
			game.state = GameState.END;
			game.isGameOver = true;
			game.onGameOver?.();
		}
	}
}