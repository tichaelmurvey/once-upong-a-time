import {
    FIELD_W,
    FIELD_H,
    PADDLE_W,
    PADDLE_X_OFFSET,
    BALL_SIZE,
    CHAR_HEIGHT,
} from "shared/constants.js";
import { getPaddleHeight } from "shared/types.js";
import type { GameState } from "shared/types.js";

const HEADER_H = 64; // logical pixels reserved above the play area (fits ~3 lines)

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let scale = 1;

let playAgainBtn: HTMLButtonElement | null = null;
let onPlayAgainClick: (() => void) | null = null;

export function initCanvas(onPlayAgain: () => void): void {
    canvas = document.getElementById("game") as HTMLCanvasElement;
    ctx = canvas.getContext("2d")!;
    onPlayAgainClick = onPlayAgain;
    resize();
    window.addEventListener("resize", resize);
}

function resize(): void {
    const maxW = window.innerWidth;
    const maxH = window.innerHeight;
    scale = Math.min(maxW / FIELD_W, maxH / (FIELD_H + HEADER_H));
    canvas.width = FIELD_W * scale;
    canvas.height = (FIELD_H + HEADER_H) * scale;
}

function s(val: number): number {
    return val * scale;
}

/** Y offset: everything in the game field is shifted down by HEADER_H */
function gy(val: number): number {
    return (val + HEADER_H) * scale;
}

/** Wrap text into lines that fit within maxWidth (in canvas pixels) */
function wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
        const test = current ? current + " " + word : word;
        if (ctx.measureText(test).width > maxWidth && current) {
            lines.push(current);
            current = word;
        } else {
            current = test;
        }
    }
    if (current) lines.push(current);
    return lines;
}

function showPlayAgainButton(): void {
    if (playAgainBtn) return;
    playAgainBtn = document.createElement("button");
    playAgainBtn.textContent = "Play Again";
    playAgainBtn.style.cssText = `
    position: fixed;
    left: 50%;
    top: calc(50% + ${s(90)}px);
    transform: translate(-50%, -50%);
    font: bold ${s(16)}px monospace;
    padding: ${s(8)}px ${s(24)}px;
    background: #fff;
    color: #000;
    border: none;
    cursor: pointer;
  `;
    playAgainBtn.addEventListener("click", () => onPlayAgainClick?.());
    document.body.appendChild(playAgainBtn);
}

function hidePlayAgainButton(): void {
    if (playAgainBtn) {
        playAgainBtn.remove();
        playAgainBtn = null;
    }
}

export function render(state: GameState | null, statusText: string | null, localPlayer: 1 | 2 = 1): void {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (statusText) {
        hidePlayAgainButton();
        ctx.fillStyle = "#fff";
        ctx.font = `${s(24)}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(statusText, canvas.width / 2, canvas.height / 2);
        return;
    }

    if (!state) return;

    // Word history in the header area (above game field)
    if (state.words.length > 0) {
        ctx.fillStyle = "#fff";
        ctx.font = `${s(14)}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const sentence = state.words.join(" ");
        const lines = wrapText(sentence, canvas.width - s(20));
        const lineH = s(18);
        const totalH = lines.length * lineH;
        const startY = (s(HEADER_H) - totalH) / 2 + lineH / 2;
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], canvas.width / 2, startY + i * lineH);
        }
    }

    // Separator line between header and game field
    ctx.strokeStyle = "#222";
    ctx.lineWidth = s(1);
    ctx.beginPath();
    ctx.moveTo(0, s(HEADER_H));
    ctx.lineTo(canvas.width, s(HEADER_H));
    ctx.stroke();

    // Center line
    ctx.setLineDash([s(8), s(8)]);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = s(2);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, s(HEADER_H));
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Paddles
    drawPaddle(state, 0, localPlayer === 1);
    drawPaddle(state, 1, localPlayer === 2);

    // Ball
    ctx.fillStyle = "#fff";
    ctx.fillRect(
        s(state.ball.x - BALL_SIZE / 2),
        gy(state.ball.y - BALL_SIZE / 2),
        s(BALL_SIZE),
        s(BALL_SIZE),
    );

    // Game over overlay
    if (state.status === "finished" && state.winner) {
        showPlayAgainButton();

        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (state.words.length > 0) {
            ctx.font = `${s(20)}px monospace`;
            const sentence = state.words.join(" ");
            const lines = wrapText(sentence, canvas.width - s(40));
            const lineH = s(26);
            const totalH = lines.length * lineH;
            const startY = canvas.height / 2 - s(50) - (totalH - lineH) / 2;
            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], canvas.width / 2, startY + i * lineH);
            }
        }

        ctx.font = `${s(36)}px monospace`;
        // ctx.fillText(
        //   `Player ${state.winner} wins!`,
        //   canvas.width / 2,
        //   canvas.height / 2,
        // );
        ctx.font = `${s(14)}px monospace`;
        ctx.fillStyle = "#aaa";
        ctx.fillText(
            "press space or click below",
            canvas.width / 2,
            canvas.height / 2 + s(40),
        );
    } else {
        hidePlayAgainButton();
    }
}

function drawPaddle(state: GameState, playerIdx: 0 | 1, isLocal: boolean): void {
    const paddle = state.paddles[playerIdx];
    const paddleH = getPaddleHeight(paddle);
    const isLeft = playerIdx === 0;
    // paddle.y is the center; compute top edge
    const paddleTop = paddle.y - paddleH / 2;

    const paddleX = isLeft
        ? PADDLE_X_OFFSET
        : FIELD_W - PADDLE_X_OFFSET - PADDLE_W;

    // Collision area (subtle background)
    if (paddleH > 0) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.fillRect(s(paddleX), gy(paddleTop), s(PADDLE_W), s(paddleH));
    }

    // Typing cursor when paddle can type
    if (paddle.canType && isLocal) {
        const cursorY = paddleTop + paddleH;
        const textX = isLeft ? paddleX + PADDLE_W + 4 : paddleX - 14;
        const blink = Math.floor(performance.now() / 500) % 2 === 0;
        ctx.fillStyle = blink ? "#fff" : "#888";
        ctx.fillRect(s(textX), gy(cursorY), s(10), s(2));
    }

    // Draw letters vertically beside the paddle
    if (paddle.word.length > 0) {
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${s(CHAR_HEIGHT - 2)}px monospace`;
        ctx.textBaseline = "top";
        ctx.textAlign = isLeft ? "left" : "right";

        const textX = isLeft
            ? paddleX + PADDLE_W + 4
            : paddleX - 4;

        for (let i = 0; i < paddle.word.length; i++) {
            ctx.fillText(
                paddle.word[i],
                s(textX),
                gy(paddleTop + i * CHAR_HEIGHT + 1),
            );
        }
    }
}
