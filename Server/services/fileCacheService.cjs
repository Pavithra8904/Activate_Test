const fs = require('fs/promises');
const path = require('path');
const usageConfig = require('../config/usageConfig.cjs');

const getCacheFilePath = ({ startDate, endDate }) => {
  const safeStartDate = startDate.replace(/[^0-9-]/g, '');
  const safeEndDate = endDate.replace(/[^0-9-]/g, '');
  return path.join(usageConfig.cacheDir, `usage-${safeStartDate}-${safeEndDate}.json`);
};

const isExpired = (createdAt) => {
  if (!usageConfig.cacheTtlSeconds) {
    return false;
  }

  const createdTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdTime)) {
    return true;
  }

  return Date.now() - createdTime > usageConfig.cacheTtlSeconds * 1000;
};

const readUsageCache = async (dateRange) => {
  try {
    const filePath = getCacheFilePath(dateRange);
    const raw = await fs.readFile(filePath, 'utf8');
    const cached = JSON.parse(raw);

    if (isExpired(cached.createdAt)) {
      return null;
    }

    return cached;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
};

const cleanInvalidUsageCaches = async () => {
  await fs.mkdir(usageConfig.cacheDir, { recursive: true });

  const cacheFiles = await fs.readdir(usageConfig.cacheDir);
  const deletedFiles = [];

  for (const fileName of cacheFiles) {
    if (!fileName.endsWith('.json')) {
      continue;
    }

    const filePath = path.join(usageConfig.cacheDir, fileName);

    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const cached = JSON.parse(raw);

      if (!Object.prototype.hasOwnProperty.call(cached, 'resultSet2')) {
        await fs.unlink(filePath);
        deletedFiles.push(fileName);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        continue;
      }
      await fs.unlink(filePath).catch(() => null);
      deletedFiles.push(fileName);
    }
  }

  return deletedFiles;
};

const writeUsageCache = async (dateRange, data) => {
  await fs.mkdir(usageConfig.cacheDir, { recursive: true });

  const primaryData = Array.isArray(data) ? data : (data.resultSet1 || data);

  const payload = {
    dateRange,
    createdAt: new Date().toISOString(),
    rowCount: Array.isArray(primaryData) ? primaryData.length : 0,
    data: primaryData,
    resultSet2: Array.isArray(data) ? [] : (data.resultSet2 || []),
    resultSet3: Array.isArray(data) ? [] : (data.resultSet3 || []),
  };

  await fs.writeFile(
    getCacheFilePath(dateRange),
    JSON.stringify(payload),
    'utf8'
  );

  return payload;
};

module.exports = {
  readUsageCache,
  writeUsageCache,
  cleanInvalidUsageCaches,
};
