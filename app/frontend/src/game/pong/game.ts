import { game } from "./core/state.js";
import { GAMEDURATION, CANVAS_HEIGHT, CANVAS_WIDTH } from "./core/constants.js";
import { leftPaddle, rightPaddle } from "./entities/paddle.js";
import { PlayerController } from "./controllers/playerController.js";
import { AIController } from "./controllers/aiController.js";
import { AI_EASY, AI_HARD, AI_NORMAL } from "./ai/ai.js";
import { updateParticles } from "./entities/particles.js";
import { startCoinToss } from "./systems/coinToss.js";
import { render } from "./systems/render.js";
import { update } from "./systems/update.js";


export let leftController: PlayerController | AIController =
    new PlayerController(leftPaddle, "w", "s");

export let rightController: PlayerController | AIController =
    new PlayerController(rightPaddle, "ArrowUp", "ArrowDown");

// called to initialize the game when pressing start button
export function startGame(playersConfig?: { left: any, right: any })  {
    game.scoreLeft = 0;
    game.scoreRight = 0;
    game.gameTimer = GAMEDURATION;
    game.isGameOver = false;
    game.isPaused = false;

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
        updateParticles(delta, ctx);
        update(delta);

        game.ctx!.fillStyle = "#0a0214a7";
        game.ctx!.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        render(leftPaddle, rightPaddle);
        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    return () => {
        running = false;
    };
}

