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

module.exports = router;

