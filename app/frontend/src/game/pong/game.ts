import { game } from "./core/state.js";
import { GameState, GAMEDURATION, GAME_HEIGHT, GAME_WIDTH } from "./core/constants.js";
import { ball, resetBall } from "./entities/ball.js";
import { leftPaddle, rightPaddle } from "./entities/paddle.js";
import { gameConfig, displayActiveModifiers } from "./modifiers/modifiers.js";
import { applySpin } from "./modifiers/spin.js";
import { GOAL_TOP, GOAL_HEIGHT } from "./modifiers/arena.js";
import { PlayerController } from "./controllers/playerController.js";
import { AIController } from "./controllers/aiController.js";
import { handlePaddleCollision, handleTopBotCollision, handleLeftRightCollision } from "./systems/collisions.js";
import { AI_EASY, AI_HARD, AI_NORMAL } from "./ai/ai.js";



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
    handleTopBotCollision();
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

    displayActiveModifiers();

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

    // applique les modifiers actuels (GameSetup)
    displayActiveModifiers();


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

function endGame() {
    game.state = GameState.END;
    game.isGameOver = true;
}



// display functions
function drawScore() {
    // const color = "#ff0";
    const text = `${game.scoreLeft}    ${game.scoreRight}`;

    game.ctx!.font = "bold 72px 'Arial'";
    game.ctx!.textAlign = "center";
    game.ctx!.textBaseline = "middle";

    // game.ctx!.shadowColor = color;
    // game.ctx!.shadowBlur = 15;
    // game.ctx!.globalAlpha = 1;
    // game.ctx!.fillStyle = color;
    // game.ctx!.fillText(text, GAME_WIDTH / 2, 70);

    // game.ctx!.shadowBlur = 0;
    game.ctx!.fillStyle = "white";
    game.ctx!.fillText(text, GAME_WIDTH / 2, 70);
}

function drawDash() {
    // const color = "#0f0";
    const dash = [10, 25];

    game.ctx!.setLineDash(dash);
    game.ctx!.lineWidth = 3;

    // game.ctx!.shadowColor = color;
    // game.ctx!.strokeStyle = color;

    game.ctx!.beginPath();
    game.ctx!.moveTo(GAME_WIDTH / 2, 0);
    game.ctx!.lineTo(GAME_WIDTH / 2, GAME_HEIGHT);

    // game.ctx!.shadowBlur = 10;
    // game.ctx!.globalAlpha = 1;
    // game.ctx!.strokeStyle = color;
    // game.ctx!.stroke();

    // cœur blanc
    // game.ctx!.shadowBlur = 0;
    game.ctx!.strokeStyle = "white";
    game.ctx!.lineWidth = 1.5;
    game.ctx!.stroke();

    game.ctx!.setLineDash([]);
}

function drawPaddle(paddle: any) {
    // const color = "#f0f";
    const radius = 8;

    // game.ctx!.shadowColor = color;
    // game.ctx!.shadowBlur = 15;
    // game.ctx!.globalAlpha = 1;
    // game.ctx!.fillStyle = color;
    // game.ctx!.beginPath();
    // game.ctx!.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, radius);
    // game.ctx!.fill();

    // game.ctx!.shadowBlur = 0;
    game.ctx!.fillStyle = "white";
    game.ctx!.beginPath();
    game.ctx!.roundRect(paddle.x + 4, paddle.y + 4, paddle.width - 8, paddle.height - 8, radius / 2);
    game.ctx!.fill();
}

function drawBall() {
    // const color = "#0ff";

    // game.ctx!.shadowColor = color;
    // game.ctx!.shadowBlur = 15;
    // game.ctx!.globalAlpha = 1;
    // game.ctx!.fillStyle = color;
    // game.ctx!.beginPath();
    // game.ctx!.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    // game.ctx!.fill();

    // game.ctx!.shadowBlur = 0;
    game.ctx!.fillStyle = "white";
    game.ctx!.beginPath();
    game.ctx!.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    game.ctx!.fill();
}

function drawServeTimer() {
    if (game.state === GameState.SERVE) {
        game.ctx!.fillStyle = "grey";
        game.ctx!.font = "bold 200px Arial";
        game.ctx!.textAlign = "center";
        game.ctx!.fillText(Math.ceil(game.serveTimer).toString(), GAME_WIDTH / 2, GAME_HEIGHT / 2);
    }
}

