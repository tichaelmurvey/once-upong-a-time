import type { GameState } from "shared/types.js";
import { initCanvas, render } from "./renderer.js";
import { setupInput } from "./input.js";
import { connect, sendPaddleMove, sendTypeChar, sendBackspace, sendPlayAgain } from "./network.js";

let gameState: GameState | null = null;
let statusText: string | null = "Connecting...";
let playerNumber: 1 | 2 = 1;
let ws: WebSocket;

function requestPlayAgain(): void {
  sendPlayAgain(ws);
}

initCanvas(requestPlayAgain);

ws = connect(
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

setupInput(
  (direction) => sendPaddleMove(ws, direction),
  (char) => sendTypeChar(ws, char),
  () => sendBackspace(ws),
  () => requestPlayAgain(),
);

function loop(): void {
  render(gameState, statusText, playerNumber);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
