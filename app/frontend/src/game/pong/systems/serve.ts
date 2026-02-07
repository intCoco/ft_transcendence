import { PlayerController } from "../controllers/playerController";
import { GameState } from "../core/constants";
import { game } from "../core/state";
import { ball } from "../entities/ball";
import { bottomPaddle, leftPaddle, rightPaddle, topPaddle } from "../entities/paddle";


export function handleServe(delta: number) {
	if (game.lastHitPaddle === topPaddle || game.lastHitPaddle === bottomPaddle)
		ball.x = game.lastHitPaddle.x + game.lastHitPaddle.width / 2;
	else if (game.lastHitPaddle === leftPaddle || game.lastHitPaddle === rightPaddle)
		ball.y = game.lastHitPaddle.y + game.lastHitPaddle.height / 2;

	if (game.lastHitPaddle?.controller instanceof PlayerController) {
		if (game.lastHitPaddle.controller.isUpPressed()) {
			if (game.lastHitPaddle === leftPaddle || game.lastHitPaddle === rightPaddle)
				ball.velY = -Math.abs(ball.velY);
			else
				ball.velX = -Math.abs(ball.velX);
		} else if (game.lastHitPaddle.controller.isDownPressed()) {
			if (game.lastHitPaddle === leftPaddle || game.lastHitPaddle === rightPaddle)
				ball.velY = Math.abs(ball.velY);
			else
				ball.velX = Math.abs(ball.velX);
		}
	}

	game.serveTimer -= delta;
	if (game.serveTimer <= 0)
		game.state = GameState.PLAY;
}