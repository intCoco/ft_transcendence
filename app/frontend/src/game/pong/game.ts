import { game } from "./core/state.js";
import { GameState, GAMEDURATION, GAME_HEIGHT, CANVAS_HEIGHT, CANVAS_WIDTH, ARENA_MARGIN_TOP, ARENA_BOTTOM, ARENA_LEFT, ARENA_MARGIN_LEFT, ARENA_RIGHT, ARENA_TOP } from "./core/constants.js";
import { ball, resetBall } from "./entities/ball.js";
import { leftPaddle, rightPaddle } from "./entities/paddle.js";
import { gameConfig } from "./modifiers/modifiers.js";
import { applySpin } from "./modifiers/spin.js";
import { GOAL_TOP, GOAL_HEIGHT } from "./modifiers/arena.js";
import { PlayerController } from "./controllers/playerController.js";
import { AIController } from "./controllers/aiController.js";
import { handlePaddleCollision, handleTopBotCollision, handleLeftRightCollision } from "./systems/collisions.js";
import { AI_EASY, AI_HARD, AI_NORMAL } from "./ai/ai.js";
import { updateParticles } from "./entities/particles.js";



export let leftController: PlayerController | AIController =
    new PlayerController(leftPaddle, "w", "s");

export let rightController: PlayerController | AIController =
    new PlayerController(rightPaddle, "ArrowUp", "ArrowDown");




// actual game : function that runs every frame 
// handles movements, maths, behaviors
function update(delta: number) {
    if (game.state === GameState.MENU || game.isPaused || game.state === GameState.END) return;
    const now = performance.now() / 1000;

    if (game.state === GameState.COIN_TOSS) {
        updateCoinToss(now);
        return;
    }

    leftController.update(leftPaddle, delta);
    leftPaddle.clamp(GAME_HEIGHT);

    // clamping: limits the paddles movements from all the way up to all the way down the canvas. Stops it from going OOB
    rightController.update(rightPaddle, delta);
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


    // ball behavior: handles ball movement depending on the selected modifiers
    if (game.state === GameState.PLAY)
    {
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

}




// game start: coin toss + start
interface CoinTossState {
    phase: "ROLLING" | "RESULT";

    startTime: number;
    rollDuration: number;
    resultDuration: number;

    current: "left" | "right";
    winner: "left" | "right" | null;

    lastSwitchTime: number;
}

const coinToss: CoinTossState = {
    phase: "ROLLING",

    startTime: 0,
    rollDuration: 4,
    resultDuration: 2,

    current: "left",
    winner: null,

    lastSwitchTime: 0
};

function startCoinToss(now: number) {
    coinToss.phase = "ROLLING";
    coinToss.startTime = now;
    coinToss.lastSwitchTime = now;

    coinToss.current = "left";
    coinToss.winner = null;

    game.state = GameState.COIN_TOSS;
}

function updateCoinToss(now: number) {
    const elapsed = now - coinToss.startTime;

    if (coinToss.phase === "ROLLING") {
        const progress = Math.min(1, elapsed / coinToss.rollDuration);

        const minInterval = 0.03;
        const maxInterval = 0.5;

        const interval = minInterval + (maxInterval - minInterval) * (progress * progress);

        if (now - coinToss.lastSwitchTime >= interval) {
            coinToss.current = coinToss.current === "left" ? "right" : "left";
            coinToss.lastSwitchTime = now;
        }

        if (elapsed >= coinToss.rollDuration) {
            coinToss.phase = "RESULT";
            coinToss.startTime = now;
            coinToss.winner = coinToss.current;
        }

        return;
    }

    if (coinToss.phase === "RESULT") {
        if (elapsed >= coinToss.resultDuration) {
            resetBall(coinToss.winner === "left" ? "right" : "left");
            game.state = GameState.SERVE;
        }
    }
}

// called to initialize the game when pressing start button
export function startGame(playersConfig?: { left: any, right: any })  {
    // document.getElementById("menu")!.style.display = "none";
    // canvas.style.display = "block";

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
        // gauche
        if (playersConfig.left.type === "Player") {
            leftController = new PlayerController(
                leftPaddle,
                playersConfig.left.up,
                playersConfig.left.down
            );
        } else {
            leftController = new AIController(leftPaddle, playersConfig.left.aiDifficulty === "Hard" ? AI_HARD : playersConfig.left.aiDifficulty === "Normal" ? AI_NORMAL : AI_EASY);
        }

        // droite
        if (playersConfig.right.type === "Player") {
            rightController = new PlayerController(
                rightPaddle,
                playersConfig.right.up,
                playersConfig.right.down
            );
        } else {
            rightController = new AIController(rightPaddle, playersConfig.right.aiDifficulty === "Hard" ? AI_HARD : playersConfig.right.aiDifficulty === "Normal" ? AI_NORMAL : AI_EASY);
        
    console.log(rightController.profile.reactionTime);}
    }


    startCoinToss(performance.now() / 1000);

}


