const bcrypt = require('bcryptjs');

const { findByEmail, createUser, VALID_ROLES } = require('../models/user.model');
const { signToken, blacklistToken } = require('../utils/token.util');

function getRoles(_req, res) {
  return res.json({ roles: VALID_ROLES });
}

async function register(req, res) {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: 'email and password are required',
      availableRoles: VALID_ROLES,
    });
  }

  if (!role) {
    return res.status(400).json({
      message: 'role is required',
      availableRoles: VALID_ROLES,
    });
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({
      message: `Invalid role: "${role}"`,
      availableRoles: VALID_ROLES,
    });
  }

  const existing = findByEmail(email);
  if (existing) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = createUser({ email, passwordHash, role });

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      availableRoles: VALID_ROLES,
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const user = findByEmail(email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  try {
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

function logout(req, res) {
  const token = req.token;

  if (!token) {
    return res.status(400).json({ message: 'No token provided' });
  }

  blacklistToken(token);
  return res.json({ message: 'Logout successful' });
}

module.exports = {
  getRoles,
  register,
  login,
  logout,
};

