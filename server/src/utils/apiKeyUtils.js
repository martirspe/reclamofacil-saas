const crypto = require('crypto');

const hashApiKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

// Generates a new API key and its hash. Store only the hash; return the plaintext once.
const generateApiKey = () => {
  const key = crypto.randomBytes(32).toString('hex'); // 64 hex chars
  const key_hash = hashApiKey(key);
  return { key, key_hash };
};

module.exports = { hashApiKey, generateApiKey };