// function endGame() {
//     let finalMessage = "";
//     game.state = GameState.END;

//     if (game.scoreLeft > game.scoreRight) finalMessage = "Victory!";
//     else if (game.scoreRight > game.scoreLeft) finalMessage = "Defeat!";
//     else finalMessage = "Draw!";

//     const endMenu = document.getElementById("end-menu");
//     const endMessage = document.getElementById("end-message");
//     if (endMenu && endMessage) {
//         endMessage.innerText = finalMessage;
//         endMenu.style.display = "block";
//     }
// }


// display functions
function drawPaddle(paddle: any) {
    game.ctx!.save();

    game.ctx!.lineWidth = 4;
    game.ctx!.strokeStyle = "magenta";
    game.ctx!.shadowColor = "magenta";
    game.ctx!.shadowBlur = 15;

    game.ctx!.beginPath();
    game.ctx!.roundRect(paddle.x + ARENA_MARGIN_LEFT, paddle.y + ARENA_MARGIN_TOP, paddle.width, paddle.height, 8);
    game.ctx!.stroke();

    game.ctx!.lineWidth = 3;
    game.ctx!.shadowBlur = 0;
    game.ctx!.strokeStyle = "white";
    game.ctx!.beginPath();
    game.ctx!.roundRect(paddle.x + ARENA_MARGIN_LEFT, paddle.y + ARENA_MARGIN_TOP, paddle.width, paddle.height, 8);
    game.ctx!.stroke();

    game.ctx!.restore();
}

function drawBall() {
    game.ctx!.save();

    game.ctx!.lineWidth = 4;
    game.ctx!.strokeStyle = "cyan";
    game.ctx!.shadowColor = "cyan";
    game.ctx!.shadowBlur = 20;

    game.ctx!.beginPath();
    game.ctx!.arc(ball.x + ARENA_MARGIN_LEFT, ball.y + ARENA_MARGIN_TOP, ball.radius, 0, Math.PI * 2);
    game.ctx!.stroke();

    game.ctx!.lineWidth = 2;
    game.ctx!.shadowBlur = 0;
    game.ctx!.strokeStyle = "white";
    game.ctx!.beginPath();
    game.ctx!.arc(ball.x + ARENA_MARGIN_LEFT, ball.y + ARENA_MARGIN_TOP, ball.radius, 0, Math.PI * 2);
    game.ctx!.stroke();

    game.ctx!.restore();
}

function drawDash() {
    game.ctx!.setLineDash([12, 24]);
    game.ctx!.lineWidth = 2;

    game.ctx!.save();
    game.ctx!.strokeStyle = "purple";
    game.ctx!.shadowColor = "purple";
    game.ctx!.shadowBlur = 10;

    game.ctx!.beginPath();
    game.ctx!.moveTo(CANVAS_WIDTH / 2, ARENA_TOP);
    game.ctx!.lineTo(CANVAS_WIDTH / 2, ARENA_BOTTOM);
    game.ctx!.stroke();

    game.ctx!.restore();
    game.ctx!.setLineDash([]);
}

