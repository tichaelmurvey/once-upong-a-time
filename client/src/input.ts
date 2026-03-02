import type { Direction } from "shared/types.js";

type InputCallback = (direction: Direction) => void;

export function setupInput(onDirectionChange: InputCallback): void {
  const keys = new Set<string>();
  let currentDirection: Direction = "stop";

  function update(): void {
    let newDirection: Direction = "stop";
    const up = keys.has("ArrowUp") || keys.has("w");
    const down = keys.has("ArrowDown") || keys.has("s");

    if (up && !down) newDirection = "up";
    else if (down && !up) newDirection = "down";

    if (newDirection !== currentDirection) {
      currentDirection = newDirection;
      onDirectionChange(currentDirection);
    }
  }

  window.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "w", "s"].includes(e.key)) {
      e.preventDefault();
      keys.add(e.key);
      update();
    }
  });

  window.addEventListener("keyup", (e) => {
    keys.delete(e.key);
    update();
  });
}
