const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const usageRoutes = require('./routes/usageRoutes.cjs');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', usageRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
