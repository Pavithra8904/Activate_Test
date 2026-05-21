const { sql, poolPromise } = require('../db/sqlConnection.cjs');
const usageConfig = require('../config/usageConfig.cjs');
const { normalizeDateValue } = require('../utils/dateRange.cjs');

const quoteIdentifier = (identifier) => {
  if (!/^[A-Za-z0-9_]+$/.test(identifier)) {
    throw new Error(`Invalid SQL identifier: ${identifier}`);
  }

  return `[${identifier}]`;
};

const quoteMultipartIdentifier = (identifier) => identifier
  .split('.')
  .map((part) => quoteIdentifier(part))
  .join('.');

const normalizeConfigName = (value) => String(value || '')
  .replace(/[^a-z0-9]/gi, '')
  .toLowerCase();

const getTableMetadataName = () => {
  const parts = usageConfig.specConfigTable.split('.');
  return {
    schemaName: parts.length > 1 ? parts[parts.length - 2] : null,
    tableName: parts[parts.length - 1],
  };
};

const findColumnName = (columns, preferredName, fallbackNames) => {
  const matches = [preferredName, ...fallbackNames].filter(Boolean);
  return matches
    .map((name) => columns.find((column) => column.toLowerCase() === name.toLowerCase()))
    .find(Boolean) || preferredName;
};

const findOptionalColumnName = (columns, preferredName, fallbackNames) => {
  const matches = [preferredName, ...fallbackNames].filter(Boolean);
  return matches
    .map((name) => columns.find((column) => column.toLowerCase() === name.toLowerCase()))
    .find(Boolean);
};

const getSpecConfigColumns = async (pool) => {
  const { schemaName, tableName } = getTableMetadataName();
  const request = pool.request().input('tableName', sql.VarChar, tableName);
  let whereClause = 'TABLE_NAME = @tableName';

  if (schemaName) {
    request.input('schemaName', sql.VarChar, schemaName);
    whereClause += ' AND TABLE_SCHEMA = @schemaName';
  }

  const result = await request.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE ${whereClause}
  `);

  const columns = result.recordset.map((row) => row.COLUMN_NAME);

  return {
    nameColumn: findColumnName(columns, usageConfig.specConfigNameColumn, ['name']),
    valueColumn: findColumnName(columns, usageConfig.specConfigValueColumn, ['value', 'values']),
    statusColumn: findOptionalColumnName(columns, usageConfig.specConfigStatusColumn, ['status']),
  };
};

const getUsageDateDefaults = async () => {
  const fallbackDefaults = {
    defaultStartDate: normalizeDateValue(usageConfig.defaultStartDate),
    defaultEndDate: normalizeDateValue(usageConfig.defaultEndDate),
  };

  try {
    const pool = await poolPromise;

    if (!pool) {
      throw new Error('SQL connection pool is not available');
    }

    const tableName = quoteMultipartIdentifier(usageConfig.specConfigTable);
    const configColumns = await getSpecConfigColumns(pool);
    const nameColumn = quoteIdentifier(configColumns.nameColumn);
    const valueColumn = quoteIdentifier(configColumns.valueColumn);
    const statusFilter = configColumns.statusColumn
      ? `AND ${quoteIdentifier(configColumns.statusColumn)} = 1`
      : '';

    const result = await pool.request().query(`
      SELECT
        ${nameColumn} AS configName,
        ${valueColumn} AS configValue
      FROM ${tableName}
      WHERE LOWER(REPLACE(REPLACE(CONVERT(varchar(200), ${nameColumn}), ' ', ''), '_', '')) IN ('startdate', 'enddate')
        ${statusFilter}
    `);

    const defaults = { ...fallbackDefaults };

    result.recordset.forEach((row) => {
      const normalizedName = normalizeConfigName(row.configName);
      const normalizedDate = normalizeDateValue(row.configValue);

      if (!normalizedDate) {
        return;
      }

      if (normalizedName.includes('start') && normalizedName.includes('date')) {
        defaults.defaultStartDate = normalizedDate;
      }

      if (normalizedName.includes('end') && normalizedName.includes('date')) {
        defaults.defaultEndDate = normalizedDate;
      }
    });

    return defaults;
  } catch (error) {
    console.log('Failed to read React_Spec_Config defaults, using fallback defaults');
    console.log(error.message);
    return fallbackDefaults;
  }
};

const getUsageData = async (params) => {
  try {
    const pool = await poolPromise;

    if (!pool) {
      throw new Error('SQL connection pool is not available');
    }

    const result = await pool
      .request()
      .input('STARTDATE', sql.VarChar, params.startDate)
      .input('ENDDATE', sql.VarChar, params.endDate)
      .execute(usageConfig.storedProcedure);

    console.log(`SP returned ${result.recordset.length} rows in result set 1`);
    console.log(`SP returned ${result.recordsets.length} total result sets`);

    return {
      resultSet1: result.recordset || [],
      resultSet2: result.recordsets[1] || [],
      resultSet3: result.recordsets[2] || [],
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = {
  getUsageDateDefaults,
  getUsageData,
};
