import type { GameState, Direction } from "../shared/types.js";
export declare function createInitialState(): GameState;
export declare function launchBall(state: GameState, towardPlayer?: 1 | 2): void;
export declare function handleTypeChar(state: GameState, playerIndex: 0 | 1, char: string): void;
export declare function handleBackspace(state: GameState, playerIndex: 0 | 1): void;
export declare function tick(state: GameState, inputs: [Direction, Direction]): void;
//# sourceMappingURL=game.d.ts.map