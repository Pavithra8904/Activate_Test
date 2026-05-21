import { useEffect, useMemo, useState } from 'react';
import './Dashboard.scss';
import Header from '../../components/Header/Header';
import Sidebar from '../../components/Sidebar/Sidebar';
import StatsCard from '../../components/StatsCard/StatsCard';
import DateRangeFilter from '../../components/DateRangeFilter/DateRangeFilter';
import { getUsageConfig, getUsageData } from '../../services/usageService';
import { BarChart3, Users, ArrowUp, ArrowDown, Building } from 'lucide-react';
import { fallbackDateRange, resolveDateRange, saveDateRange } from '../../utils/usageDateRange';

const formatNumber = (value) => new Intl.NumberFormat('en-US').format(value || 0);

const formatPercent = (value, decimals = 1) => Number.isFinite(value)
  ? `${Number(value).toFixed(decimals)}%`
  : '0%';

const getBreakdownTotal = (breakdown) => Object.values(breakdown || {}).reduce(
  (sum, value) => sum + (Number.isFinite(Number(value)) ? Number(value) : 0),
  0,
);

const findNumericTotal = (rows, keys) => rows.reduce((total, row) => {
  const matchedKey = keys.find((key) => Object.prototype.hasOwnProperty.call(row, key));
  const value = matchedKey ? Number(row[matchedKey]) : 0;
  return total + (Number.isFinite(value) ? value : 0);
}, 0);


