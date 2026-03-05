const Form = require('../models/form.model');

const VALID_STATUSES = ['Arrived', 'Discussion', 'In Progress', 'Completed', 'Cancelled'];

// GET /sales/search?q=VIS-001  OR  ?q=Ramesh
// Searches by visitId (exact, case-insensitive) OR visitor name (partial match)
async function searchVisitor(req, res) {
  const { q } = req.query;

  if (!q || !q.trim()) {
    return res.status(400).json({ message: 'Query parameter "q" is required.' });
  }

  const query = q.trim();

  try {
    // Try exact visitId match first (e.g. VIS-001)
    const byId = await Form.findOne({ visitId: query.toUpperCase() });
    if (byId) {
      return res.json({ results: [byId] });
    }

    // Fallback: partial name match (case-insensitive)
    const byName = await Form.find({
      name: { $regex: query, $options: 'i' },
    }).sort({ submittedAt: -1 }).limit(10);

    return res.json({ results: byName });
  } catch (err) {
    console.error('Search visitor error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// PATCH /sales/:visitId/action
// Body: { status: 'Discussion' }   (or any valid status)
// Records old → new status in statusHistory
async function updateStatus(req, res) {
  const { visitId } = req.params;
  const { status } = req.body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  try {
    const form = await Form.findOne({ visitId: visitId.toUpperCase() });

    if (!form) {
      return res.status(404).json({ message: `No visitor found with ID: ${visitId}` });
    }

    if (form.status === status) {
      return res.status(400).json({ message: `Status is already "${status}".` });
    }

    // Push history entry
    form.statusHistory.push({
      oldStatus: form.status,
      newStatus: status,
      changedBy: req.user?.email || 'Unknown',
      changedAt: new Date(),
    });

    form.status = status;
    await form.save();

    return res.json({ message: `Status updated to "${status}"`, form });
  } catch (err) {
    console.error('Sales update status error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { searchVisitor, updateStatus };
