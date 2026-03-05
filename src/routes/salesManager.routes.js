const express = require('express');
const router = express.Router();

const salesController = require('../controllers/salesManager.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// All sales routes require authentication
router.use(authMiddleware);

// GET  /sales/search?q=VIS-001  — search visitor by token or name
router.get('/search', salesController.searchVisitor);

// PATCH /sales/:visitId/action  — change status + record history
router.patch('/:visitId/action', salesController.updateStatus);

module.exports = router;
