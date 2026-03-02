import {
  FIELD_W,
  FIELD_H,
  PADDLE_SPEED,
  PADDLE_X_OFFSET,
  PADDLE_W,
  BALL_SIZE,
  BALL_SPEED,
  MAX_BALL_SPEED,
  MAX_WORD_LENGTH,
} from "../shared/constants.js";
import { getPaddleHeight } from "../shared/types.js";
import type { GameState, Direction } from "../shared/types.js";

export function createInitialState(): GameState {
  return {
    ball: { x: FIELD_W / 2, y: FIELD_H / 2, vx: 0, vy: 0 },
    paddles: [
      { y: FIELD_H / 2, word: "", canType: false },
      { y: FIELD_H / 2, word: "", canType: false },
    ],
    words: [],
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

  if (towardPlayer === undefined) {
    // Initial launch: both players can type
    state.paddles[0].word = "";
    state.paddles[0].canType = true;
    state.paddles[1].word = "";
    state.paddles[1].canType = true;
  } else {
    // After a score: both words clear, receiving player can type
    const receiver = towardPlayer - 1; // 0 or 1
    const other = receiver === 0 ? 1 : 0;
    state.paddles[0].word = "";
    state.paddles[1].word = "";
    state.paddles[receiver].canType = true;
    state.paddles[other].canType = false;
  }
}

export function handleTypeChar(state: GameState, playerIndex: 0 | 1, char: string): void {
  const paddle = state.paddles[playerIndex];
  if (state.status !== "playing") return;
  if (!paddle.canType) return;
  if (!/^[a-z]$/.test(char)) return;
  if (paddle.word.length >= MAX_WORD_LENGTH) return;
  paddle.word += char;
}

export function handleBackspace(state: GameState, playerIndex: 0 | 1): void {
  const paddle = state.paddles[playerIndex];
  if (state.status !== "playing") return;
  if (!paddle.canType) return;
  if (paddle.word.length === 0) return;
  paddle.word = paddle.word.slice(0, -1);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function tick(state: GameState, inputs: [Direction, Direction]): void {
  if (state.status !== "playing") return;

  // Move paddles (y is the center of the paddle)
  for (let i = 0; i < 2; i++) {
    const paddleH = getPaddleHeight(state.paddles[i]);
    if (inputs[i] === "up") state.paddles[i].y -= PADDLE_SPEED;
    if (inputs[i] === "down") state.paddles[i].y += PADDLE_SPEED;
    const halfH = paddleH / 2;
    state.paddles[i].y = clamp(state.paddles[i].y, halfH, FIELD_H - halfH);
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

  // Paddle collisions (y is center, so top = y - h/2, bottom = y + h/2)
  // Player 1 paddle (left)
  const p1x = PADDLE_X_OFFSET;
  const p1h = getPaddleHeight(state.paddles[0]);
  const p1top = state.paddles[0].y - p1h / 2;
  if (
    p1h > 0 &&
    ball.vx < 0 &&
    ball.x - BALL_SIZE / 2 <= p1x + PADDLE_W &&
    ball.x - BALL_SIZE / 2 >= p1x &&
    ball.y >= p1top &&
    ball.y <= p1top + p1h
  ) {
    reflectOffPaddle(ball, p1top, p1h, 1);
    // P1 hit: record word, reset P2, P2 can type, P1 locked
    if (state.paddles[0].word) state.words.push(state.paddles[0].word);
    state.paddles[1].word = "";
    state.paddles[1].canType = true;
    state.paddles[0].canType = false;
  }

  // Player 2 paddle (right)
  const p2x = FIELD_W - PADDLE_X_OFFSET - PADDLE_W;
  const p2h = getPaddleHeight(state.paddles[1]);
  const p2top = state.paddles[1].y - p2h / 2;
  if (
    p2h > 0 &&
    ball.vx > 0 &&
    ball.x + BALL_SIZE / 2 >= p2x &&
    ball.x + BALL_SIZE / 2 <= p2x + PADDLE_W &&
    ball.y >= p2top &&
    ball.y <= p2top + p2h
  ) {
    reflectOffPaddle(ball, p2top, p2h, -1);
    // P2 hit: record word, reset P1, P1 can type, P2 locked
    if (state.paddles[1].word) state.words.push(state.paddles[1].word);
    state.paddles[0].word = "";
    state.paddles[0].canType = true;
    state.paddles[1].canType = false;
  }

  // Ball out of bounds — game over
  if (ball.x < 0) {
    state.status = "finished";
    state.winner = 2;
    state.paddles[0].word = "";
    state.paddles[1].word = "";
  } else if (ball.x > FIELD_W) {
    state.status = "finished";
    state.winner = 1;
    state.paddles[0].word = "";
    state.paddles[1].word = "";
  }
}

function reflectOffPaddle(
  ball: GameState["ball"],
  paddleY: number,
  paddleH: number,
  directionX: 1 | -1,
): void {
  const hitPos = (ball.y - paddleY) / paddleH; // 0 to 1
  const angle = (hitPos - 0.5) * (Math.PI / 3); // -60° to +60°
  const currentSpeed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
  const speed = Math.min(currentSpeed + 0.2, MAX_BALL_SPEED);
  ball.vx = Math.cos(angle) * speed * directionX;
  ball.vy = Math.sin(angle) * speed;
}
