const express = require('express');
const multer = require('multer');
const router = express.Router();

const formController = require('../controllers/form.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// POST   /forms          — submit a new visitor form (public)
router.post('/', formController.createForm);

// GET    /forms          — get all forms (protected)
router.get('/', authMiddleware, formController.getAllForms);

// POST   /forms/upload-excel — bulk import via Excel (protected)
router.post(
  '/upload-excel',
  authMiddleware,
  upload.single('file'),
  formController.uploadExcel
);

// POST   /forms/hold-unit   — CEO holds a unit (protected)
router.post('/hold-unit', authMiddleware, formController.holdUnit);

// GET    /forms/held-units  — list all held units (protected)
router.get('/held-units', authMiddleware, formController.getHeldUnits);

// GET    /forms/:visitId — get one form by Visit ID (protected)
router.get('/:visitId', authMiddleware, formController.getFormByVisitId);

// PATCH  /forms/:visitId/status — update form status (protected)
router.patch('/:visitId/status', authMiddleware, formController.updateFormStatus);

// PATCH  /forms/:visitId/token-number — add or update token number (protected)
router.patch('/:visitId/token-number', authMiddleware, formController.updateTokenNumber);

// PATCH  /forms/:visitId/token-upgrade — record token upgrade Gold → Platinum (protected)
router.patch('/:visitId/token-upgrade', authMiddleware, formController.updateTokenUpgrade);

// POST   /forms/:visitId/preferred-flats — add/update preferred flat for a visitor (protected)
router.post('/:visitId/preferred-flats', authMiddleware, formController.addPreferredFlat);

module.exports = router;
