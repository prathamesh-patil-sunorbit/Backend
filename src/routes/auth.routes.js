const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// GET  /auth/roles    — returns list of all valid roles
router.get('/roles', authController.getRoles);

// POST /auth/register
router.post('/register', authController.register);

// POST /auth/login
router.post('/login', authController.login);

// POST /auth/logout (requires Authorization: Bearer <token>)
router.post('/logout', authMiddleware, authController.logout);

// GET    /auth/users          — list all users (Admin)
router.get('/users', authMiddleware, authController.getUsers);

// PATCH  /auth/users/:userId  — update role (Admin)
router.patch('/users/:userId', authMiddleware, authController.patchUser);

// DELETE /auth/users/:userId  — delete user (Admin)
router.delete('/users/:userId', authMiddleware, authController.removeUser);

module.exports = router;

