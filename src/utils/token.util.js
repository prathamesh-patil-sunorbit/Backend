const jwt = require('jsonwebtoken');

// For demo purposes this is hardcoded.
// In a real project, load from environment variables.
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_real_app';

// Simple in-memory blacklist for logged-out tokens
const tokenBlacklist = new Set();

function signToken(payload, options = {}) {
  const defaultOptions = { expiresIn: '1h' };
  return jwt.sign(payload, JWT_SECRET, { ...defaultOptions, ...options });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function blacklistToken(token) {
  tokenBlacklist.add(token);
}

function isTokenBlacklisted(token) {
  return tokenBlacklist.has(token);
}

module.exports = {
  signToken,
  verifyToken,
  blacklistToken,
  isTokenBlacklisted,
};