const Dashboard = () => {
  const [dateRange, setDateRange] = useState({
    ...fallbackDateRange,
  });
  const [usageData, setUsageData] = useState([]);
  const [yearUsageRows, setYearUsageRows] = useState([]);
  const [yearUsageSummary, setYearUsageSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsageData = async (range, forceRefresh = false) => {
    setLoading(true);
    setError('');

    try {
      const response = await getUsageData({
        ...range,
        forceRefresh,
      });

      const apiBody = response || {};
      setUsageData(apiBody.data || apiBody || []);
      setYearUsageRows(Array.isArray(apiBody.resultSet2) ? apiBody.resultSet2 : []);
      setYearUsageSummary(Array.isArray(apiBody.resultSet3) ? apiBody.resultSet3 : []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      let initialRange = fallbackDateRange;

      try {
        const config = await getUsageConfig();
        initialRange = resolveDateRange(config);
      } catch (err) {
        initialRange = resolveDateRange();
      }

      setDateRange(initialRange);
      await loadUsageData(initialRange);
    };

    loadInitialData();
  }, []);

  const stats = useMemo(() => {
    const safeUsageData = Array.isArray(usageData) ? usageData : [];
    const safeYearRows = Array.isArray(yearUsageRows) ? yearUsageRows : [];
    const safeYearSummary = Array.isArray(yearUsageSummary) ? yearUsageSummary : [];
    const totalUsage = findNumericTotal(safeUsageData, ['Usage', 'usage', 'TotalUsage', 'totalUsage']);
    const yearlyUsage = findNumericTotal(safeYearRows, ['YearlyUsage', 'YearUsage', 'yearUsage']);
    const monthlyUsage = findNumericTotal(safeYearRows, ['MonthlyUsage', 'MonthyUsage', 'monthlyUsage', 'monthlyusage']);
    const activeClients = findNumericTotal(safeYearRows, ['ActiveClients', 'ActiveClient', 'activeClients', 'activeClient']);
    const activeUsers = findNumericTotal(safeYearRows, ['ActiveUser', 'ActiveUsers', 'activeUser', 'activeUsers']);
    const yearlyUsagePercentage = findNumericTotal(safeYearSummary, ['YearlyUsagePercentage', 'yearlyUsagePercentage', 'YearlyUsagePercent', 'yearlyUsagePercent']);
    const monthlyUsagePercentage = findNumericTotal(safeYearSummary, ['MontlyUsagePercentage', 'MonthlyUsagePercentage', 'monthlyUsagePercentage', 'monthlyUsagePercent']);
    const newClients = findNumericTotal(safeYearSummary, ['NewClients', 'newClients', 'NewClient', 'newClient']);
    const newUsers = findNumericTotal(safeYearSummary, ['NewUser', 'NewUsers', 'newUser', 'newUsers']);

    const buildBreakdown = (rows, keys) => rows.reduce((acc, row) => {
      const platform = String(row.PLATFORM || row.Platform || row.platform || '').toUpperCase();
      if (!platform) return acc;

      const value = findNumericTotal([row], keys);
      if (!Number.isFinite(value)) return acc;

      acc[platform] = (acc[platform] || 0) + value;
      return acc;
    }, {});

    const yearlyBreakdown = buildBreakdown(safeYearRows, ['YearlyUsage', 'YearUsage', 'yearUsage']);
    const monthlyBreakdown = buildBreakdown(safeYearRows, ['MonthlyUsage', 'MonthyUsage', 'monthlyUsage', 'monthlyusage']);
    const activeClientsBreakdown = buildBreakdown(safeYearRows, ['ActiveClients', 'ActiveClient', 'activeClients', 'activeClient']);
    const activeUsersBreakdown = buildBreakdown(safeYearRows, ['ActiveUser', 'ActiveUsers', 'activeUser', 'activeUsers']);
    const yearlyBreakdownTotal = getBreakdownTotal(yearlyBreakdown);
    const monthlyBreakdownTotal = getBreakdownTotal(monthlyBreakdown);

    const yearKeyCandidates = ['Year', 'YEAR', 'year'];
    const yearKey = yearKeyCandidates.find((k) => safeYearRows.some((r) => Object.prototype.hasOwnProperty.call(r, k)));
    let previousYearBreakdown = {};
    if (yearKey) {
      const years = Array.from(new Set(safeYearRows.map((r) => r[yearKey]).filter(Boolean)))
        .map((y) => Number(y)).filter(Number.isFinite).sort((a, b) => b - a);
      if (years.length >= 2) {
        const prevYear = years[1];
        const rowsForPrev = safeYearRows.filter((r) => Number(r[yearKey]) === prevYear);
        previousYearBreakdown = buildBreakdown(rowsForPrev, ['YearlyUsage', 'YearUsage', 'yearUsage']);
      }
    }

    const monthKeyCandidates = ['Month', 'MONTH', 'month'];
    const monthKey = monthKeyCandidates.find((k) => safeYearRows.some((r) => Object.prototype.hasOwnProperty.call(r, k)));
    const monthNameMap = {
      jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
      jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    };
    const getMonthValue = (value) => {
      if (value == null) return null;
      const raw = String(value).trim();
      const numeric = Number(raw);
      if (Number.isFinite(numeric)) return numeric;
      const key = raw.slice(0, 3).toLowerCase();
      return monthNameMap[key] || null;
    };

    const getYearMonthKey = (row) => {
      const monthValue = getMonthValue(row[monthKey]);
      const yearValue = yearKey ? Number(row[yearKey]) : null;
      if (!Number.isFinite(monthValue)) return null;
      return Number.isFinite(yearValue) ? (yearValue * 100 + monthValue) : monthValue;
    };

    let previousMonthBreakdown = {};
    if (monthKey) {
      const monthKeys = Array.from(new Set(safeYearRows
        .map(getYearMonthKey)
        .filter((value) => Number.isFinite(value)))).sort((a, b) => b - a);
      if (monthKeys.length >= 2) {
        const prevMonthKey = monthKeys[1];
        const rowsForPrevMonth = safeYearRows.filter((r) => getYearMonthKey(r) === prevMonthKey);
        previousMonthBreakdown = buildBreakdown(rowsForPrevMonth, ['MonthlyUsage', 'MonthyUsage', 'monthlyUsage', 'monthlyusage']);
      }
    }

    const yearlyBreakdownMeta = Object.keys(yearlyBreakdown).reduce((acc, platform) => {
      const current = Number.isFinite(Number(yearlyBreakdown[platform])) ? Number(yearlyBreakdown[platform]) : 0;
      const prev = Number.isFinite(Number(previousYearBreakdown[platform])) ? Number(previousYearBreakdown[platform]) : 0;
      let direction = 'same';
      if (current > prev) direction = 'up';
      else if (current < prev) direction = 'down';
      const changePercent = prev ? ((current - prev) / prev) * 100 : null;
      acc[platform] = { direction, changePercent };
      return acc;
    }, {});

    const monthlyBreakdownMeta = Object.keys(monthlyBreakdown).reduce((acc, platform) => {
      const current = Number.isFinite(Number(monthlyBreakdown[platform])) ? Number(monthlyBreakdown[platform]) : 0;
      const prev = Number.isFinite(Number(previousMonthBreakdown[platform])) ? Number(previousMonthBreakdown[platform]) : 0;
      let direction = 'same';
      if (current > prev) direction = 'up';
      else if (current < prev) direction = 'down';
      const changePercent = prev ? ((current - prev) / prev) * 100 : null;
      acc[platform] = { direction, changePercent };
      return acc;
    }, {});

    return {
      rowCount: safeUsageData.length,
      totalUsage,
      monthlyUsage,
      activeClients,
      activeUsers,
      columnCount: new Set(safeUsageData.flatMap((row) => Object.keys(row))).size,
      yearlyUsage,
      yearlyUsagePercentage,
      monthlyUsagePercentage,
      newClients,
      newUsers,
      yearlyBreakdown,
      yearlyBreakdownMeta,
      monthlyBreakdown,
      monthlyBreakdownMeta,
      yearlyBreakdownTotal,
      monthlyBreakdownTotal,
      activeClientsBreakdown,
      activeUsersBreakdown,
    };
  }, [usageData, yearUsageRows, yearUsageSummary]);

  const tableNavigationState = dateRange.startDate && dateRange.endDate
    ? { dateRange }
    : undefined;

  const handleDateChange = (event) => {
    const { name, value } = event.target;
    setDateRange((current) => {
      const updatedRange = {
        ...current,
        [name]: value,
      };

      saveDateRange(updatedRange);
      return updatedRange;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    saveDateRange(dateRange);
    loadUsageData(dateRange, true);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-content">
        <Header
          actions={(
            <DateRangeFilter
              dateRange={dateRange}
              loading={loading}
              onDateChange={handleDateChange}
              onSubmit={handleSubmit}
            />
          )}
        />

        {error && <div className="dashboard-error">{error}</div>}

        <div className="stats-grid">
          <StatsCard
            title="Yearly"
            value={loading ? '...' : formatNumber(stats.yearlyUsage)}
            link="/tables"
            navigationState={tableNavigationState}
            icon={BarChart3}
            color="#2563eb"
            trendPositive={!loading && stats.yearlyUsagePercentage >= 0}
            trendText={!loading ? `${stats.yearlyUsagePercentage}% than last year` : ''}
            tooltipContent={(
              <div className="stats-card__breakdown">
                <div className="stats-card__breakdown-item">
                  <span>ACA</span>
                  <strong className="breakdown-value">
                    {formatNumber(stats.yearlyBreakdown?.ACA || 0)}
                    {' '}
                    ({formatPercent(((stats.yearlyBreakdown?.ACA || 0) / stats.yearlyBreakdownTotal) * 100)})
                    {stats.yearlyBreakdownMeta?.ACA && (
                      stats.yearlyBreakdownMeta.ACA.direction === 'up' ? (
                        <ArrowUp className="trend-icon trend-up" />
                      ) : stats.yearlyBreakdownMeta.ACA.direction === 'down' ? (
                        <ArrowDown className="trend-icon trend-down" />
                      ) : null
                    )}
                  </strong>
                </div>
                <div className="stats-card__breakdown-item">
                  <span>AMP</span>
                  <strong className="breakdown-value">
                    {formatNumber(stats.yearlyBreakdown?.AMP || 0)}
                    {' '}
                    ({formatPercent(((stats.yearlyBreakdown?.AMP || 0) / stats.yearlyBreakdownTotal) * 100)})
                    {stats.yearlyBreakdownMeta?.AMP && (
                      stats.yearlyBreakdownMeta.AMP.direction === 'up' ? (
                        <ArrowUp className="trend-icon trend-up" />
                      ) : stats.yearlyBreakdownMeta.AMP.direction === 'down' ? (
                        <ArrowDown className="trend-icon trend-down" />
                      ) : null
                    )}
                  </strong>
                </div>
                {Object.entries(stats.yearlyBreakdown).length === 0 && (
                  <div className="stats-card__breakdown-item">
                    <span>No yearly breakdown available</span>
                  </div>
                )}
              </div>
            )}
          />
          <StatsCard
            title="Monthly"
            value={loading ? '...' : formatNumber(stats.monthlyUsage)}
            link={null}
            icon={BarChart3}
            color="#2563eb"
            trendPositive={!loading && stats.monthlyUsagePercentage >= 0}
            trendText={!loading ? `${stats.monthlyUsagePercentage}% than last month` : ''}
            tooltipContent={(
              <div className="stats-card__breakdown">
                <div className="stats-card__breakdown-item">
                  <span>ACA</span>
                  <strong className="breakdown-value">
                    {formatNumber(stats.monthlyBreakdown?.ACA || 0)}
                    {' '}
                    ({formatPercent(((stats.monthlyBreakdown?.ACA || 0) / stats.monthlyBreakdownTotal) * 100)})
                    {stats.monthlyBreakdownMeta?.ACA && (
                      stats.monthlyBreakdownMeta.ACA.direction === 'up' ? (
                        <ArrowUp className="trend-icon trend-up" />
                      ) : stats.monthlyBreakdownMeta.ACA.direction === 'down' ? (
                        <ArrowDown className="trend-icon trend-down" />
                      ) : null
                    )}
                  </strong>
                </div>
                <div className="stats-card__breakdown-item">
                  <span>AMP</span>
                  <strong className="breakdown-value">
                    {formatNumber(stats.monthlyBreakdown?.AMP || 0)}
                    {' '}
                    ({formatPercent(((stats.monthlyBreakdown?.AMP || 0) / stats.monthlyBreakdownTotal) * 100)})
                    {stats.monthlyBreakdownMeta?.AMP && (
                      stats.monthlyBreakdownMeta.AMP.direction === 'up' ? (
                        <ArrowUp className="trend-icon trend-up" />
                      ) : stats.monthlyBreakdownMeta.AMP.direction === 'down' ? (
                        <ArrowDown className="trend-icon trend-down" />
                      ) : null
                    )}
                  </strong>
                </div>
                {Object.entries(stats.monthlyBreakdown).length === 0 && (
                  <div className="stats-card__breakdown-item">
                    <span>No monthly breakdown available</span>
                  </div>
                )}
              </div>
            )}
          />
          <StatsCard
            title="Active Clients"
            value={loading ? '...' : formatNumber(stats.activeClients)}
            link={null}
            icon={Building}
            color="#16a34a"
            trendText={loading ? '...' : (stats.newClients ? `${formatNumber(stats.newClients)} new clients` : 'Clients Count')}
            tooltipContent={(
              <div className="stats-card__breakdown">
                <div className="stats-card__breakdown-item">
                  <span>ACA</span>
                  <strong>{formatNumber(stats.activeClientsBreakdown?.ACA || 0)}</strong>
                </div>
                <div className="stats-card__breakdown-item">
                  <span>AMP</span>
                  <strong>{formatNumber(stats.activeClientsBreakdown?.AMP || 0)}</strong>
                </div>
                {Object.entries(stats.activeClientsBreakdown).length === 0 && (
                  <div className="stats-card__breakdown-item">
                    <span>No active client breakdown available</span>
                  </div>
                )}
              </div>
            )}
          />
          <StatsCard
            title="Active Users"
            value={loading ? '...' : formatNumber(stats.activeUsers)}
            link={null}
            icon={Users}
            color="#db2777"
            trendText={loading ? '...' : (stats.newUsers ? `${formatNumber(stats.newUsers)} new users` : 'Just updated')}
            tooltipContent={(
              <div className="stats-card__breakdown">
                <div className="stats-card__breakdown-item">
                  <span>ACA</span>
                  <strong>{formatNumber(stats.activeUsersBreakdown?.ACA || 0)}</strong>
                </div>
                <div className="stats-card__breakdown-item">
                  <span>AMP</span>
                  <strong>{formatNumber(stats.activeUsersBreakdown?.AMP || 0)}</strong>
                </div>
                {Object.entries(stats.activeUsersBreakdown).length === 0 && (
                  <div className="stats-card__breakdown-item">
                    <span>No active user breakdown available</span>
                  </div>
                )}
              </div>
            )}
          />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
