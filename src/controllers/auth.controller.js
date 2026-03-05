const bcrypt = require('bcryptjs');

const { findByEmail, createUser, getAllUsers, updateUserRole, deleteUser, VALID_ROLES } = require('../models/user.model');
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

  try {
    const existing = await findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ email, passwordHash, role });

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.userId,
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

  try {
    const user = await findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken({ id: user.userId, email: user.email, role: user.role });

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.userId,
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

// GET /auth/users — list all users (Admin only)
async function getUsers(_req, res) {
  try {
    const users = await getAllUsers();
    return res.json({ users });
  } catch (err) {
    console.error('Get users error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// PATCH /auth/users/:userId — update role
async function patchUser(req, res) {
  const { userId } = req.params;
  const { role } = req.body;

  if (!role || !VALID_ROLES.includes(role)) {
    return res.status(400).json({ message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
  }

  try {
    const user = await updateUserRole(Number(userId), role);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ message: 'Role updated', user });
  } catch (err) {
    console.error('Patch user error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// DELETE /auth/users/:userId
async function removeUser(req, res) {
  const { userId } = req.params;
  try {
    const user = await deleteUser(Number(userId));
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ message: `User ${user.email} deleted` });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  getRoles,
  register,
  login,
  logout,
  getUsers,
  patchUser,
  removeUser,
};
