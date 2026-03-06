const mongoose = require('mongoose');

const heldUnitSchema = new mongoose.Schema(
  {
    unitCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    heldBy: {
      type: String, // email of CEO
      required: true,
      trim: true,
      lowercase: true,
    },
    heldAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('HeldUnit', heldUnitSchema);

