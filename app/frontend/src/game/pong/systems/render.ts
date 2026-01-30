import { AI_HARD, AI_NORMAL } from "../ai/ai";
import { AIController } from "../controllers/aiController";
import {
  ARENA_BOTTOM,
  ARENA_LEFT,
  ARENA_MARGIN_LEFT,
  ARENA_MARGIN_TOP,
  ARENA_RIGHT,
  ARENA_TOP,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GAME_HEIGHT,
  GameState,
} from "../core/constants";
import { game } from "../core/state";
import { ball } from "../entities/ball";
import { leftController, rightController } from "../game";
import { GOAL_BOTTOM, GOAL_TOP } from "../modifiers/arena";
import { gameConfig } from "../modifiers/modifiers";
import { coinToss } from "./coinToss";
import { Paddle } from "../entities/paddle";
import { particles } from "../entities/particles";
import i18n from "../../../i18n.jsx";

// display functions
function drawPaddle(paddle: any) {
  game.ctx!.save();

  game.ctx!.lineWidth = 4;
  game.ctx!.strokeStyle = "magenta";
  game.ctx!.shadowColor = "magenta";
  game.ctx!.shadowBlur = 15;

  game.ctx!.beginPath();
  game.ctx!.roundRect(
    paddle.x + ARENA_MARGIN_LEFT,
    paddle.y + ARENA_MARGIN_TOP,
    paddle.width,
    paddle.height,
    8,
  );
  game.ctx!.stroke();

  game.ctx!.lineWidth = 3;
  game.ctx!.shadowBlur = 0;
  game.ctx!.strokeStyle = "white";
  game.ctx!.beginPath();
  game.ctx!.roundRect(
    paddle.x + ARENA_MARGIN_LEFT,
    paddle.y + ARENA_MARGIN_TOP,
    paddle.width,
    paddle.height,
    8,
  );
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
  game.ctx!.arc(
    ball.x + ARENA_MARGIN_LEFT,
    ball.y + ARENA_MARGIN_TOP,
    ball.radius,
    0,
    Math.PI * 2,
  );
  game.ctx!.stroke();

  game.ctx!.lineWidth = 2;
  game.ctx!.shadowBlur = 0;
  game.ctx!.strokeStyle = "white";
  game.ctx!.beginPath();
  game.ctx!.arc(
    ball.x + ARENA_MARGIN_LEFT,
    ball.y + ARENA_MARGIN_TOP,
    ball.radius,
    0,
    Math.PI * 2,
  );
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

  // Left score
  game.ctx!.lineWidth = 3;
  game.ctx!.strokeStyle = "cyan";
  game.ctx!.shadowColor = "cyan";
  game.ctx!.shadowBlur = 15;
  game.ctx!.strokeText(game.scoreLeft.toString(), CANVAS_WIDTH / 2 - 100, 40);

  game.ctx!.lineWidth = 2;
  game.ctx!.shadowBlur = 0;
  game.ctx!.strokeStyle = "white";
  game.ctx!.strokeText(game.scoreLeft.toString(), CANVAS_WIDTH / 2 - 100, 40);

  // Right score
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

  game.ctx!.fillStyle = "white";
  game.ctx!.shadowColor = "cyan";
  game.ctx!.shadowBlur = 10;

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
  game.ctx!.fillText(
    i18n.t(coinToss.current === "left" ? "left" : "right").toUpperCase(),
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
  );

  game.ctx!.font = "18px monospace";
  if (coinToss.winner && performance.now() / 1000 - coinToss.startTime > 0.7) {
    game.ctx!.fillText(
      i18n.t("servesFirst").toUpperCase(),
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2 + 60,
    );
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

  ctx.save();

  ctx.lineWidth = thickness;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "white";
  ctx.shadowBlur = 18;
  ctx.shadowColor = "magenta";

  // Top wall
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

  // Bottom wall
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

  // Left wall
  ctx.beginPath();
  ctx.moveTo(leftX, topY + radius);
  ctx.lineTo(leftX, GOAL_TOP + ARENA_MARGIN_TOP - radius);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(
    leftX - radius,
    GOAL_TOP + ARENA_MARGIN_TOP - radius,
    radius,
    0,
    Math.PI / 2,
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(leftX, GOAL_BOTTOM + ARENA_MARGIN_TOP + radius);
  ctx.lineTo(leftX, bottomY - radius);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(
    leftX - radius,
    GOAL_BOTTOM + ARENA_MARGIN_TOP + radius,
    radius,
    -Math.PI / 2,
    0,
  );
  ctx.stroke();

  // Left tunnel
  ctx.beginPath();
  ctx.moveTo(leftX - radius, GOAL_TOP + ARENA_MARGIN_TOP);
  ctx.lineTo(0, GOAL_TOP + ARENA_MARGIN_TOP);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(leftX - radius, GOAL_BOTTOM + ARENA_MARGIN_TOP);
  ctx.lineTo(0, GOAL_BOTTOM + ARENA_MARGIN_TOP);
  ctx.stroke();

  // Right wall
  ctx.beginPath();
  ctx.moveTo(rightX, topY + radius);
  ctx.lineTo(rightX, GOAL_TOP + ARENA_MARGIN_TOP - radius);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(
    rightX + radius,
    GOAL_TOP + ARENA_MARGIN_TOP - radius,
    radius,
    Math.PI / 2,
    Math.PI,
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(rightX, GOAL_BOTTOM + ARENA_MARGIN_TOP + radius);
  ctx.lineTo(rightX, bottomY - radius);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(
    rightX + radius,
    GOAL_BOTTOM + ARENA_MARGIN_TOP + radius,
    radius,
    Math.PI,
    -Math.PI / 2,
  );
  ctx.stroke();

  // Right Tunnel
  ctx.beginPath();
  ctx.moveTo(rightX + radius, GOAL_TOP + ARENA_MARGIN_TOP);
  ctx.lineTo(CANVAS_WIDTH, GOAL_TOP + ARENA_MARGIN_TOP);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(rightX + radius, GOAL_BOTTOM + ARENA_MARGIN_TOP);
  ctx.lineTo(CANVAS_WIDTH, GOAL_BOTTOM + ARENA_MARGIN_TOP);
  ctx.stroke();

  ctx.restore();
}

function drawArena() {
  game.ctx!.save();

  game.ctx!.lineWidth = 4;
  game.ctx!.strokeStyle = "white";
  game.ctx!.shadowBlur = 20;

  // Top wall
  game.ctx!.shadowColor = "magenta";
  game.ctx!.beginPath();
  game.ctx!.moveTo(0, ARENA_TOP - 4);
  game.ctx!.lineTo(CANVAS_WIDTH / 2 - 40, ARENA_TOP - 4);
  game.ctx!.stroke();

  game.ctx!.beginPath();
  game.ctx!.moveTo(CANVAS_WIDTH / 2 + 40, ARENA_TOP - 4);
  game.ctx!.lineTo(CANVAS_WIDTH, ARENA_TOP - 4);
  game.ctx!.stroke();

  // Bottom wall
  game.ctx!.shadowColor = "magenta";
  game.ctx!.beginPath();
  game.ctx!.moveTo(0, ARENA_BOTTOM + 4);
  game.ctx!.lineTo(CANVAS_WIDTH, ARENA_BOTTOM + 4);
  game.ctx!.stroke();

  game.ctx!.restore();
}

function drawAIZone() {
  const controller = ball.velX > 0 ? rightController : leftController;

  if (controller instanceof AIController) {
    game.ctx!.save();

    game.ctx!.fillStyle = "rgba(0, 255, 255, 0.12)";
    game.ctx!.fillRect(
      controller.paddle.x - 6 + ARENA_MARGIN_LEFT,
      controller.state.zoneCenter -
        controller.state.zoneRadius +
        ARENA_MARGIN_TOP,
      controller.paddle.width + 12,
      controller.state.zoneRadius * 2,
    );

    game.ctx!.strokeStyle = "cyan";
    game.ctx!.lineWidth = 2;
    game.ctx!.beginPath();
    game.ctx!.moveTo(
      controller.paddle.x - 10 + ARENA_MARGIN_LEFT,
      controller.state.zoneCenter + ARENA_MARGIN_TOP,
    );
    game.ctx!.lineTo(
      controller.paddle.x + controller.paddle.width + 10 + ARENA_MARGIN_LEFT,
      controller.state.zoneCenter + ARENA_MARGIN_TOP,
    );
    game.ctx!.stroke();

    game.ctx!.restore();
  }
}

function drawAITarget() {
  const controller = ball.velX > 0 ? rightController : leftController;

  if (controller instanceof AIController) {
    game.ctx!.save();

    game.ctx!.fillStyle = "yellow";
    game.ctx!.beginPath();
    game.ctx!.arc(
      controller.paddle.x + controller.paddle.width / 2 + ARENA_MARGIN_LEFT,
      controller.state.aimY + ARENA_MARGIN_TOP,
      6,
      0,
      Math.PI * 2,
    );
    game.ctx!.fill();

    game.ctx!.restore();
  }
}

function drawAIPredictionMirror() {
  const controller = ball.velX > 0 ? rightController : leftController;

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

      tX = (controller.paddle.x - x) / vx; // s to reach rightpaddle
      if (vy > 0)
        tY = (GAME_HEIGHT - ball.radius - y) / vy; // s to reach bot
      else if (vy < 0) tY = (ball.radius - y) / vy; // s to reach top
      const t = tX < tY ? tX : tY; // s to reach next obstacle

      x += vx * t; // speed * time = distance
      y += vy * t;

      game.ctx!.lineTo(
        x - ball.radius + ARENA_MARGIN_LEFT,
        y + ARENA_MARGIN_TOP,
      );

      if (t === tY)
        vy *= -1; // if next obstacle top/bot -> vertical reflect
      else break; // stops when hit paddle
    }

    game.ctx!.stroke();
    game.ctx!.restore();
  }
}

function drawAIInfos() {
  const controller = ball.velX > 0 ? rightController : leftController;
  game.ctx!.save();

  game.ctx!.font = "14px monospace";
  game.ctx!.fillStyle = "white";
  game.ctx!.textAlign = "left";

  let y = 20 + ARENA_MARGIN_TOP;
  let x = 20 + ARENA_MARGIN_LEFT;

  game.ctx!.fillText(`DEBUG MODE: ON`, x, y);
  y += 16;
  game.ctx!.fillText(
    `difficulty left: ${leftController instanceof AIController ? (leftController.profile === AI_HARD ? "Hard" : leftController.profile === AI_NORMAL ? "Normal" : "Easy") : "N/A"}`,
    x,
    y,
  );
  y += 16;
  game.ctx!.fillText(
    `difficulty right: ${rightController instanceof AIController ? (rightController.profile === AI_HARD ? "Hard" : rightController.profile === AI_NORMAL ? "Normal" : "Easy") : "N/A"}`,
    x,
    y,
  );
  y += 16;
  if (gameConfig.modifiers.spin) {
    game.ctx!.fillText(
      `spin intentions: ${controller instanceof AIController ? controller.state.wantsSpin : "N/A"}`,
      x,
      y,
    );
    y += 16;
    game.ctx!.fillText(
      `spin direction: ${controller instanceof AIController ? controller.state.spinDir : "N/A"}`,
      x,
      y,
    );
    y += 16;
  }
  // game.ctx!.fillText(`spin: ${game.state}`, x, y); y += 16;
  game.ctx!.fillText(`spin: ${ball.velX}`, x, y);
  y += 16;

  game.ctx!.restore();
}

function drawAIDebug() {
  if (!game.aiDebug) return;

  if (
    (ball.velX > 0 && rightController instanceof AIController) ||
    (ball.velX < 0 && leftController instanceof AIController)
  ) {
    drawAIZone();
    drawAIPredictionMirror();
  }
  drawAITarget();
  drawAIInfos();
}

function drawParticles() {
  for (const p of particles) {
    game.ctx!.save();
    game.ctx!.globalAlpha = p.alpha;
    game.ctx!.fillStyle = "cyan";
    game.ctx!.beginPath();
    game.ctx!.arc(
      p.x + ARENA_MARGIN_LEFT,
      p.y + ARENA_MARGIN_TOP,
      2 + Math.random() * 2,
      0,
      Math.PI * 2,
    );
    game.ctx!.fill();
    game.ctx!.restore();
  }
}

export function render(leftPaddle: Paddle, rightPaddle: Paddle) {
  if (!game.isPaused) {
    game.ctx!.fillStyle = "#0a02147a";
    game.ctx!.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (game.state === GameState.COIN_TOSS) drawCoinToss();
    else {
      if (gameConfig.modifiers.arena) drawGoalsArena();
      else drawArena();
      drawScore();
      drawPaddle(leftPaddle);
      drawPaddle(rightPaddle);
      drawDash();
      drawServeTimer();
      drawTimer();
      drawAIDebug();
      drawBall();
      drawParticles();
    }
  }
}
