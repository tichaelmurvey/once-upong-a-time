import {
  FIELD_W,
  FIELD_H,
  PADDLE_H,
  PADDLE_SPEED,
  PADDLE_X_OFFSET,
  PADDLE_W,
  BALL_SIZE,
  BALL_SPEED,
  MAX_BALL_SPEED,
  WIN_SCORE,
} from "../shared/constants.js";
import type { GameState, Direction } from "../shared/types.js";

export function createInitialState(): GameState {
  return {
    ball: { x: FIELD_W / 2, y: FIELD_H / 2, vx: 0, vy: 0 },
    paddles: [
      { y: (FIELD_H - PADDLE_H) / 2 },
      { y: (FIELD_H - PADDLE_H) / 2 },
    ],
    scores: [0, 0],
    status: "waiting",
  };
}

export function launchBall(state: GameState, towardPlayer?: 1 | 2): void {
  const angle = (Math.random() - 0.5) * (Math.PI / 3); // -30° to +30°
  const dir = towardPlayer === 1 ? -1 : towardPlayer === 2 ? 1 : (Math.random() < 0.5 ? -1 : 1);
  state.ball.x = FIELD_W / 2;
  state.ball.y = FIELD_H / 2;
  state.ball.vx = Math.cos(angle) * BALL_SPEED * dir;
  state.ball.vy = Math.sin(angle) * BALL_SPEED;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function tick(state: GameState, inputs: [Direction, Direction]): void {
  if (state.status !== "playing") return;

  // Move paddles
  for (let i = 0; i < 2; i++) {
    if (inputs[i] === "up") state.paddles[i].y -= PADDLE_SPEED;
    if (inputs[i] === "down") state.paddles[i].y += PADDLE_SPEED;
    state.paddles[i].y = clamp(state.paddles[i].y, 0, FIELD_H - PADDLE_H);
  }

  const ball = state.ball;

  // Move ball
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Wall collisions (top/bottom)
  if (ball.y - BALL_SIZE / 2 <= 0) {
    ball.y = BALL_SIZE / 2;
    ball.vy = Math.abs(ball.vy);
  } else if (ball.y + BALL_SIZE / 2 >= FIELD_H) {
    ball.y = FIELD_H - BALL_SIZE / 2;
    ball.vy = -Math.abs(ball.vy);
  }

  // Paddle collisions
  // Player 1 paddle (left)
  const p1x = PADDLE_X_OFFSET;
  const p1y = state.paddles[0].y;
  if (
    ball.vx < 0 &&
    ball.x - BALL_SIZE / 2 <= p1x + PADDLE_W &&
    ball.x - BALL_SIZE / 2 >= p1x &&
    ball.y >= p1y &&
    ball.y <= p1y + PADDLE_H
  ) {
    reflectOffPaddle(ball, p1y, 1);
  }

  // Player 2 paddle (right)
  const p2x = FIELD_W - PADDLE_X_OFFSET - PADDLE_W;
  const p2y = state.paddles[1].y;
  if (
    ball.vx > 0 &&
    ball.x + BALL_SIZE / 2 >= p2x &&
    ball.x + BALL_SIZE / 2 <= p2x + PADDLE_W &&
    ball.y >= p2y &&
    ball.y <= p2y + PADDLE_H
  ) {
    reflectOffPaddle(ball, p2y, -1);
  }

  // Scoring
  if (ball.x < 0) {
    state.scores[1]++;
    if (state.scores[1] >= WIN_SCORE) {
      state.status = "finished";
      state.winner = 2;
    } else {
      launchBall(state, 1); // serve toward player 1
    }
  } else if (ball.x > FIELD_W) {
    state.scores[0]++;
    if (state.scores[0] >= WIN_SCORE) {
      state.status = "finished";
      state.winner = 1;
    } else {
      launchBall(state, 2); // serve toward player 2
    }
  }
}

function reflectOffPaddle(
  ball: GameState["ball"],
  paddleY: number,
  directionX: 1 | -1,
): void {
  const hitPos = (ball.y - paddleY) / PADDLE_H; // 0 to 1
  const angle = (hitPos - 0.5) * (Math.PI / 3); // -60° to +60°
  const currentSpeed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
  const speed = Math.min(currentSpeed + 0.2, MAX_BALL_SPEED);
  ball.vx = Math.cos(angle) * speed * directionX;
  ball.vy = Math.sin(angle) * speed;
}
