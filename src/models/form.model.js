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
      enum: ['Arrived', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Arrived',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate visitId before saving (e.g. VIS-001, VIS-002 ...)
formSchema.pre('save', async function (next) {
  if (this.visitId) return next();

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
  next();
});

module.exports = mongoose.model('Form', formSchema);
