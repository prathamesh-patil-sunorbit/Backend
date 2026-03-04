const express = require('express');
const router = express.Router();

const formController = require('../controllers/form.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// POST   /forms          — submit a new visitor form (public)
router.post('/', formController.createForm);

// GET    /forms          — get all forms (protected)
router.get('/', authMiddleware, formController.getAllForms);

// GET    /forms/:visitId — get one form by Visit ID (protected)
router.get('/:visitId', authMiddleware, formController.getFormByVisitId);

// PATCH  /forms/:visitId/status — update form status (protected)
router.patch('/:visitId/status', authMiddleware, formController.updateFormStatus);

module.exports = router;
