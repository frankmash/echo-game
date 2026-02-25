const rooms = new Map();

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createRoom(hostName) {
  let code;
  do { code = generateCode(); } while (rooms.has(code));

  const room = {
    code,
    host: hostName,
    players: [{ name: hostName, score: 0, socketId: null }],
    gameStarted: false,
    gameOver: false,
    chain: [],
    currentTurnIndex: 0,
    round: 1,
    maxRounds: 3,
    votingActive: false,
    pendingWord: null,
    pendingExplanation: null,
    pendingPlayer: null,
    votes: {},
    voteTimer: null,
  };

  rooms.set(code, room);
  return room;
}

function joinRoom(code, playerName) {
  const room = rooms.get(code);
  if (!room) return { error: 'Room not found' };
  if (room.gameStarted) return { error: 'Game already started' };
  if (room.players.find(p => p.name === playerName)) return { error: 'Name already taken' };

  room.players.push({ name: playerName, score: 0, socketId: null });
  return { room };
}

function getRoom(code) {
  return rooms.get(code) || null;
}

function deleteRoom(code) {
  rooms.delete(code);
}

function setSocketId(code, playerName, socketId) {
  const room = rooms.get(code);
  if (!room) return;
  const player = room.players.find(p => p.name === playerName);
  if (player) player.socketId = socketId;
}

function removePlayerBySocket(socketId) {
  for (const [code, room] of rooms.entries()) {
    const idx = room.players.findIndex(p => p.socketId === socketId);
    if (idx !== -1) {
      const [removed] = room.players.splice(idx, 1);
      if (room.players.length === 0) {
        rooms.delete(code);
      } else if (removed.name === room.host && room.players.length > 0) {
        room.host = room.players[0].name;
      }
      return { code, room, removedPlayer: removed.name };
    }
  }
  return null;
}

module.exports = { createRoom, joinRoom, getRoom, deleteRoom, setSocketId, removePlayerBySocket };
