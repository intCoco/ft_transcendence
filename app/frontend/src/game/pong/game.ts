import { game } from "./core/state.js";
import { GAMEDURATION, GameState } from "./core/constants.js";
import { leftPaddle, rightPaddle, topPaddle, bottomPaddle } from "./entities/paddle.js";
import { PlayerController } from "./controllers/playerController.js";
import { AIController } from "./controllers/aiController.js";
import { AI_EASY, AI_HARD, AI_NORMAL } from "./ai/ai.js";
import { startCoinToss } from "./systems/coinToss.js";
import { render } from "./systems/rendering/render.js";
import { update } from "./systems/update.js";
import { goal } from "./modifiers/arena.js";
import { showControlsHint } from "./systems/controlsHint.js";


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
    game.gameTimer = GAMEDURATION;
    game.isGameOver = false;
    game.isPaused = false;

    if (playersConfig && playersConfig.top === null)
        game.mode = "2P";

    if (game.mode === "2P") {
        game.height = 600;
        game.canvasHeight = 720;
    }
    if (playersConfig && playersConfig.top !== null) {
        game.mode = "4P";
        game.height = 800;
        game.canvasHeight = 920;
    }

    for (const controller of [leftController, rightController, topController, bottomController])
        controller.score = 0;
    
    leftPaddle.x = 20;
    leftPaddle.y = game.height / 2 - 40;
    rightPaddle.x = game.width - 35;
    rightPaddle.y = game.height / 2 - 40;
    
    if (playersConfig) {
        if (playersConfig.left.type === "Player")
            leftController = new PlayerController(leftPaddle, playersConfig.left.up, playersConfig.left.down);
        else
            leftController = new AIController(leftPaddle, playersConfig.left.aiDifficulty === "Hard" ? AI_HARD : playersConfig.left.aiDifficulty === "Normal" ? AI_NORMAL : AI_EASY);

        if (playersConfig.right.type === "Player")
            rightController = new PlayerController(rightPaddle, playersConfig.right.up, playersConfig.right.down);
        else
            rightController = new AIController(rightPaddle, playersConfig.right.aiDifficulty === "Hard" ? AI_HARD : playersConfig.right.aiDifficulty === "Normal" ? AI_NORMAL : AI_EASY);

        if (game.mode === "4P") {
            if (playersConfig.top.type === "Player")
                topController = new PlayerController(topPaddle, playersConfig.top.up, playersConfig.top.down);
            else
                topController = new AIController(topPaddle, playersConfig.top.aiDifficulty === "Hard" ? AI_HARD : playersConfig.top.aiDifficulty === "Normal" ? AI_NORMAL : AI_EASY);

            if (playersConfig.bot.type === "Player")
                bottomController = new PlayerController(bottomPaddle, playersConfig.bot.up, playersConfig.bot.down);
            else
                bottomController = new AIController(bottomPaddle, playersConfig.bot.aiDifficulty === "Hard" ? AI_HARD : playersConfig.bot.aiDifficulty === "Normal" ? AI_NORMAL : AI_EASY);
        }
    }

    leftPaddle.controller = leftController;
    rightPaddle.controller = rightController;
    topPaddle.controller = game.mode === "4P" ? topController : null;
    bottomPaddle.controller = game.mode === "4P" ? bottomController : null;

    if (game.mode === "4P") {
        game.height = 800;
        topPaddle.x = game.width / 2 - 40;
        topPaddle.y = 20;
        bottomPaddle.x = game.width / 2 - 40;
        bottomPaddle.y = game.height - 35;
    }

    goal.width = game.height / 2;
    goal.top = (game.height - goal.width) / 2;
    goal.bottom = goal.top + goal.width;
    goal.left = (game.width - goal.width) / 2;
    goal.right = goal.left + goal.width;

    showControlsHint();
    startCoinToss(performance.now() / 1000);
}

export function endGame() {
    const controllers = [leftController, rightController, topController, bottomController];
    const bestScore = Math.max(...controllers.map(c => c.score));
    const winners = controllers.filter(c => c.score === bestScore);

    if (winners.length === 1) {
        if (winners[0] === leftController) game.winner = "left";
        else if (winners[0] === rightController) game.winner = "right";
        else if (winners[0] === topController) game.winner = "top";
        else if (winners[0] === bottomController) game.winner = "bottom";
    } else return;

    game.isGameOver = true;
    game.state = GameState.END;
	game.onGameOver?.();
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

