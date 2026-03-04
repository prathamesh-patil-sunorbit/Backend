const VALID_ROLES = ['Admin', 'TeamLead', 'SalesManager', 'Reception', 'GRE','SiteHead','CEO'];

const users = [];

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function findByEmail(email) {
  const normalized = normalizeEmail(email);
  return users.find((u) => u.email === normalized) || null;
}

function createUser({ email, passwordHash, role }) {
  const normalized = normalizeEmail(email);

  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
  }

  const user = {
    id: users.length + 1,
    email: normalized,
    passwordHash,
    role,
  };

  users.push(user);
  return user;
}

module.exports = {
  users,
  VALID_ROLES,
  findByEmail,
  createUser,
};