function drawArena() {
    game.ctx!.fillStyle = "grey";
    game.ctx!.fillRect(0, GOAL_TOP, 10, GOAL_HEIGHT);
    game.ctx!.fillRect(GAME_WIDTH - 10, GOAL_TOP, 10, GOAL_HEIGHT);
}

function drawAIZone() {
    const controller =
        ball.velX > 0 ? rightController : leftController;

    if (controller instanceof AIController) {
        game.ctx!.save();

        game.ctx!.fillStyle = "rgba(0, 255, 255, 0.12)";
        game.ctx!.fillRect(
            controller.paddle.x - 6,
            controller.state.zoneCenter - controller.state.zoneRadius,
            controller.paddle.width + 12,
            controller.state.zoneRadius * 2
        );

        game.ctx!.strokeStyle = "cyan";
        game.ctx!.lineWidth = 2;
        game.ctx!.beginPath();
        game.ctx!.moveTo(controller.paddle.x - 10, controller.state.zoneCenter);
        game.ctx!.lineTo(controller.paddle.x + controller.paddle.width + 10, controller.state.zoneCenter);
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
            controller.paddle.x + controller.paddle.width / 2,
            controller.state.aimY,
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
        game.ctx!.moveTo(x, y);

        while (1) {
            let tX = 10;
            let tY = 10;

            tX = (controller.paddle.x - x) / vx;        // s to reach rightpaddle
            if (vy > 0)      tY = (GAME_HEIGHT - ball.radius - y) / vy; // s to reach bot
            else if (vy < 0) tY = (ball.radius - y) / vy;          // s to reach top
            const t = tX < tY ? tX : tY;                           // s to reach next obstacle

            x += vx * t; // speed * time = distance
            y += vy * t;

            game.ctx!.lineTo(x, y);

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

    let y = 20;

    game.ctx!.fillText(`DEBUG MODE: ON`, 20, y); y += 16;
    game.ctx!.fillText(`difficulty left: ${leftController instanceof AIController ? leftController.profile === AI_HARD ? "Hard" : leftController.profile === AI_NORMAL ? "Normal" : "Easy" : "N/A"}`, 20, y); y += 16;
    game.ctx!.fillText(`difficulty right: ${rightController instanceof AIController ? rightController.profile === AI_HARD ? "Hard" : rightController.profile === AI_NORMAL ? "Normal" : "Easy" : "N/A"}`, 20, y); y += 16;
    if (gameConfig.modifiers.spin) {
        game.ctx!.fillText(`spin intentions: ${controller instanceof AIController ? controller.state.wantsSpin : "N/A"}`, 20, y); y += 16;
        game.ctx!.fillText(`spin direction: ${controller instanceof AIController ? controller.state.spinDir : "N/A"}`, 20, y); y += 16;
    }
    game.ctx!.fillText(`spin: ${ball.spin}`, 20, y); y += 16;

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

function drawCoinToss() {
    game.ctx!.save();

    game.ctx!.fillStyle = "white";
    game.ctx!.textAlign = "center";
    game.ctx!.textBaseline = "middle";

    game.ctx!.font = "bold 72px Arial";
    game.ctx!.fillText(coinToss.current === "left" ? "LEFT" : "RIGHT", GAME_WIDTH / 2, GAME_HEIGHT / 2);

    game.ctx!.font = "18px monospace";
    if (coinToss.winner && performance.now() / 1000  - coinToss.startTime > 0.70)
        game.ctx!.fillText("SERVES FIRST", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60);

    game.ctx!.restore();
}

function drawTimer() {
    if (game.state === GameState.SERVE) {
        game.ctx!.fillStyle = "grey";
        game.ctx!.font = "bold 200px Arial";
        game.ctx!.textAlign = "center";
        game.ctx!.fillText(Math.ceil(game.serveTimer).toString(), GAME_WIDTH / 2, GAME_HEIGHT / 2);
    }

    game.ctx!.fillStyle = "white";
    game.ctx!.font = "bold 32px Arial";
    game.ctx!.textAlign = "center";
    game.ctx!.fillText(`${Math.ceil(game.gameTimer)}`, GAME_WIDTH / 2, 40);
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
        update(delta);

        game.ctx!.fillStyle = "rgba(0, 0, 0, 1)";
        game.ctx!.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        if (game.state === GameState.COIN_TOSS)
            drawCoinToss();
        else {
            if (gameConfig.modifiers.arena)
                drawArena();
            drawScore();
            drawPaddle(leftPaddle);
            drawPaddle(rightPaddle);
            drawDash();
            drawServeTimer();
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

