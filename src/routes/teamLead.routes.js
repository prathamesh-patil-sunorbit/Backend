const express = require('express');
const router  = express.Router();

const teamLeadController = require('../controllers/teamLead.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

// POST /team-lead/:visitId/assign-table    — assign table once only
router.post('/:visitId/assign-table', teamLeadController.assignTable);

// PATCH /team-lead/:visitId/table-assignment — update existing table assignment (table number / sales executive)
router.patch('/:visitId/table-assignment', teamLeadController.updateTableAssignment);

// POST /team-lead/:visitId/sample-flat     — start sample flat visit (time-in)
router.post('/:visitId/sample-flat', teamLeadController.recordSampleFlat);

// PATCH /team-lead/:visitId/sample-flat/checkout  — record time-out
router.patch('/:visitId/sample-flat/checkout', teamLeadController.sampleFlatCheckout);

// POST /team-lead/:visitId/exit  — mark visitor as exited
router.post('/:visitId/exit', teamLeadController.recordExit);

module.exports = router;
