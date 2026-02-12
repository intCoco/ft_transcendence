import i18n from "../../../../i18n";
import { ARENA_MARGIN_TOP, GameState } from "../../core/constants";
import { game } from "../../core/state";
import { coinToss } from "../coinToss";

export function drawTimer() {
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

export function drawServeTimer() {
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

export function drawCoinToss() {
	game.ctx!.save();

	game.ctx!.textAlign = "center";
	game.ctx!.textBaseline = "middle";
	game.ctx!.font = "bold 72px Arial";

	game.ctx!.fillStyle = "white";
	game.ctx!.shadowColor = "cyan";
	game.ctx!.shadowBlur = 15;
	game.ctx!.fillText(i18n.t(coinToss.current === "left" ? "left" : coinToss.current === "right" ? "right" : coinToss.current === "top" ? "top" : "bottom").toUpperCase(), game.canvasWidth / 2, game.canvasHeight / 2);

	game.ctx!.font = "18px monospace";
	if (coinToss.winner && coinToss.elapsed > 0.7)
		game.ctx!.fillText(i18n.t("servesFirst").toUpperCase(), game.canvasWidth / 2, game.canvasHeight / 2 + 60);

	game.ctx!.restore();
}