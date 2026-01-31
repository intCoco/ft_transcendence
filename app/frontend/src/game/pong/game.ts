import { game } from "./core/state.js";
import { GAMEDURATION, GameState } from "./core/constants.js";
import { leftPaddle, rightPaddle, topPaddle, bottomPaddle } from "./entities/paddle.js";
import { PlayerController } from "./controllers/playerController.js";
import { AIController } from "./controllers/aiController.js";
import { AI_EASY, AI_HARD, AI_NORMAL } from "./ai/ai.js";
import { startCoinToss } from "./systems/coinToss.js";
import { render } from "./systems/render.js";
import { update } from "./systems/update.js";


export let leftController: PlayerController | AIController =
    new PlayerController(leftPaddle, "w", "s");

export let rightController: PlayerController | AIController =
    new PlayerController(rightPaddle, "ArrowUp", "ArrowDown");

export let topController: PlayerController | AIController =
    new PlayerController(topPaddle, "z", "x");

export let bottomController: PlayerController | AIController =
    new PlayerController(bottomPaddle, "ArrowLeft", "ArrowRight");



// called to initialize the game when pressing start button
export function startGame(playersConfig?: any)  {
    game.state = GameState.COIN_TOSS;
    game.scoreLeft = 0;
    game.scoreRight = 0;
    game.gameTimer = GAMEDURATION;
    game.isGameOver = false;
    game.isPaused = false;

    if (playersConfig && playersConfig.top != null) {
        game.mode = "4P";
        game.height = 800;
        game.canvasHeight = 860;
    }

    leftPaddle.x = 20;
    leftPaddle.y = 600 / 2 - 40;
    rightPaddle.x = 800 - 35;
    rightPaddle.y = 600 / 2 - 40;
    
    if (playersConfig) {
        if (playersConfig.left.type === "Player")
            leftController = new PlayerController(leftPaddle, playersConfig.left.up, playersConfig.left.down);
        else
            leftController = new AIController(leftPaddle, playersConfig.left.aiDifficulty === "Hard" ? AI_HARD : playersConfig.left.aiDifficulty === "Normal" ? AI_NORMAL : AI_EASY);

        if (playersConfig.right.type === "Player")
            rightController = new PlayerController(rightPaddle, playersConfig.right.up, playersConfig.right.down);
        else
            rightController = new AIController(rightPaddle, playersConfig.right.aiDifficulty === "Hard" ? AI_HARD : playersConfig.right.aiDifficulty === "Normal" ? AI_NORMAL : AI_EASY);

        // if (playersConfig.top != null) {
        //     game.mode = "4P";
        //     if (playersConfig.top.type === "Player")
        //         topController = new PlayerController(topPaddle, playersConfig.top.up, playersConfig.top.down);
        //     else
        //         topController = new AIController(topPaddle, playersConfig.top.aiDifficulty === "Hard" ? AI_HARD : playersConfig.top.aiDifficulty === "Normal" ? AI_NORMAL : AI_EASY);

        //     if (playersConfig.bottom.type === "Player")
        //         bottomController = new PlayerController(bottomPaddle, playersConfig.bottom.up, playersConfig.bottom.down);
        //     else
        //         bottomController = new AIController(bottomPaddle, playersConfig.bottom.aiDifficulty === "Hard" ? AI_HARD : playersConfig.bottom.aiDifficulty === "Normal" ? AI_NORMAL : AI_EASY);
        // }
    }


    if (game.mode === "4P") {
        game.height = 800;
        topPaddle.x = 800 / 2 - 40;
        topPaddle.y = 20;
        bottomPaddle.x = 800 / 2 - 40;
        bottomPaddle.y = 600 - 40;
    }

    startCoinToss(performance.now() / 1000);
}



export function startPongGame(canvas: HTMLCanvasElement, playersConfig?: any) {
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return () => {};
    
    let running = true;
    let lastTime = performance.now();

    startGame(playersConfig);
    function loop(now: number) {
        if (!running || !leftController || !rightController) return;
        game.ctx = ctx;

        const delta = (now - lastTime) / 1000;
        lastTime = now;
        update(delta);
        render();
        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    return () => {
        running = false;
    };
}

