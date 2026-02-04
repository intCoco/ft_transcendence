import { game } from "../core/state.js";
import { Controller } from "./controller.js";
import { Paddle } from "../entities/paddle.js";
import { GameState } from "../core/constants.js";
import { ball } from "../entities/ball.js";
import { updateAIZone, updateAIAim, updateAIMovement, AIProfile } from "../ai/ai.js";


export interface AIState {
    zoneCenter: number;
    zoneRadius: number;
    aimY: number;
    nextDecisionTime: number;
    nextReactionTime: number;
    wantsSpin: boolean;
    spinDir: "up" | "down" | false;
}


export class AIController implements Controller {
    profile: AIProfile;
    paddle: Paddle;
    state: AIState;
    score: number = 0;

    constructor(paddle: Paddle, profile: AIProfile) {
        console.log("AI profile received:", profile);
        this.paddle = paddle;
        this.profile = profile;
        console.log("AI profile set:", this.profile);
        this.state = {
            zoneCenter: game.height / 2,
            zoneRadius: 200,
            aimY: game.height / 2,
            nextDecisionTime: 0,
            nextReactionTime: 0,
            wantsSpin: false,
            spinDir: false
        }
    }

    update(paddle: Paddle, delta: number) {
        const now = performance.now() / 1000;

        const isRightPaddle = paddle.x > game.width / 2;
        const isBallComing =
            (isRightPaddle && ball.velX > 0) ||
            (!isRightPaddle && ball.velX < 0);

        if (isBallComing && game.state === GameState.PLAY) {
            updateAIZone(this, now);
            updateAIAim(this, now);
        }


        updateAIMovement(this, delta);

        paddle.clampY(game.height);
    }
}
