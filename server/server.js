const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { createRoom, joinRoom, getRoom, setSocketId, removePlayerBySocket } = require('./game/roomManager');
const { startGame, submitWord, castVote, resolveVote, usePowerup, skipPlayer, getPublicState } = require('./game/gameLogic');
const { TURN_TIMEOUT_MS, VOTE_TIMEOUT_MS } = require('./game/constants');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

// Track pending timers per room
const timers = new Map(); // code -> { turn, vote }

function clearTimers(code) {
  const t = timers.get(code);
  if (t) {
    clearTimeout(t.turn);
    clearTimeout(t.vote);
    timers.delete(code);
  }
}

function startTurnTimer(code) {
  clearTimers(code);
  const handle = setTimeout(() => {
    const room = getRoom(code);
    if (!room || room.votingActive || room.gameOver) return;
    const current = room.players[room.currentTurnIndex];
    console.log(`[timeout] Skipping ${current?.name} in ${code}`);
    skipPlayer(room);
    io.to(code).emit('player_skipped', { player: current?.name, room: getPublicState(room) });
    if (room.gameOver) {
      io.to(code).emit('game_over', getPublicState(room));
    } else {
      startTurnTimer(code);
    }
  }, TURN_TIMEOUT_MS);
  timers.set(code, { ...(timers.get(code) || {}), turn: handle });
}

function startVoteTimer(code, word) {
  clearTimers(code);
  const handle = setTimeout(() => {
    const room = getRoom(code);
    if (!room || !room.votingActive || room.pendingWord !== word) return;
    console.log(`[timeout] Force-resolving vote in ${code}`);
    const resolved = resolveVote(room);
    if (resolved) {
      io.to(code).emit('vote_resolved', { result: resolved, room: getPublicState(room) });
      if (room.gameOver) {
        io.to(code).emit('game_over', getPublicState(room));
      } else {
        startTurnTimer(code);
      }
    }
  }, VOTE_TIMEOUT_MS);
  timers.set(code, { ...(timers.get(code) || {}), vote: handle });
}

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id}`);

  socket.on('create_room', ({ playerName }, cb) => {
    if (!playerName) return cb({ error: 'Name required' });
    const room = createRoom(playerName, socket.id);
    socket.join(room.code);
    cb({ ok: true, room: getPublicState(room) });
  });

  socket.on('join_room', ({ code, playerName }, cb) => {
    if (!code || !playerName) return cb({ error: 'Code and name required' });
    const result = joinRoom(code.toUpperCase(), playerName, socket.id);
    if (result.error) return cb({ error: result.error });
    socket.join(code.toUpperCase());
    io.to(code.toUpperCase()).emit('room_updated', getPublicState(result.room));
    cb({ ok: true, room: getPublicState(result.room) });
  });

  socket.on('start_game', ({ code, playerName }, cb) => {
    const room = getRoom(code);
    if (!room) return cb({ error: 'Room not found' });
    if (room.host !== playerName) return cb({ error: 'Only host can start' });
    if (room.players.length < 2) return cb({ error: 'Need at least 2 players' });
    startGame(room);
    io.to(code).emit('game_started', getPublicState(room));
    startTurnTimer(code);
    cb({ ok: true });
  });

  socket.on('submit_word', ({ code, playerName, word, explanation }, cb) => {
    const room = getRoom(code);
    if (!room) return cb({ error: 'Room not found' });
    const result = submitWord(room, playerName, word, explanation);
    if (result.error) return cb({ error: result.error });
    clearTimers(code);
    io.to(code).emit('voting_started', getPublicState(room));
    startVoteTimer(code, word.trim().toLowerCase());
    cb({ ok: true });
  });

  socket.on('cast_vote', ({ code, playerName, vote }, cb) => {
    const room = getRoom(code);
    if (!room) return cb({ error: 'Room not found' });
    const result = castVote(room, playerName, vote);
    if (result.error) return cb({ error: result.error });
    io.to(code).emit('vote_updated', getPublicState(room));
    if (result.allVoted) {
      clearTimers(code);
      const resolved = resolveVote(room);
      if (resolved) {
        io.to(code).emit('vote_resolved', { result: resolved, room: getPublicState(room) });
        if (room.gameOver) {
          io.to(code).emit('game_over', getPublicState(room));
        } else {
          startTurnTimer(code);
        }
      }
    }
    cb({ ok: true });
  });

  socket.on('use_powerup', ({ code, playerName, powerupId }, cb) => {
    const room = getRoom(code);
    if (!room) return cb({ error: 'Room not found' });
    const result = usePowerup(room, playerName, powerupId);
    if (result.error) return cb({ error: result.error });

    if (result.action === 'skipped') {
      clearTimers(code);
      io.to(code).emit('powerup_used', { playerName, powerupId, room: getPublicState(room) });
      if (room.gameOver) {
        io.to(code).emit('game_over', getPublicState(room));
      } else {
        startTurnTimer(code);
      }
    } else if (result.action === 'challenged') {
      // Re-broadcast voting state with reset votes
      io.to(code).emit('vote_challenged', { playerName, room: getPublicState(room) });
      startVoteTimer(code, room.pendingWord);
    } else {
      io.to(code).emit('powerup_used', { playerName, powerupId, room: getPublicState(room) });
    }
    cb({ ok: true });
  });

  socket.on('end_game', ({ code, playerName }, cb) => {
    const room = getRoom(code);
    if (!room) return cb({ error: 'Room not found' });
    if (room.host !== playerName) return cb({ error: 'Only host can end' });
    clearTimers(code);
    room.gameOver = true;
    io.to(code).emit('game_over', getPublicState(room));
    cb({ ok: true });
  });

  socket.on('play_again', ({ code, playerName }, cb) => {
    const room = getRoom(code);
    if (!room) return cb({ error: 'Room not found' });
    if (room.host !== playerName) return cb({ error: 'Only host can restart' });
    startGame(room);
    io.to(code).emit('game_started', getPublicState(room));
    startTurnTimer(code);
    cb({ ok: true });
  });

  socket.on('disconnect', () => {
    const info = removePlayerBySocket(socket.id);
    if (info && info.room.players.length > 0) {
      io.to(info.code).emit('room_updated', getPublicState(info.room));
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Echo server → http://localhost:${PORT}`));
