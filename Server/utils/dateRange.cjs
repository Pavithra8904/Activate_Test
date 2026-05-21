const usageConfig = require('../config/usageConfig.cjs');

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const normalizeDateValue = (value) => {
  if (!value) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const raw = String(value).trim();
  const isoMatch = raw.match(/^\d{4}-\d{2}-\d{2}/);

  if (isoMatch) {
    return isoMatch[0];
  }

  const parsedDate = new Date(raw);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString().slice(0, 10);
  }

  return raw;
};

const isValidDate = (value) => {
  if (!datePattern.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const resolveUsageDateRange = (params = {}, defaults = {}) => {
  const startDate = normalizeDateValue(params.startDate || defaults.defaultStartDate || usageConfig.defaultStartDate);
  const endDate = normalizeDateValue(params.endDate || defaults.defaultEndDate || usageConfig.defaultEndDate);

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    const error = new Error('startDate and endDate must be valid YYYY-MM-DD dates');
    error.statusCode = 400;
    throw error;
  }

  if (new Date(startDate) > new Date(endDate)) {
    const error = new Error('startDate must be before or equal to endDate');
    error.statusCode = 400;
    throw error;
  }

  return {
    startDate,
    endDate,
  };
};

module.exports = {
  normalizeDateValue,
  resolveUsageDateRange,
};
