import { game } from "../core/state.js";
import { GameState, GAME_HEIGHT } from "../core/constants.js";
import { ball } from "../entities/ball.js";
import { leftPaddle, rightPaddle } from "../entities/paddle.js";
import { gameConfig } from "../modifiers/modifiers.js";
import { applySpin } from "../modifiers/spin.js";
import { handlePaddleCollision, handleTopBotCollision, handleLeftRightCollision } from "../systems/collisions.js";
import { updateCoinToss } from "../systems/coinToss.js";
import { leftController, rightController } from "../game.js";

// actual game : function that runs every frame 
// handles movements, maths, behaviors
export function update(delta: number) {
	const now = performance.now() / 1000;

	// ball behavior: handles ball movement depending on the selected modifiers
	if (game.state === GameState.PLAY || game.state === GameState.END)
	{
		if (game.state === GameState.END) { ball.velX /= 1.05; ball.velY /= 1.05; }

		ball.prevX = ball.x; // save ball position before moving for anti tunneling
		ball.prevY = ball.y;
		if (gameConfig.modifiers.spin)
			applySpin(delta);
		ball.x += ball.velX * ball.speedCoef * delta * (ball.spin ? 1.1 : 1); // moves the ball
		ball.y += ball.velY * ball.speedCoef * delta * (ball.spin ? 1.1 : 1); //
	}

	// collisions: handles collisions with every collidable elements (top, bottom, paddles, ...)
	handleTopBotCollision(gameConfig.modifiers);
	handlePaddleCollision(now, gameConfig.modifiers);
	handleLeftRightCollision(gameConfig.modifiers);

	if (game.state === GameState.MENU || game.isPaused || game.state === GameState.END) return;

	if (game.state === GameState.COIN_TOSS) {
		updateCoinToss(now);
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