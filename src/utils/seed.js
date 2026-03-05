const bcrypt = require('bcryptjs');
const { findByEmail, createUser } = require('../models/user.model');

const DEMO_USERS = [
  { email: 'admin@demo.com',      password: 'admin123',  role: 'Admin'        },
  { email: 'teamlead@demo.com',   password: 'lead123',   role: 'TeamLead'     },
  { email: 'sales@demo.com',      password: 'sales123',  role: 'SalesManager' },
  { email: 'reception@demo.com',  password: 'recep123',  role: 'Reception'    },
  { email: 'gre@demo.com',        password: 'gre123',    role: 'GRE'          },
  { email: 'sitehead@demo.com',   password: 'site123',   role: 'SiteHead'     },
  { email: 'ceo@demo.com',        password: 'ceo123',    role: 'CEO'          },
];

async function seedDemoUsers() {
  try {
    for (const demo of DEMO_USERS) {
      const exists = await findByEmail(demo.email);
      if (!exists) {
        const passwordHash = await bcrypt.hash(demo.password, 10);
        await createUser({ email: demo.email, passwordHash, role: demo.role });
        console.log(`[Seed] Created demo user: ${demo.email} (${demo.role})`);
      }
    }
    console.log('[Seed] Demo users ready.');
  } catch (err) {
    console.error('[Seed] Error seeding demo users:', err.message);
  }
}

module.exports = seedDemoUsers;
