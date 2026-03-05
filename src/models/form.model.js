const mongoose = require('mongoose');

const formSchema = new mongoose.Schema(
  {
    visitId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    source: {
      type: String,
      trim: true,
      default: '',
    },
    sourceDetails: {
      type: String,
      trim: true,
      default: '',
    },
    accompanyingPersons: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        'Arrived',
        'Discussion',
        'Discussion Table',
        'Sample Flat Visit',
        'Exit',
        'In Progress',
        'Completed',
        'Cancelled',
      ],
      default: 'Arrived',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },

    // Populated by TeamLead — Table Assignment
    tableAssignment: {
      tableNumber:        { type: String, default: '' },
      salesExecutive:     { type: String, default: '' },
      assignedAt:         { type: Date },
      waitingTimeMinutes: { type: Number },   // auto-calculated: assignedAt - submittedAt
    },

    // Populated by TeamLead — Sample Flat Visit
    sampleFlatVisit: {
      flatNumber:      { type: String, default: '' },
      timeIn:          { type: Date },
      timeOut:         { type: Date },
      durationMinutes: { type: Number },      // auto-calculated: timeOut - timeIn
    },

    // Populated by TeamLead — Exit Door
    exitDoor: {
      exitAt:           { type: Date },
      totalTimeMinutes: { type: Number },   // auto-calculated: exitAt - submittedAt
      finalStatus:      { type: String, enum: ['Booked', 'Follow-up', 'Not Interested'], default: undefined },
      note:             { type: String, default: '' },
    },

    statusHistory: {
      type: [
        {
          oldStatus:  { type: String },
          newStatus:  { type: String },
          changedBy:  { type: String },   // email of the user who changed
          changedAt:  { type: Date, default: Date.now },
          _id: false,
        },
      ],
      default: [],
    },

    // Customer flat preferences (for inventory)
    preferredFlats: {
      type: [
        {
          unitCode:       { type: String, required: true, trim: true }, // e.g. A-101
          tower:          { type: String, default: '', trim: true },    // optional label
          preferenceRank: { type: Number, enum: [1, 2], required: true },
          markedAt:       { type: Date, default: Date.now },
          _id: false,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate visitId before saving (e.g. VIS-001, VIS-002 ...)
formSchema.pre('save', async function () {
  if (this.visitId) return;

  const lastForm = await this.constructor
    .findOne({}, { visitId: 1 })
    .sort({ createdAt: -1 });

  let nextNumber = 1;

  if (lastForm && lastForm.visitId) {
    const parts = lastForm.visitId.split('-');
    const lastNum = parseInt(parts[1], 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  this.visitId = `VIS-${String(nextNumber).padStart(3, '0')}`;
});

module.exports = mongoose.model('Form', formSchema);
