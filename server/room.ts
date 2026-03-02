import { WebSocket } from "ws";
import { TICK_INTERVAL } from "../shared/constants.js";
import type { ClientMessage, Direction, ServerMessage } from "../shared/types.js";
import { createInitialState, handleBackspace, handleTypeChar, launchBall, tick } from "./game.js";
import type { GameState } from "../shared/types.js";

interface Room {
  id: string;
  players: [WebSocket, WebSocket | null];
  state: GameState;
  inputs: [Direction, Direction];
  interval: ReturnType<typeof setInterval> | null;
}

const rooms: Map<string, Room> = new Map();
let nextRoomId = 1;

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcast(room: Room, msg: ServerMessage): void {
  for (const player of room.players) {
    if (player) send(player, msg);
  }
}

function findWaitingRoom(): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players[1] === null) return room;
  }
  return undefined;
}

function startGame(room: Room): void {
  room.state.status = "playing";
  launchBall(room.state);
  broadcast(room, { type: "start" });

  room.interval = setInterval(() => {
    tick(room.state, room.inputs);
    broadcast(room, { type: "state", state: room.state });

    if (room.state.status === "finished") {
      broadcast(room, { type: "gameOver", winner: room.state.winner! });
      if (room.interval) {
        clearInterval(room.interval);
        room.interval = null;
      }
    }
  }, TICK_INTERVAL);
}

function destroyRoom(room: Room): void {
  if (room.interval) {
    clearInterval(room.interval);
    room.interval = null;
  }
  rooms.delete(room.id);
}

function getPlayerIndex(room: Room, ws: WebSocket): 0 | 1 | -1 {
  if (room.players[0] === ws) return 0;
  if (room.players[1] === ws) return 1;
  return -1;
}

export function handleConnection(ws: WebSocket): void {
  let currentRoom: Room | undefined;

  // Try to join an existing waiting room
  const waitingRoom = findWaitingRoom();

  if (waitingRoom) {
    currentRoom = waitingRoom;
    currentRoom.players[1] = ws;
    send(ws, { type: "joined", player: 2 });
    startGame(currentRoom);
  } else {
    // Create a new room
    const id = String(nextRoomId++);
    currentRoom = {
      id,
      players: [ws, null],
      state: createInitialState(),
      inputs: ["stop", "stop"],
      interval: null,
    };
    rooms.set(id, currentRoom);
    send(ws, { type: "joined", player: 1 });
    send(ws, { type: "waiting" });
  }

  ws.on("message", (data) => {
    if (!currentRoom) return;
    try {
      const msg: ClientMessage = JSON.parse(String(data));
      if (msg.type === "paddleMove") {
        const idx = getPlayerIndex(currentRoom, ws);
        if (idx !== -1) {
          currentRoom.inputs[idx] = msg.direction;
        }
      } else if (msg.type === "typeChar") {
        const idx = getPlayerIndex(currentRoom, ws);
        if (idx !== -1) {
          handleTypeChar(currentRoom.state, idx as 0 | 1, msg.char);
        }
      } else if (msg.type === "backspace") {
        const idx = getPlayerIndex(currentRoom, ws);
        if (idx !== -1) {
          handleBackspace(currentRoom.state, idx as 0 | 1);
        }
      } else if (msg.type === "playAgain") {
        if (currentRoom.state.status === "finished" && !currentRoom.interval && currentRoom.players[0] && currentRoom.players[1]) {
          currentRoom.state = createInitialState();
          currentRoom.inputs = ["stop", "stop"];
          rooms.set(currentRoom.id, currentRoom);
          startGame(currentRoom);
        }
      }
    } catch {
      // Ignore malformed messages
    }
  });

  ws.on("close", () => {
    if (!currentRoom) return;
    const idx = getPlayerIndex(currentRoom, ws);
    if (idx === -1) return;

    // Notify the other player
    const otherIdx = idx === 0 ? 1 : 0;
    const other = currentRoom.players[otherIdx];
    if (other) {
      send(other, { type: "opponentDisconnected" });
    }

    destroyRoom(currentRoom);
    currentRoom = undefined;
  });
}
