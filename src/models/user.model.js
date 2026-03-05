const mongoose = require('mongoose');

const VALID_ROLES = [
  'Admin',
  'TeamLead',
  'SalesManager',
  'Reception',
  'GRE',
  'SiteHead',
  'CEO',
];

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: VALID_ROLES,
      required: [true, 'Role is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate userId before saving (1, 2, 3 ...)
userSchema.pre('save', async function () {
  if (this.userId) return;

  const last = await this.constructor
    .findOne({}, { userId: 1 })
    .sort({ userId: -1 });

  this.userId = last ? last.userId + 1 : 1;
});

const User = mongoose.model('User', userSchema);

async function findByEmail(email) {
  const normalized = email.trim().toLowerCase();
  return await User.findOne({ email: normalized });
}

async function createUser({ email, passwordHash, role }) {
  const user = new User({ email, passwordHash, role });
  await user.save();
  return user;
}

async function getAllUsers() {
  return await User.find({}, { passwordHash: 0 }).sort({ userId: 1 });
}

async function updateUserRole(userId, role) {
  return await User.findOneAndUpdate(
    { userId },
    { role },
    { new: true, select: '-passwordHash' }
  );
}

async function deleteUser(userId) {
  return await User.findOneAndDelete({ userId });
}

module.exports = {
  VALID_ROLES,
  findByEmail,
  createUser,
  getAllUsers,
  updateUserRole,
  deleteUser,
};
