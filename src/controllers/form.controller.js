const Form = require('../models/form.model');
const HeldUnit = require('../models/heldUnit.model');
const XLSX = require('xlsx');

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
    'Sample Flat Visit', 'Sample Flat Check-in', 'Sample Flat Check-out',
    'Exit', 'In Progress', 'Completed', 'Cancelled',
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

// PATCH /forms/:visitId/token-number  — add or update token number for a visitor
async function updateTokenNumber(req, res) {
  const { visitId } = req.params;
  const { tokenNumber } = req.body || {};

  const value = typeof tokenNumber === 'string' ? tokenNumber.trim() : String(tokenNumber || '').trim();

  try {
    const form = await Form.findOne({ visitId: visitId.toUpperCase() });

    if (!form) {
      return res.status(404).json({ message: `No form found with Visit ID: ${visitId}` });
    }

    form.tokenNumber = value;
    await form.save();

    return res.json({ message: value ? 'Token number saved.' : 'Token number cleared.', form });
  } catch (err) {
    console.error('Update token number error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// PATCH /forms/:visitId/token-upgrade  — record token upgrade (Gold → Platinum) so it persists on refresh
async function updateTokenUpgrade(req, res) {
  const { visitId } = req.params;
  const { oldToken, newToken } = req.body || {};

  const oldVal = (oldToken && String(oldToken).trim()) || 'Gold';
  const newVal = (newToken && String(newToken).trim()) || 'Platinum';

  try {
    const form = await Form.findOne({ visitId: visitId.toUpperCase() });

    if (!form) {
      return res.status(404).json({ message: `No form found with Visit ID: ${visitId}` });
    }

    form.tokenUpgradeHistory.push({
      oldToken: oldVal,
      newToken: newVal,
      timestamp: new Date(),
    });
    form.tokenTier = 'platinum';
    await form.save();

    return res.json({ message: 'Token upgraded.', form });
  } catch (err) {
    console.error('Update token upgrade error:', err);
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

// POST /forms/upload-excel — bulk import visitors from Excel
async function uploadExcel(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows.length) {
      return res.status(400).json({ message: 'Uploaded sheet is empty' });
    }

    const created = [];

    for (const row of rows) {
      // Column names are based on the sample sheet screenshot
      const name =
        row['Customer Name'] ||
        row['Customer'] ||
        row['Name'] ||
        '';

      if (!name) continue; // skip header/empty rows

      const tokenNumber = String(
        row['Token Number'] || row['Token No'] || ''
      ).trim();

      const referenceOrMobile = String(
        row['Reference Enquiry'] || row['Mobile'] || ''
      ).trim();

      const tokenType = String(row['Token Type'] || '').trim();
      const tokenAmountRaw = row['Token Amount'] || row['Amount'] || '';
      const preference = String(row['Preference'] || '').trim();
      const source = String(row['Source'] || '').trim();
      const sourceDetails = String(row['Source Detail'] || row['Source Details'] || '').trim();
      const salesExecutive = String(row['Sales Executive'] || '').trim();

      let tokenDate;
      const tokenDateRaw = row['Token Date'] || row['Date'] || null;
      if (tokenDateRaw instanceof Date) {
        tokenDate = tokenDateRaw;
      } else if (typeof tokenDateRaw === 'string' && tokenDateRaw.trim()) {
        const parsed = new Date(tokenDateRaw);
        if (!isNaN(parsed.getTime())) tokenDate = parsed;
      }

      const form = new Form({
        name,
        mobile: referenceOrMobile || 'NA',
        email: '',
        city: '',
        source,
        sourceDetails,
        accompanyingPersons: 0,
        status: 'In Progress',        // not yet arrived; receptionist will check-in
        submittedAt: tokenDate || new Date(),
        tokenNumber,
      });

      // Attach extra metadata without changing schema requirements
      form.set('tokenType', tokenType, { strict: false });
      if (tokenAmountRaw) {
        const amt = Number(
          String(tokenAmountRaw).replace(/[,₹\s]/g, '')
        );
        if (!isNaN(amt)) {
          form.set('tokenAmount', amt, { strict: false });
        }
      }
      form.set('flatPreference', preference, { strict: false });
      form.set('salesExecutiveName', salesExecutive, { strict: false });
      if (tokenDate) {
        form.set('tokenDate', tokenDate, { strict: false });
      }

      await form.save();

      created.push({
        visitId: form.visitId,
        name: form.name,
        tokenNumber,
      });
    }

    return res.json({
      message: 'Excel imported successfully',
      imported: created.length,
      visitors: created,
    });
  } catch (err) {
    console.error('Upload excel error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /forms/hold-unit — CEO holds a unit so others can't see it
async function holdUnit(req, res) {
  const { unitCode } = req.body || {};

  if (!unitCode) {
    return res.status(400).json({ message: 'unitCode is required' });
  }

  // Only CEO is allowed to hold units
  if (!req.user || req.user.role !== 'CEO') {
    return res.status(403).json({ message: 'Only CEO can hold units' });
  }

  try {
    const code = String(unitCode).toUpperCase().trim();

    const held = await HeldUnit.findOneAndUpdate(
      { unitCode: code },
      { heldBy: req.user.email.toLowerCase(), heldAt: new Date() },
      { new: true, upsert: true }
    );

    return res.json({
      message: 'Unit held successfully',
      unit: held,
    });
  } catch (err) {
    console.error('Hold unit error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /forms/held-units — list of all held unit codes
async function getHeldUnits(_req, res) {
  try {
    const docs = await HeldUnit.find({}, { unitCode: 1, _id: 0 }).lean();
    const codes = docs.map((d) => d.unitCode);
    return res.json({ total: codes.length, units: codes });
  } catch (err) {
    console.error('Get held units error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  createForm,
  getAllForms,
  getFormByVisitId,
  updateFormStatus,
  updateTokenNumber,
  updateTokenUpgrade,
  addPreferredFlat,
  uploadExcel,
  holdUnit,
  getHeldUnits,
};
