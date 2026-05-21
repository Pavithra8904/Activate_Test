const path = require('path');

const usageConfig = {
  storedProcedure: process.env.USAGE_SP_NAME || 'React_GetTransformedRawData_test',
  defaultStartDate: process.env.USAGE_DEFAULT_START_DATE || '2026-01-01',
  defaultEndDate: process.env.USAGE_DEFAULT_END_DATE || '2026-01-31',
  specConfigTable: process.env.USAGE_SPEC_CONFIG_TABLE || 'React_Spec_Config',
  specConfigNameColumn: process.env.USAGE_SPEC_CONFIG_NAME_COLUMN || 'Name',
  specConfigValueColumn: process.env.USAGE_SPEC_CONFIG_VALUE_COLUMN || 'Value',
  specConfigStatusColumn: process.env.USAGE_SPEC_CONFIG_STATUS_COLUMN || 'Status',
  cacheDir: process.env.USAGE_CACHE_DIR || path.join(__dirname, '..', 'cache'),
  cacheTtlSeconds: Number(process.env.USAGE_CACHE_TTL_SECONDS || 86400),
};

module.exports = usageConfig;
