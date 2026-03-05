require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const formRoutes = require('./routes/form.routes');
const salesRoutes    = require('./routes/salesManager.routes');
const teamLeadRoutes = require('./routes/teamLead.routes');
const seedDemoUsers  = require('./utils/seed');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Auth backend is running');
});

app.use('/auth', authRoutes);
app.use('/forms', formRoutes);
app.use('/sales', salesRoutes);
app.use('/team-lead', teamLeadRoutes);

connectDB().then(async () => {
  await seedDemoUsers();
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
});
