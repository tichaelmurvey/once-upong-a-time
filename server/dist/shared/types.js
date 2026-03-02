import { CHAR_HEIGHT } from "./constants.js";
export function getPaddleHeight(paddle) {
    if (paddle.word.length === 0)
        return 0;
    return Math.max(3, paddle.word.length) * CHAR_HEIGHT;
}
//# sourceMappingURL=types.js.map