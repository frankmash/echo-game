const { POWERUP_TYPES, ROUND_THEMES, MAX_ROUNDS } = require('./constants');
const rooms = new Map();

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function makePlayer(name, socketId = null) {
  return {
    name,
    socketId,
    score: 0,
    streak: 0,
    powerups: {
      skip: 1,
      challenge: 1,
      double: 1,
    },
    doubleActive: false,
    skipped: false,
  };
}

function createRoom(hostName, socketId) {
  let code;
  do { code = generateCode(); } while (rooms.has(code));

  const room = {
    code,
    host: hostName,
    players: [makePlayer(hostName, socketId)],
    gameStarted: false,
    gameOver: false,
    chain: [],
    currentTurnIndex: 0,
    round: 1,
    maxRounds: MAX_ROUNDS,
    themes: [...ROUND_THEMES].sort(() => Math.random() - 0.5), // shuffle each game
    currentTheme: null,
    votingActive: false,
    pendingWord: null,
    pendingExplanation: null,
    pendingPlayer: null,
    votes: {},
    challenged: false,
    turnTimer: null,
    voteTimer: null,
  };

  rooms.set(code, room);
  return room;
}

function joinRoom(code, playerName, socketId) {
  const room = rooms.get(code);
  if (!room) return { error: 'Room not found' };
  if (room.gameStarted) return { error: 'Game already started' };
  if (room.players.find(p => p.name === playerName)) return { error: 'Name already taken' };

  room.players.push(makePlayer(playerName, socketId));
  return { room };
}

function getRoom(code) { return rooms.get(code) || null; }
function deleteRoom(code) { rooms.delete(code); }

function setSocketId(code, playerName, socketId) {
  const room = rooms.get(code);
  if (!room) return;
  const p = room.players.find(p => p.name === playerName);
  if (p) p.socketId = socketId;
}

function removePlayerBySocket(socketId) {
  for (const [code, room] of rooms.entries()) {
    const idx = room.players.findIndex(p => p.socketId === socketId);
    if (idx !== -1) {
      const [removed] = room.players.splice(idx, 1);
      if (room.players.length === 0) {
        rooms.delete(code);
      } else if (removed.name === room.host) {
        room.host = room.players[0].name;
      }
      // Adjust turn index
      if (room.currentTurnIndex >= room.players.length) {
        room.currentTurnIndex = 0;
      }
      return { code, room, removedPlayer: removed.name };
    }
  }
  return null;
}

module.exports = { createRoom, joinRoom, getRoom, deleteRoom, setSocketId, removePlayerBySocket };
