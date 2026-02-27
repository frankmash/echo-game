const MAX_ROUNDS = 7;
const TURN_TIMEOUT_MS = 15000;
const VOTE_TIMEOUT_MS = 12000;
const STREAK_THRESHOLD = 3;
const STREAK_BONUS = 1;

const ROUND_THEMES = [
  { name: 'Nature',     emoji: '🌿', hint: 'Think forests, oceans, weather, animals' },
  { name: 'Emotions',   emoji: '💭', hint: 'Feelings, moods, states of mind' },
  { name: 'Technology', emoji: '⚡', hint: 'Gadgets, software, the digital world' },
  { name: 'Food',       emoji: '🍜', hint: 'Ingredients, dishes, flavors, cooking' },
  { name: 'Cities',     emoji: '🌆', hint: 'Urban life, architecture, movement' },
  { name: 'Wild Card',  emoji: '🃏', hint: 'Anything goes — be creative' },
  { name: 'Mythology',  emoji: '⚔️',  hint: 'Legends, gods, folklore, epic tales' },
];

const POWERUP_TYPES = {
  SKIP:      { id: 'skip',      label: 'Skip',       emoji: '⏭', desc: 'Skip your turn without penalty' },
  CHALLENGE: { id: 'challenge', label: 'Challenge',  emoji: '⚠️', desc: 'Force an immediate re-vote on the pending word' },
  DOUBLE:    { id: 'double',    label: '2x Points',  emoji: '✦', desc: 'Your next accepted word earns double points' },
};

module.exports = { MAX_ROUNDS, TURN_TIMEOUT_MS, VOTE_TIMEOUT_MS, STREAK_THRESHOLD, STREAK_BONUS, ROUND_THEMES, POWERUP_TYPES };
