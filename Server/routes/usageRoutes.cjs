const express = require('express');
const router = express.Router();

const {
  getUsageConfig,
  fetchUsageData,
} = require('../controllers/usageController.cjs');

router.get('/usage/config', getUsageConfig);
router.post('/usage', fetchUsageData);

module.exports = router;
