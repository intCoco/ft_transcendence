import { game } from "../core/state.js";
import { GameState } from "../core/constants.js";
import { resetBall } from "../entities/ball.js";

interface CoinTossState {
	phase: "ROLLING" | "RESULT";

	elapsed: number;
	rollDuration: number;
	resultDuration: number;

	current: "left" | "right";
	winner: "left" | "right" | null;

	lastSwitchTime: number;
}

export const coinToss: CoinTossState = {
	phase: "ROLLING",

	elapsed: 0,
	rollDuration: 4,
	resultDuration: 2,

	current: "left",
	winner: null,

	lastSwitchTime: 0
};

export function startCoinToss(now: number) {
	coinToss.phase = "ROLLING";
	coinToss.elapsed = 0;
	coinToss.lastSwitchTime = now;

	coinToss.current = "left";
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
			coinToss.current = coinToss.current === "left" ? "right" : "left";
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
			resetBall(coinToss.winner === "left" ? "right" : "left");
			game.state = GameState.SERVE;
		}
	}
}