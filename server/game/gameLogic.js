function startGame(room) {
  room.gameStarted = true;
  room.chain = [];
  room.currentTurnIndex = 0;
  room.round = 1;
  room.gameOver = false;
  room.votingActive = false;
  room.pendingWord = null;
  room.votes = {};
  room.players = room.players.map(p => ({ ...p, score: 0 }));
}

function submitWord(room, playerName, word, explanation) {
  const currentPlayer = room.players[room.currentTurnIndex];
  if (!currentPlayer || currentPlayer.name !== playerName) {
    return { error: 'Not your turn' };
  }
  if (room.votingActive) {
    return { error: 'Voting already in progress' };
  }
  const normalized = word.trim().toLowerCase();
  if (!normalized) return { error: 'Empty word' };
  if (room.chain.find(e => e.word === normalized)) {
    return { error: 'Word already used in chain' };
  }

  room.votingActive = true;
  room.pendingWord = normalized;
  room.pendingExplanation = explanation || null;
  room.pendingPlayer = playerName;
  room.votes = {};

  return { ok: true };
}

function castVote(room, playerName, vote) {
  if (!room.votingActive) return { error: 'No vote in progress' };
  if (room.votes[playerName]) return { error: 'Already voted' };
  if (!['yes', 'no'].includes(vote)) return { error: 'Invalid vote' };

  room.votes[playerName] = vote;

  const totalVotes = Object.keys(room.votes).length;
  const allVoted = totalVotes >= room.players.length;

  return { ok: true, allVoted };
}

function resolveVote(room) {
  if (!room.votingActive) return null;

  const yes = Object.values(room.votes).filter(v => v === 'yes').length;
  const no = Object.values(room.votes).filter(v => v === 'no').length;
  const accepted = yes >= no; // ties go to yes

  const entry = {
    word: room.pendingWord,
    player: room.pendingPlayer,
    explanation: room.pendingExplanation,
    status: accepted ? 'accepted' : 'rejected',
    yesVotes: yes,
    noVotes: no,
  };

  room.chain.push(entry);

  if (accepted) {
    const player = room.players.find(p => p.name === room.pendingPlayer);
    if (player) player.score += 1;
  }

  // Advance turn
  room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;

  // Check round end
  if (room.currentTurnIndex === 0) {
    room.round += 1;
    if (room.round > room.maxRounds) {
      room.gameOver = true;
    }
  }

  room.votingActive = false;
  room.pendingWord = null;
  room.pendingExplanation = null;
  room.pendingPlayer = null;
  room.votes = {};

  return { entry, accepted, gameOver: room.gameOver };
}

function getPublicState(room) {
  return {
    code: room.code,
    host: room.host,
    players: room.players.map(p => ({ name: p.name, score: p.score })),
    gameStarted: room.gameStarted,
    gameOver: room.gameOver,
    chain: room.chain,
    currentTurnIndex: room.currentTurnIndex,
    round: room.round,
    maxRounds: room.maxRounds,
    votingActive: room.votingActive,
    pendingWord: room.pendingWord,
    pendingExplanation: room.pendingExplanation,
    pendingPlayer: room.pendingPlayer,
    votes: room.votes,
  };
}

module.exports = { startGame, submitWord, castVote, resolveVote, getPublicState };
