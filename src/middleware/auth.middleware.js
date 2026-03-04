const { verifyToken, isTokenBlacklisted } = require('../utils/token.util');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization header' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Invalid authorization format' });
  }

  const token = parts[1];

  if (isTokenBlacklisted(token)) {
    return res.status(401).json({ message: 'Token has been logged out' });
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = {
  authMiddleware,
};

