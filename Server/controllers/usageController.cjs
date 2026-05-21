const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 });

const usageService = require('../services/usageService.cjs');
const fileCacheService = require('../services/fileCacheService.cjs');
const usageConfig = require('../config/usageConfig.cjs');
const { resolveUsageDateRange } = require('../utils/dateRange.cjs');

const getUsageConfig = async (req, res) => {
  try {
    const dateDefaults = await usageService.getUsageDateDefaults();

    res.status(200).json({
      ...dateDefaults,
      cacheTtlSeconds: usageConfig.cacheTtlSeconds,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: 'Failed to fetch usage config',
      error: error.message,
    });
  }
};

const fetchUsageData = async (req, res) => {
  try {
    const params = req.body || {};
    const dateDefaults = params.startDate && params.endDate
      ? {}
      : await usageService.getUsageDateDefaults();
    const dateRange = resolveUsageDateRange(params, dateDefaults);
    const forceRefresh = Boolean(params.forceRefresh);

    const cacheKey = JSON.stringify(dateRange);

    const cachedData = cache.get(cacheKey);
    const isCachedDataValid = cachedData && Object.prototype.hasOwnProperty.call(cachedData, 'resultSet2');

    if (isCachedDataValid && !forceRefresh) {
      return res.status(200).json({
        source: 'MEMORY_CACHE',
        dateRange,
        data: cachedData.data || cachedData,
        resultSet2: cachedData.resultSet2 || [],
        resultSet3: cachedData.resultSet3 || [],
      });
    }

    const fileCache = forceRefresh ? null : await fileCacheService.readUsageCache(dateRange);    await fileCacheService.cleanInvalidUsageCaches();
    const isFileCacheValid = fileCache && Object.prototype.hasOwnProperty.call(fileCache, 'resultSet2');

    if (isFileCacheValid) {
      cache.set(cacheKey, fileCache);

      return res.status(200).json({
        source: 'FILE_CACHE',
        dateRange,
        cachedAt: fileCache.createdAt,
        data: fileCache.data || fileCache,
        resultSet2: fileCache.resultSet2 || [],
        resultSet3: fileCache.resultSet3 || [],
      });
    }

    const data = await usageService.getUsageData(dateRange);
    const savedCache = await fileCacheService.writeUsageCache(dateRange, data);

    cache.set(cacheKey, savedCache);

    res.status(200).json({
      source: 'DATABASE',
      dateRange,
      cachedAt: savedCache.createdAt,
      data: savedCache.data,
      resultSet2: savedCache.resultSet2 || [],
      resultSet3: savedCache.resultSet3 || [],
    });
  } catch (error) {
    console.log(error);

    res.status(error.statusCode || 500).json({
      message: 'Failed to fetch usage data',
      error: error.message,
    });
  }
};

module.exports = {
  getUsageConfig,
  fetchUsageData,
};
