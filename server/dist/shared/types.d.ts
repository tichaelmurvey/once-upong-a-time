export type Direction = "up" | "down" | "stop";
export interface Ball {
    x: number;
    y: number;
    vx: number;
    vy: number;
}
export interface Paddle {
    y: number;
    word: string;
    canType: boolean;
}
export declare function getPaddleHeight(paddle: Paddle): number;
export type GameStatus = "waiting" | "playing" | "finished";
export interface GameState {
    ball: Ball;
    paddles: [Paddle, Paddle];
    words: string[];
    status: GameStatus;
    winner?: 1 | 2;
}
export type ClientMessage = {
    type: "paddleMove";
    direction: Direction;
} | {
    type: "typeChar";
    char: string;
} | {
    type: "backspace";
} | {
    type: "playAgain";
};
export type ServerMessage = {
    type: "joined";
    player: 1 | 2;
} | {
    type: "waiting";
} | {
    type: "start";
} | {
    type: "state";
    state: GameState;
} | {
    type: "gameOver";
    winner: 1 | 2;
} | {
    type: "opponentDisconnected";
};
//# sourceMappingURL=types.d.ts.map