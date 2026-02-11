import { game } from "../core/state.js";
import { GameState } from "../core/constants.js";
import { resetBall } from "../entities/ball.js";

type PlayerSide = "left" | "right" | "top" | "bottom";

interface CoinTossState {
	phase: "ROLLING" | "RESULT";

	elapsed: number;
	rollDuration: number;
	resultDuration: number;

	current: PlayerSide;
	winner: PlayerSide | null;

	lastSwitchTime: number;
	sides: PlayerSide[];
}

export const coinToss: CoinTossState = {
	phase: "ROLLING",

	elapsed: 0,
	rollDuration: 4,
	resultDuration: 2,

	current: "left",
	winner: null,

	lastSwitchTime: 0,
	sides: ["left", "right"],
};

export function startCoinToss(now: number) {
	coinToss.phase = "ROLLING";
	coinToss.elapsed = 0;
	coinToss.lastSwitchTime = now;

	coinToss.sides = game.mode === "4P" ? ["left", "right", "top", "bottom"] : ["left", "right"];

	coinToss.current = coinToss.sides[Math.floor(Math.random() * coinToss.sides.length)];
	coinToss.winner = null;
}

export function updateCoinToss(now: number, delta: number) {
	coinToss.elapsed += delta;

	if (coinToss.phase === "ROLLING") {
		const progress = Math.min(1, coinToss.elapsed / coinToss.rollDuration);

		const minInterval = 0.03;
		const maxInterval = 0.5;

		const interval = minInterval + (maxInterval - minInterval) * (progress * progress);

		if (now - coinToss.lastSwitchTime >= interval) {
			const otherSides = coinToss.sides.filter(side => side !== coinToss.current)
			coinToss.current = otherSides[Math.floor(Math.random() * otherSides.length)];
			coinToss.lastSwitchTime = now;
		}

		if (coinToss.elapsed >= coinToss.rollDuration) {
			coinToss.phase = "RESULT";
			coinToss.elapsed = 0;
			coinToss.winner = coinToss.current;
		}

		return;
	}

	if (coinToss.phase === "RESULT") {
		if (coinToss.elapsed >= coinToss.resultDuration) {
			resetBall(coinToss.winner === "left" ? "left" : coinToss.winner === "right" ? "right" : coinToss.winner === "top" ? "top" : "bottom");
			game.state = GameState.SERVE;
		}
	}
}