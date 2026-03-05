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

// POST   /forms/:visitId/preferred-flats — add/update preferred flat for a visitor (protected)
router.post('/:visitId/preferred-flats', authMiddleware, formController.addPreferredFlat);

module.exports = router;
