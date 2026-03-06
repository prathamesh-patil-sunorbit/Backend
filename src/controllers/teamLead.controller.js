const Form = require('../models/form.model');

// ─── Helper ──────────────────────────────────────────────────────────────────
function minutesBetween(a, b) {
  return Math.round(Math.abs(new Date(b) - new Date(a)) / 60000);
}

// ─── POST /team-lead/:visitId/assign-table ────────────────────────────────────
// Body: { tableNumber, salesExecutive }
async function assignTable(req, res) {
  const { visitId } = req.params;
  const { tableNumber, salesExecutive } = req.body;

  if (!tableNumber || !tableNumber.toString().trim()) {
    return res.status(400).json({ message: 'Table number is required.' });
  }
  if (!salesExecutive || !salesExecutive.trim()) {
    return res.status(400).json({ message: 'Sales executive name is required.' });
  }

  try {
    const form = await Form.findOne({ visitId: visitId.toUpperCase() });
    if (!form) {
      return res.status(404).json({ message: `No visitor found with ID: ${visitId}` });
    }

    const assignedAt = new Date();
    const waitingTimeMinutes = minutesBetween(form.submittedAt, assignedAt);

    // Record history
    form.statusHistory.push({
      oldStatus: form.status,
      newStatus: 'Discussion Table',
      changedBy: req.user?.email || 'Unknown',
      changedAt: assignedAt,
    });

    form.status = 'Discussion Table';
    form.tableAssignment = {
      tableNumber:    tableNumber.toString().trim(),
      salesExecutive: salesExecutive.trim(),
      assignedAt,
      waitingTimeMinutes,
    };

    await form.save();
    return res.json({ message: 'Table assigned successfully', form });
  } catch (err) {
    console.error('Assign table error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ─── POST /team-lead/:visitId/sample-flat ────────────────────────────────────
// Body: { flatNumber?, timeIn, timeOut? }
// flatNumber and timeOut are optional — can be sent later via PATCH
async function recordSampleFlat(req, res) {
  const { visitId } = req.params;
  const { flatNumber, timeIn, timeOut } = req.body;

  if (!timeIn) {
    return res.status(400).json({ message: 'Time In is required.' });
  }

  try {
    const form = await Form.findOne({ visitId: visitId.toUpperCase() });
    if (!form) {
      return res.status(404).json({ message: `No visitor found with ID: ${visitId}` });
    }

    const timeInDate  = new Date(timeIn);
    const timeOutDate = timeOut ? new Date(timeOut) : null;
    const durationMinutes = timeOutDate ? minutesBetween(timeInDate, timeOutDate) : null;
    const now = new Date();

    // Record history
    form.statusHistory.push({
      oldStatus: form.status,
      newStatus: 'Sample Flat Visit',
      changedBy: req.user?.email || 'Unknown',
      changedAt: now,
    });

    form.status = 'Sample Flat Visit';
    form.sampleFlatVisit = {
      flatNumber: (flatNumber && flatNumber.trim()) || '',
      timeIn:     timeInDate,
      timeOut:    timeOutDate || undefined,
      durationMinutes: durationMinutes ?? undefined,
    };

    await form.save();
    return res.json({ message: 'Sample flat visit recorded', form });
  } catch (err) {
    console.error('Sample flat error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ─── PATCH /team-lead/:visitId/sample-flat/checkout ──────────────────────────
// Body: { timeOut }  — record time-out and calculate duration
async function sampleFlatCheckout(req, res) {
  const { visitId } = req.params;
  const { timeOut } = req.body;

  if (!timeOut) {
    return res.status(400).json({ message: 'timeOut is required.' });
  }

  try {
    const form = await Form.findOne({ visitId: visitId.toUpperCase() });
    if (!form || !form.sampleFlatVisit?.timeIn) {
      return res.status(404).json({ message: 'No active sample flat visit found.' });
    }

    const timeOutDate = new Date(timeOut);
    const durationMinutes = minutesBetween(form.sampleFlatVisit.timeIn, timeOutDate);

    form.sampleFlatVisit.timeOut = timeOutDate;
    form.sampleFlatVisit.durationMinutes = durationMinutes;

    await form.save();
    return res.json({ message: 'Check-out recorded', form });
  } catch (err) {
    console.error('Sample flat checkout error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ─── POST /team-lead/:visitId/exit ───────────────────────────────────────────
// Body: { finalStatus, note? }
async function recordExit(req, res) {
  const { visitId } = req.params;
  const { finalStatus, note = '' } = req.body;

  const VALID_FINAL = ['Booked', 'Follow-up', 'Not Interested'];
  if (!finalStatus || !VALID_FINAL.includes(finalStatus)) {
    return res.status(400).json({
      message: `finalStatus is required. Must be one of: ${VALID_FINAL.join(', ')}`,
    });
  }

  try {
    const form = await Form.findOne({ visitId: visitId.toUpperCase() });
    if (!form) {
      return res.status(404).json({ message: `No visitor found with ID: ${visitId}` });
    }
    if (form.status === 'Exit') {
      return res.status(400).json({ message: 'Visitor has already exited.' });
    }

    const exitAt = new Date();
    const totalTimeMinutes = minutesBetween(form.submittedAt, exitAt);

    form.statusHistory.push({
      oldStatus: form.status,
      newStatus: 'Exit',
      changedBy: req.user?.email || 'Unknown',
      changedAt: exitAt,
    });

    form.status = 'Exit';
    form.exitDoor = { exitAt, totalTimeMinutes, finalStatus, note: note.trim() };

    await form.save();
    return res.json({ message: 'Visitor exit recorded', form });
  } catch (err) {
    console.error('Exit door error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { assignTable, recordSampleFlat, sampleFlatCheckout, recordExit };
