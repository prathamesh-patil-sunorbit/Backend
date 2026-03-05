const Form = require('../models/form.model');

// POST /forms  — submit a new visitor form
async function createForm(req, res) {
  const {
    name,
    mobile,
    email,
    city,
    source,
    sourceDetails,
    accompanyingPersons,
  } = req.body;

  if (!name || !mobile) {
    return res
      .status(400)
      .json({ message: 'Name and Mobile are required fields' });
  }

  try {
    const form = new Form({
      name,
      mobile,
      email,
      city,
      source,
      sourceDetails,
      accompanyingPersons: accompanyingPersons ?? 0,
      status: 'Arrived',
      submittedAt: new Date(),
    });

    await form.save();

    return res.status(201).json({
      message: 'Form submitted successfully',
      form,
    });
  } catch (err) {
    console.error('Create form error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /forms  — get all submitted forms (latest first)
async function getAllForms(req, res) {
  try {
    const forms = await Form.find().sort({ submittedAt: -1 });
    return res.json({ total: forms.length, forms });
  } catch (err) {
    console.error('Get all forms error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /forms/:visitId  — get a single form by Visit ID
async function getFormByVisitId(req, res) {
  const { visitId } = req.params;

  try {
    const form = await Form.findOne({ visitId: visitId.toUpperCase() });

    if (!form) {
      return res
        .status(404)
        .json({ message: `No form found with Visit ID: ${visitId}` });
    }

    return res.json({ form });
  } catch (err) {
    console.error('Get form error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// PATCH /forms/:visitId/status  — update status + record history
async function updateFormStatus(req, res) {
  const { visitId } = req.params;
  const { status } = req.body;

  const VALID_STATUSES = [
    'Arrived', 'Discussion', 'Discussion Table',
    'Sample Flat Visit', 'Exit', 'In Progress', 'Completed', 'Cancelled',
  ];

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  try {
    const form = await Form.findOne({ visitId: visitId.toUpperCase() });

    if (!form) {
      return res.status(404).json({ message: `No form found with Visit ID: ${visitId}` });
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

    return res.json({ message: 'Status updated', form });
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /forms/:visitId/preferred-flats  — add/update a flat preference for a visitor
async function addPreferredFlat(req, res) {
  const { visitId } = req.params;
  const { unitCode, preferenceRank, tower } = req.body || {};

  if (!unitCode || !preferenceRank) {
    return res.status(400).json({
      message: 'unitCode and preferenceRank are required',
    });
  }

  if (![1, 2].includes(Number(preferenceRank))) {
    return res.status(400).json({
      message: 'preferenceRank must be 1 or 2',
    });
  }

  try {
    const normalizedVisitId = visitId.toUpperCase();
    const normalizedUnitCode = String(unitCode).toUpperCase().trim();

    const form = await Form.findOne({ visitId: normalizedVisitId });

    if (!form) {
      return res
        .status(404)
        .json({ message: `No form found with Visit ID: ${visitId}` });
    }

    // Enforce: single user can have at most 2 preferred flats total
    const currentPrefs = form.preferredFlats || [];
    const existingForUnit = currentPrefs.find(
      (p) => p.unitCode === normalizedUnitCode
    );

    if (!existingForUnit && currentPrefs.length >= 2) {
      return res.status(400).json({
        message: 'This customer already has 2 preferred flats.',
      });
    }

    // Enforce: a single unit can be preferred by at most 2 different customers
    const allForUnit = await Form.find(
      { 'preferredFlats.unitCode': normalizedUnitCode },
      { visitId: 1, preferredFlats: 1, name: 1 }
    );

    const distinctVisitors = new Set();
    for (const f of allForUnit) {
      for (const p of f.preferredFlats || []) {
        if (p.unitCode === normalizedUnitCode) {
          distinctVisitors.add(f.visitId);
        }
      }
    }

    // If this visitor is not already counted and there are already 2 others, block
    if (!distinctVisitors.has(normalizedVisitId) && distinctVisitors.size >= 2) {
      return res.status(400).json({
        message: 'This unit already has two preferred customers and is considered sold.',
      });
    }

    // Upsert this preference for the visitor
    const now = new Date();
    if (existingForUnit) {
      existingForUnit.preferenceRank = Number(preferenceRank);
      existingForUnit.markedAt = now;
      if (tower) {
        existingForUnit.tower = tower;
      }
    } else {
      form.preferredFlats.push({
        unitCode: normalizedUnitCode,
        tower: tower || '',
        preferenceRank: Number(preferenceRank),
        markedAt: now,
      });
    }

    await form.save();

    return res.json({
      message: 'Preferred flat saved successfully',
      form,
    });
  } catch (err) {
    console.error('Add preferred flat error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  createForm,
  getAllForms,
  getFormByVisitId,
  updateFormStatus,
  addPreferredFlat,
};