function drawScore() {
    game.ctx!.save();
    game.ctx!.font = `bold 72px Arial`;
    game.ctx!.textAlign = "left";
    game.ctx!.textBaseline = "top";

    // Score gauche
    game.ctx!.lineWidth = 3;
    game.ctx!.strokeStyle = "cyan";
    game.ctx!.shadowColor = "cyan";
    game.ctx!.shadowBlur = 15;
    game.ctx!.strokeText(game.scoreLeft.toString(), CANVAS_WIDTH / 2 - 100, 40);

    game.ctx!.lineWidth = 2;
    game.ctx!.shadowBlur = 0;
    game.ctx!.strokeStyle = "white";
    game.ctx!.strokeText(game.scoreLeft.toString(), CANVAS_WIDTH / 2 - 100, 40);

    // Score droit
    game.ctx!.textAlign = "right";
    game.ctx!.lineWidth = 3;
    game.ctx!.strokeStyle = "cyan";
    game.ctx!.shadowColor = "cyan";
    game.ctx!.shadowBlur = 15;
    game.ctx!.strokeText(game.scoreRight.toString(), CANVAS_WIDTH / 2 + 100, 40);

    game.ctx!.lineWidth = 2;
    game.ctx!.shadowBlur = 0;
    game.ctx!.strokeStyle = "white";
    game.ctx!.strokeText(game.scoreRight.toString(), CANVAS_WIDTH / 2 + 100, 40);

    game.ctx!.restore();
}

function drawTimer() {
    game.ctx!.save();
    game.ctx!.font = `bold 48px Arial`;
    game.ctx!.textAlign = "center";
    game.ctx!.textBaseline = "top";

    // Glow
    game.ctx!.fillStyle = "white";
    game.ctx!.shadowColor = "cyan";
    game.ctx!.shadowBlur = 10;

    // Timer centré horizontalement, un peu sous le haut du canvas
    game.ctx!.fillText(`${Math.ceil(game.gameTimer)}`, CANVAS_WIDTH / 2, 10);

    game.ctx!.restore();
}

function drawServeTimer() {
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
    game.ctx!.strokeText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    game.ctx!.lineWidth = 5;
    game.ctx!.shadowBlur = 0;
    game.ctx!.strokeStyle = "white";
    game.ctx!.strokeText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    game.ctx!.restore();
}



