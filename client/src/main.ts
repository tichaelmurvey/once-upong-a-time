import type { GameState } from "shared/types.js";
import { initCanvas, render } from "./renderer.js";
import { setupInput } from "./input.js";
import { connect, sendPaddleMove } from "./network.js";

let gameState: GameState | null = null;
let statusText: string | null = "Connecting...";
let playerNumber: 1 | 2 = 1;

initCanvas();

const ws = connect(
  (msg) => {
    switch (msg.type) {
      case "joined":
        playerNumber = msg.player;
        statusText = `You are Player ${playerNumber}`;
        break;
      case "waiting":
        statusText = "Waiting for opponent...";
        break;
      case "start":
        statusText = null;
        break;
      case "state":
        gameState = msg.state;
        break;
      case "gameOver":
        // State already has winner info from the last state update
        break;
      case "opponentDisconnected":
        statusText = "Opponent disconnected. Refresh to play again.";
        gameState = null;
        break;
    }
  },
  () => {
    statusText = "Connection lost. Refresh to reconnect.";
    gameState = null;
  },
);

setupInput((direction) => {
  sendPaddleMove(ws, direction);
});

function loop(): void {
  render(gameState, statusText);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
