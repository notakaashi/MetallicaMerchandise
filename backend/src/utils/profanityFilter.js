const BANNED_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole',
  'putangina', 'tangina', 'puta', 'gago', 'bobo', 'ulol', 'tarantado', 'gunggong',
];

const pattern = new RegExp('\\b(' + BANNED_WORDS.join('|') + ')\\b', 'gi');

function censor(text) {
  if (!text) return text;
  return text.replace(pattern, (match) => '*'.repeat(match.length));
}

module.exports = { censor, BANNED_WORDS };
