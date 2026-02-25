const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { createRoom, joinRoom, getRoom, setSocketId, removePlayerBySocket } = require('./game/roomManager');
const { startGame, submitWord, castVote, resolveVote, getPublicState } = require('./game/gameLogic');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const VOTE_TIMEOUT_MS = 10000; // auto-resolve after 10s

io.on('connection', (socket) => {
  console.log(`[+] Socket connected: ${socket.id}`);

  // --- CREATE ROOM ---
  socket.on('create_room', ({ playerName }, cb) => {
    if (!playerName) return cb({ error: 'Name required' });
    const room = createRoom(playerName);
    setSocketId(room.code, playerName, socket.id);
    socket.join(room.code);
    console.log(`Room created: ${room.code} by ${playerName}`);
    cb({ ok: true, room: getPublicState(room) });
  });

  // --- JOIN ROOM ---
  socket.on('join_room', ({ code, playerName }, cb) => {
    if (!code || !playerName) return cb({ error: 'Code and name required' });
    const result = joinRoom(code.toUpperCase(), playerName);
    if (result.error) return cb({ error: result.error });

    setSocketId(code.toUpperCase(), playerName, socket.id);
    socket.join(code.toUpperCase());

    // Notify others
    io.to(code.toUpperCase()).emit('room_updated', getPublicState(result.room));
    console.log(`${playerName} joined room ${code.toUpperCase()}`);
    cb({ ok: true, room: getPublicState(result.room) });
  });

  // --- START GAME ---
  socket.on('start_game', ({ code, playerName }, cb) => {
    const room = getRoom(code);
    if (!room) return cb({ error: 'Room not found' });
    if (room.host !== playerName) return cb({ error: 'Only host can start' });
    if (room.players.length < 2) return cb({ error: 'Need at least 2 players' });

    startGame(room);
    io.to(code).emit('game_started', getPublicState(room));
    cb({ ok: true });
  });

  // --- SUBMIT WORD ---
  socket.on('submit_word', ({ code, playerName, word, explanation }, cb) => {
    const room = getRoom(code);
    if (!room) return cb({ error: 'Room not found' });

    const result = submitWord(room, playerName, word, explanation);
    if (result.error) return cb({ error: result.error });

    io.to(code).emit('voting_started', getPublicState(room));
    cb({ ok: true });

    // Auto-resolve timer
    const timer = setTimeout(() => {
      const r = getRoom(code);
      if (r && r.votingActive && r.pendingWord === word) {
        const resolved = resolveVote(r);
        if (resolved) {
          io.to(code).emit('vote_resolved', { result: resolved, room: getPublicState(r) });
          if (r.gameOver) io.to(code).emit('game_over', getPublicState(r));
        }
      }
    }, VOTE_TIMEOUT_MS);

    room.voteTimer = timer;
  });

  // --- CAST VOTE ---
  socket.on('cast_vote', ({ code, playerName, vote }, cb) => {
    const room = getRoom(code);
    if (!room) return cb({ error: 'Room not found' });

    const result = castVote(room, playerName, vote);
    if (result.error) return cb({ error: result.error });

    io.to(code).emit('vote_updated', getPublicState(room));

    if (result.allVoted) {
      if (room.voteTimer) clearTimeout(room.voteTimer);
      const resolved = resolveVote(room);
      if (resolved) {
        io.to(code).emit('vote_resolved', { result: resolved, room: getPublicState(room) });
        if (room.gameOver) io.to(code).emit('game_over', getPublicState(room));
      }
    }

    cb({ ok: true });
  });

  // --- END GAME (manual) ---
  socket.on('end_game', ({ code, playerName }, cb) => {
    const room = getRoom(code);
    if (!room) return cb({ error: 'Room not found' });
    if (room.host !== playerName) return cb({ error: 'Only host can end the game' });
    room.gameOver = true;
    io.to(code).emit('game_over', getPublicState(room));
    cb({ ok: true });
  });

  // --- PLAY AGAIN ---
  socket.on('play_again', ({ code, playerName }, cb) => {
    const room = getRoom(code);
    if (!room) return cb({ error: 'Room not found' });
    if (room.host !== playerName) return cb({ error: 'Only host can restart' });
    startGame(room);
    io.to(code).emit('game_started', getPublicState(room));
    cb({ ok: true });
  });

  // --- DISCONNECT ---
  socket.on('disconnect', () => {
    const info = removePlayerBySocket(socket.id);
    if (info) {
      console.log(`[-] ${info.removedPlayer} left room ${info.code}`);
      if (info.room.players.length > 0) {
        io.to(info.code).emit('room_updated', getPublicState(info.room));
      }
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});