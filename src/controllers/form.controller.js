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

// PATCH /forms/:visitId/status  — update status of a form
async function updateFormStatus(req, res) {
  const { visitId } = req.params;
  const { status } = req.body;

  const VALID_STATUSES = ['Arrived', 'In Progress', 'Completed', 'Cancelled'];

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  try {
    const form = await Form.findOneAndUpdate(
      { visitId: visitId.toUpperCase() },
      { status },
      { new: true }
    );

    if (!form) {
      return res
        .status(404)
        .json({ message: `No form found with Visit ID: ${visitId}` });
    }

    return res.json({ message: 'Status updated', form });
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  createForm,
  getAllForms,
  getFormByVisitId,
  updateFormStatus,
};
