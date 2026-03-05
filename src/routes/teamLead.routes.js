const express = require('express');
const router  = express.Router();

const teamLeadController = require('../controllers/teamLead.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

// POST /team-lead/:visitId/assign-table    — assign table + sales exec
router.post('/:visitId/assign-table', teamLeadController.assignTable);

// POST /team-lead/:visitId/sample-flat     — start sample flat visit (time-in)
router.post('/:visitId/sample-flat', teamLeadController.recordSampleFlat);

// PATCH /team-lead/:visitId/sample-flat/checkout  — record time-out
router.patch('/:visitId/sample-flat/checkout', teamLeadController.sampleFlatCheckout);

// POST /team-lead/:visitId/exit  — mark visitor as exited
router.post('/:visitId/exit', teamLeadController.recordExit);

module.exports = router;
