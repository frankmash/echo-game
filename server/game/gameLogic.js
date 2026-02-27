const { STREAK_THRESHOLD, STREAK_BONUS } = require('./constants');

function startGame(room) {
  room.gameStarted = true;
  room.gameOver = false;
  room.chain = [];
  room.currentTurnIndex = 0;
  room.round = 1;
  room.votingActive = false;
  room.pendingWord = null;
  room.pendingExplanation = null;
  room.pendingPlayer = null;
  room.votes = {};
  room.challenged = false;
  room.currentTheme = room.themes[0] || null;
  room.players = room.players.map(p => ({
    ...p,
    score: 0,
    streak: 0,
    powerups: { skip: 1, challenge: 1, double: 1 },
    doubleActive: false,
    skipped: false,
  }));
}

function submitWord(room, playerName, word, explanation) {
  const current = room.players[room.currentTurnIndex];
  if (!current || current.name !== playerName) return { error: 'Not your turn' };
  if (room.votingActive) return { error: 'Voting in progress' };
  const w = word.trim().toLowerCase();
  if (!w) return { error: 'Empty word' };
  if (room.chain.find(e => e.word === w)) return { error: 'Word already in chain' };

  room.votingActive = true;
  room.pendingWord = w;
  room.pendingExplanation = explanation || null;
  room.pendingPlayer = playerName;
  room.votes = {};
  room.challenged = false;

  return { ok: true };
}

function usePowerup(room, playerName, powerupId) {
  const player = room.players.find(p => p.name === playerName);
  if (!player) return { error: 'Player not found' };
  if (!player.powerups[powerupId] || player.powerups[powerupId] < 1) return { error: 'No uses left' };

  if (powerupId === 'skip') {
    const current = room.players[room.currentTurnIndex];
    if (!current || current.name !== playerName) return { error: 'Not your turn' };
    if (room.votingActive) return { error: 'Cannot skip during voting' };
    player.powerups.skip = 0;
    player.skipped = true;
    advanceTurn(room);
    return { ok: true, action: 'skipped' };
  }

  if (powerupId === 'challenge') {
    if (!room.votingActive) return { error: 'No vote to challenge' };
    if (room.challenged) return { error: 'Already challenged' };
    player.powerups.challenge = 0;
    room.challenged = true;
    room.votes = {}; // reset votes
    return { ok: true, action: 'challenged' };
  }

  if (powerupId === 'double') {
    player.powerups.double = 0;
    player.doubleActive = true;
    return { ok: true, action: 'double_armed' };
  }

  return { error: 'Unknown powerup' };
}

function castVote(room, playerName, vote) {
  if (!room.votingActive) return { error: 'No vote in progress' };
  if (room.votes[playerName]) return { error: 'Already voted' };
  if (!['yes', 'no'].includes(vote)) return { error: 'Invalid vote' };

  room.votes[playerName] = vote;
  const allVoted = Object.keys(room.votes).length >= room.players.length;
  return { ok: true, allVoted };
}

// Unanimous to reject: accepted unless EVERYONE votes no
function resolveVote(room) {
  if (!room.votingActive) return null;

  const total = room.players.length;
  const no = Object.values(room.votes).filter(v => v === 'no').length;
  const yes = Object.values(room.votes).filter(v => v === 'yes').length;
  const accepted = no < total; // rejected only if unanimous no

  const submitter = room.players.find(p => p.name === room.pendingPlayer);
  let pointsEarned = 0;
  let streakBonus = 0;

  if (accepted && submitter) {
    const multiplier = submitter.doubleActive ? 2 : 1;
    pointsEarned = 1 * multiplier;
    submitter.doubleActive = false;
    submitter.score += pointsEarned;

    // Streak tracking
    submitter.streak = (submitter.streak || 0) + 1;
    if (submitter.streak > 0 && submitter.streak % STREAK_THRESHOLD === 0) {
      streakBonus = STREAK_BONUS;
      submitter.score += streakBonus;
    }
  } else if (submitter) {
    submitter.streak = 0;
    submitter.doubleActive = false;
  }

  const entry = {
    word: room.pendingWord,
    player: room.pendingPlayer,
    explanation: room.pendingExplanation,
    status: accepted ? 'accepted' : 'rejected',
    yesVotes: yes,
    noVotes: no,
    pointsEarned,
    streakBonus,
  };

  room.chain.push(entry);

  advanceTurn(room);

  room.votingActive = false;
  room.pendingWord = null;
  room.pendingExplanation = null;
  room.pendingPlayer = null;
  room.votes = {};
  room.challenged = false;

  return { entry, accepted, pointsEarned, streakBonus, gameOver: room.gameOver };
}

function advanceTurn(room) {
  room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
  if (room.currentTurnIndex === 0) {
    room.round += 1;
    room.currentTheme = room.themes[Math.min(room.round - 1, room.themes.length - 1)];
    if (room.round > room.maxRounds) {
      room.gameOver = true;
    }
  }
}

function skipPlayer(room) {
  // Called by server timeout — advance without scoring
  if (room.votingActive) return; // don't skip mid-vote
  advanceTurn(room);
}

function getPublicState(room) {
  return {
    code: room.code,
    host: room.host,
    players: room.players.map(p => ({
      name: p.name,
      score: p.score,
      streak: p.streak,
      powerups: p.powerups,
      doubleActive: p.doubleActive,
    })),
    gameStarted: room.gameStarted,
    gameOver: room.gameOver,
    chain: room.chain,
    currentTurnIndex: room.currentTurnIndex,
    round: room.round,
    maxRounds: room.maxRounds,
    currentTheme: room.currentTheme,
    votingActive: room.votingActive,
    pendingWord: room.pendingWord,
    pendingExplanation: room.pendingExplanation,
    pendingPlayer: room.pendingPlayer,
    votes: room.votes,
    challenged: room.challenged,
  };
}

module.exports = { startGame, submitWord, castVote, resolveVote, usePowerup, skipPlayer, getPublicState };