function drawCoinToss() {
    game.ctx!.save();

    game.ctx!.textAlign = "center";
    game.ctx!.textBaseline = "middle";
    game.ctx!.font = "bold 72px Arial";

    game.ctx!.fillStyle = "white";
    game.ctx!.shadowColor = "cyan";
    game.ctx!.shadowBlur = 15;
    game.ctx!.fillText(coinToss.current === "left" ? "LEFT" : "RIGHT", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    game.ctx!.font = "18px monospace";
    if (coinToss.winner && performance.now() / 1000 - coinToss.startTime > 0.70) {
        game.ctx!.fillText("SERVES FIRST", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    }

    game.ctx!.restore();
}



function drawGoalsArena() {
    const ctx = game.ctx!;

    const thickness = 4;
    const radius = 6;

    const topY = ARENA_TOP - thickness;
    const bottomY = ARENA_BOTTOM + thickness;
    const leftX = ARENA_LEFT - thickness;
    const rightX = ARENA_RIGHT + thickness;

    const goalTop = GOAL_TOP + ARENA_MARGIN_TOP;
    const goalBottom = goalTop + GOAL_HEIGHT;

    ctx.save();

    ctx.lineWidth = thickness;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "white";
    ctx.shadowBlur = 18;
    ctx.shadowColor = "magenta";

    // ─────────────
    // Mur du haut
    // ─────────────

    ctx.beginPath();
    ctx.moveTo(leftX + radius, topY);
    ctx.lineTo(CANVAS_WIDTH / 2 - 40, topY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2 + 40, topY);
    ctx.lineTo(rightX - radius, topY);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(leftX + radius, topY + radius, radius, Math.PI, -Math.PI / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(rightX - radius, topY + radius, radius, -Math.PI / 2, 0);
    ctx.stroke();

    // ─────────────
    // Mur du bas
    // ─────────────
    ctx.beginPath();
    ctx.moveTo(leftX + radius, bottomY);
    ctx.lineTo(rightX - radius, bottomY);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(leftX + radius, bottomY - radius, radius, Math.PI / 2, Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(rightX - radius, bottomY - radius, radius, 0, Math.PI / 2);
    ctx.stroke();

    // ─────────────
    // Mur gauche (arène)
    // ─────────────
    ctx.beginPath();
    ctx.moveTo(leftX, topY + radius);
    ctx.lineTo(leftX, goalTop - radius);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(leftX - radius, goalTop - radius, radius, 0, Math.PI / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(leftX, goalBottom + radius);
    ctx.lineTo(leftX, bottomY - radius);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(leftX - radius, goalBottom + radius, radius, -Math.PI / 2, 0);
    ctx.stroke();

    // ─────────────
    // Tunnel gauche (jusqu’au canvas)
    // ─────────────
    ctx.beginPath();
    ctx.moveTo(leftX - radius, goalTop);
    ctx.lineTo(0, goalTop);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(leftX - radius, goalBottom);
    ctx.lineTo(0, goalBottom);
    ctx.stroke();

    // ─────────────
    // Mur droit (arène)
    // ─────────────
    ctx.beginPath();
    ctx.moveTo(rightX, topY + radius);
    ctx.lineTo(rightX, goalTop - radius);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(rightX + radius, goalTop - radius, radius, Math.PI / 2, Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightX, goalBottom + radius);
    ctx.lineTo(rightX, bottomY - radius);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(rightX + radius, goalBottom + radius, radius, Math.PI, -Math.PI / 2);
    ctx.stroke();

    // ─────────────
    // Tunnel droit (jusqu’au canvas)
    // ─────────────

    ctx.beginPath();
    ctx.moveTo(rightX + radius, goalTop);
    ctx.lineTo(CANVAS_WIDTH, goalTop);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightX + radius, goalBottom);
    ctx.lineTo(CANVAS_WIDTH, goalBottom);
    ctx.stroke();

    ctx.restore();
}




function drawArena() {
    game.ctx!.save();

    game.ctx!.lineWidth = 4;
    game.ctx!.strokeStyle = "white";
    game.ctx!.shadowBlur = 20;

    // Ligne du haut
    game.ctx!.shadowColor = "magenta";
    game.ctx!.beginPath();
    game.ctx!.moveTo(0, ARENA_TOP - 4);
    game.ctx!.lineTo(CANVAS_WIDTH / 2 - 40, ARENA_TOP - 4);
    game.ctx!.stroke();

    game.ctx!.beginPath();
    game.ctx!.moveTo(CANVAS_WIDTH / 2 + 40, ARENA_TOP - 4);
    game.ctx!.lineTo(CANVAS_WIDTH, ARENA_TOP - 4);
    game.ctx!.stroke();

    // Ligne du bas
    game.ctx!.shadowColor = "magenta";
    game.ctx!.beginPath();
    game.ctx!.moveTo(0, ARENA_BOTTOM + 4);
    game.ctx!.lineTo(CANVAS_WIDTH, ARENA_BOTTOM + 4);
    game.ctx!.stroke();

    game.ctx!.restore();

}

function drawAIZone() {
    const controller =
        ball.velX > 0 ? rightController : leftController;

    if (controller instanceof AIController) {
        game.ctx!.save();

        game.ctx!.fillStyle = "rgba(0, 255, 255, 0.12)";
        game.ctx!.fillRect(
            controller.paddle.x - 6 + ARENA_MARGIN_LEFT,
            controller.state.zoneCenter - controller.state.zoneRadius + ARENA_MARGIN_TOP,
            controller.paddle.width + 12,
            controller.state.zoneRadius * 2
        );

        game.ctx!.strokeStyle = "cyan";
        game.ctx!.lineWidth = 2;
        game.ctx!.beginPath();
        game.ctx!.moveTo(controller.paddle.x - 10 + ARENA_MARGIN_LEFT, controller.state.zoneCenter + ARENA_MARGIN_TOP);
        game.ctx!.lineTo(controller.paddle.x + controller.paddle.width + 10 + ARENA_MARGIN_LEFT, controller.state.zoneCenter + ARENA_MARGIN_TOP);
        game.ctx!.stroke();

        game.ctx!.restore();
    }
}


function drawAITarget() {
    const controller =
        ball.velX > 0 ? rightController : leftController;
        
    if (controller instanceof AIController) {
        game.ctx!.save();

        game.ctx!.fillStyle = "yellow";
        game.ctx!.beginPath();
        game.ctx!.arc(
            controller.paddle.x + controller.paddle.width / 2 + ARENA_MARGIN_LEFT,
            controller.state.aimY + ARENA_MARGIN_TOP,
            6,
            0,
            Math.PI * 2
        );
        game.ctx!.fill();

        game.ctx!.restore();
    }
}


function drawAIPredictionMirror() {
    const controller =
        ball.velX > 0 ? rightController : leftController;
        
    if (controller instanceof AIController) {
        let x = ball.x;
        let y = ball.y;

        let vx = ball.velX;
        let vy = ball.velY;

        game.ctx!.save();
        game.ctx!.strokeStyle = "rgba(255, 0, 0, 0.8)";
        game.ctx!.lineWidth = 2;
        game.ctx!.setLineDash([8, 8]);

        game.ctx!.beginPath();
        game.ctx!.moveTo(x + ARENA_MARGIN_LEFT, y + ARENA_MARGIN_TOP);

        while (1) {
            let tX = 10;
            let tY = 10;

            tX = (controller.paddle.x - x) / vx;        // s to reach rightpaddle
            if (vy > 0)      tY = (GAME_HEIGHT - ball.radius - y) / vy; // s to reach bot
            else if (vy < 0) tY = (ball.radius - y) / vy;          // s to reach top
            const t = tX < tY ? tX : tY;                           // s to reach next obstacle

            x += vx * t; // speed * time = distance
            y += vy * t;

            game.ctx!.lineTo(x - ball.radius + ARENA_MARGIN_LEFT, y + ARENA_MARGIN_TOP);

            if (t === tY) vy *= -1; // if next obstacle top/bot -> vertical reflect
            else break; // stops when hit paddle
        }

        game.ctx!.stroke();
        game.ctx!.restore();
    }
}

function drawAIInfos() {
    const controller =
        ball.velX > 0 ? rightController : leftController;
    game.ctx!.save();

    game.ctx!.font = "14px monospace";
    game.ctx!.fillStyle = "white";
    game.ctx!.textAlign = "left";

    let y = 20 + ARENA_MARGIN_TOP;
    let x = 20 + ARENA_MARGIN_LEFT;

    game.ctx!.fillText(`DEBUG MODE: ON`, x, y); y += 16;
    game.ctx!.fillText(`difficulty left: ${leftController instanceof AIController ? leftController.profile === AI_HARD ? "Hard" : leftController.profile === AI_NORMAL ? "Normal" : "Easy" : "N/A"}`, x, y); y += 16;
    game.ctx!.fillText(`difficulty right: ${rightController instanceof AIController ? rightController.profile === AI_HARD ? "Hard" : rightController.profile === AI_NORMAL ? "Normal" : "Easy" : "N/A"}`, x, y); y += 16;
    if (gameConfig.modifiers.spin) {
        game.ctx!.fillText(`spin intentions: ${controller instanceof AIController ? controller.state.wantsSpin : "N/A"}`, x, y); y += 16;
        game.ctx!.fillText(`spin direction: ${controller instanceof AIController ? controller.state.spinDir : "N/A"}`, x, y); y += 16;
    }
    game.ctx!.fillText(`spin: ${ball.spin}`, x, y); y += 16;

    game.ctx!.restore();
}

function drawAIDebug() {
    if (!game.aiDebug) return;

    if ((ball.velX > 0 && rightController instanceof AIController)
        || (ball.velX < 0 && leftController instanceof AIController)
    ) {
        drawAIZone();
        drawAIPredictionMirror();
    }
    drawAITarget();
    drawAIInfos();
}



export function startPongGame(canvas: HTMLCanvasElement, playersConfig?: any) {
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return () => {};
    
    let running = true;
    let lastTime = performance.now();

    startGame(playersConfig);
    function loop(now: number) {
        if (!running || !leftController || !rightController) return;
        // const rect = canvas.getBoundingClientRect();
        // if (rect.width === 0 || rect.height === 0) return () => {};

        game.ctx = ctx;

        const delta = (now - lastTime) / 1000;
        lastTime = now;
        updateParticles(delta, ctx);
        update(delta);

        game.ctx!.fillStyle = "#0a0214a7";
        game.ctx!.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        if (game.state === GameState.COIN_TOSS)
            drawCoinToss();
        else {
            if (gameConfig.modifiers.arena)
                drawGoalsArena();
            else
                drawArena();
            drawScore();
            drawPaddle(leftPaddle);
            drawPaddle(rightPaddle);
            drawServeTimer();
            drawDash();
            drawTimer();
            drawAIDebug();
            drawBall();

        }
        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    return () => {
        running = false;
    };
}

