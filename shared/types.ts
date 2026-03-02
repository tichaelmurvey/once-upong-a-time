export type Direction = "up" | "down" | "stop";

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface Paddle {
  y: number;
}

export type GameStatus = "waiting" | "playing" | "finished";

export interface GameState {
  ball: Ball;
  paddles: [Paddle, Paddle];
  scores: [number, number];
  status: GameStatus;
  winner?: 1 | 2;
}

// --- Messages ---

export type ClientMessage = {
  type: "paddleMove";
  direction: Direction;
};

export type ServerMessage =
  | { type: "joined"; player: 1 | 2 }
  | { type: "waiting" }
  | { type: "start" }
  | { type: "state"; state: GameState }
  | { type: "gameOver"; winner: 1 | 2 }
  | { type: "opponentDisconnected" };
