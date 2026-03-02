import type { Direction } from "shared/types.js";

type DirectionCallback = (direction: Direction) => void;
type TypeCallback = (char: string) => void;
type ActionCallback = () => void;

export function setupInput(
    onDirectionChange: DirectionCallback,
    onType: TypeCallback,
    onBackspace: ActionCallback,
    onPlayAgain: ActionCallback,
): void {
    const keys = new Set<string>();
    let currentDirection: Direction = "stop";

    function update(): void {
        let newDirection: Direction = "stop";
        const up = keys.has("ArrowUp");
        const down = keys.has("ArrowDown");

        if (up && !down) newDirection = "up";
        else if (down && !up) newDirection = "down";

        if (newDirection !== currentDirection) {
            currentDirection = newDirection;
            onDirectionChange(currentDirection);
        }
    }

    window.addEventListener("keydown", (e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            keys.add(e.key);
            update();
            return;
        }

        if (e.key === "Backspace") {
            e.preventDefault();
            onBackspace();
            return;
        }

        if (e.key === " ") {
            e.preventDefault();
            onPlayAgain();
            return;
        }

        // Letter keys + punctuation for typing (no repeats from held keys)
        if (e.key.length === 1 && /^[a-zA-Z.?!]$/.test(e.key) && !e.repeat) {
            e.preventDefault();
            onType(e.key.toLowerCase());
        }
    });

    window.addEventListener("keyup", (e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            keys.delete(e.key);
            update();
        }
    });
}
