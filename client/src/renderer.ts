import {
  FIELD_W,
  FIELD_H,
  PADDLE_W,
  PADDLE_H,
  PADDLE_X_OFFSET,
  BALL_SIZE,
} from "shared/constants.js";
import type { GameState } from "shared/types.js";

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let scale = 1;

export function initCanvas(): void {
  canvas = document.getElementById("game") as HTMLCanvasElement;
  ctx = canvas.getContext("2d")!;
  resize();
  window.addEventListener("resize", resize);
}

function resize(): void {
  const maxW = window.innerWidth;
  const maxH = window.innerHeight;
  scale = Math.min(maxW / FIELD_W, maxH / FIELD_H);
  canvas.width = FIELD_W * scale;
  canvas.height = FIELD_H * scale;
}

function s(val: number): number {
  return val * scale;
}

export function render(state: GameState | null, statusText: string | null): void {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (statusText) {
    ctx.fillStyle = "#fff";
    ctx.font = `${s(24)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(statusText, canvas.width / 2, canvas.height / 2);
    return;
  }

  if (!state) return;

  // Center line
  ctx.setLineDash([s(8), s(8)]);
  ctx.strokeStyle = "#333";
  ctx.lineWidth = s(2);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  // Scores
  ctx.fillStyle = "#555";
  ctx.font = `${s(48)}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(String(state.scores[0]), canvas.width / 2 - s(60), s(20));
  ctx.fillText(String(state.scores[1]), canvas.width / 2 + s(60), s(20));

  // Paddles
  ctx.fillStyle = "#fff";
  ctx.fillRect(
    s(PADDLE_X_OFFSET),
    s(state.paddles[0].y),
    s(PADDLE_W),
    s(PADDLE_H),
  );
  ctx.fillRect(
    s(FIELD_W - PADDLE_X_OFFSET - PADDLE_W),
    s(state.paddles[1].y),
    s(PADDLE_W),
    s(PADDLE_H),
  );

  // Ball
  ctx.fillRect(
    s(state.ball.x - BALL_SIZE / 2),
    s(state.ball.y - BALL_SIZE / 2),
    s(BALL_SIZE),
    s(BALL_SIZE),
  );

  // Winner overlay
  if (state.status === "finished" && state.winner) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = `${s(36)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `Player ${state.winner} wins!`,
      canvas.width / 2,
      canvas.height / 2,
    );
    ctx.font = `${s(18)}px monospace`;
    ctx.fillText(
      "Refresh to play again",
      canvas.width / 2,
      canvas.height / 2 + s(50),
    );
  }
}
