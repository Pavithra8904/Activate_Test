import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, Search, X } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  Legend,
} from 'recharts';
import Header from '../../components/Header/Header';
import Sidebar from '../../components/Sidebar/Sidebar';
import DateRangeFilter from '../../components/DateRangeFilter/DateRangeFilter';
import { getUsageConfig, getUsageData } from '../../services/usageService';
import { fallbackDateRange, resolveDateRange, saveDateRange } from '../../utils/usageDateRange';
import './Tables.scss';

const optionLimit = 200;
const CHART_TYPES = [
  { key: 'bar', label: 'Bar Chart' },
  { key: 'line', label: 'Line Chart' },
  { key: 'area', label: 'Area Chart' },
  { key: 'pie', label: 'Pie Chart' },
];
const PIE_COLORS = ['#2f80ed', '#10b981', '#f97316', '#ec4899', '#6366f1'];

const formatCellValue = (column, value) => {
  if (value === null || value === undefined) {
    return '';
  }

  if (column === 'Date' && typeof value === 'string') {
    const dateMatch = value.match(/^\d{4}-\d{2}-\d{2}/);
    if (dateMatch) {
      return dateMatch[0];
    }

    const date = new Date(value);
    if (!Number.isNaN(date.valueOf())) {
      return date.toISOString().slice(0, 10);
    }
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};

const getColumns = (rows) => {
  const columns = new Set();
  rows.forEach((row) => {
    Object.keys(row).forEach((column) => columns.add(column));
  });
  return Array.from(columns);
};

const getColumnOptions = (rows, columns) => columns.reduce((options, column) => {
  if (column === 'Date') {
    options[column] = [];
    return options;
  }

  const values = rows.map((row) => formatCellValue(column, row[column]));
  options[column] = Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return options;
}, {});

const rowMatchesFilters = (row, columns, selectedFilters, ignoredColumn = '') => columns.every((column) => {
  if (column === ignoredColumn) {
    return true;
  }

  const selectedValues = selectedFilters[column] || [];
  if (!selectedValues.length) {
    return true;
  }

  return selectedValues.includes(formatCellValue(column, row[column]));
});

const Tables = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasLoadedRef = useRef(false);
  const [dateRange, setDateRange] = useState({
    ...fallbackDateRange,
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openFilter, setOpenFilter] = useState('');
  const [filterSearch, setFilterSearch] = useState({});
  const [selectedFilters, setSelectedFilters] = useState({});
  const [pendingFilters, setPendingFilters] = useState({});
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectedChartType, setSelectedChartType] = useState('bar');

  const chartMode = useMemo(
    () => new URLSearchParams(location.search).get('createChart') === 'true',
    [location.search],
  );

  useEffect(() => {
    if (!chartMode) {
      setSelectedColumns([]);
      setSelectedChartType('bar');
    }
  }, [chartMode]);

  const columns = useMemo(() => getColumns(rows), [rows]);
  const columnOptions = useMemo(() => columns.reduce((options, column) => {
    const rowsForColumn = rows.filter((row) => rowMatchesFilters(row, columns, selectedFilters, column));
    return {
      ...options,
      ...getColumnOptions(rowsForColumn, [column]),
    };
  }, {}), [rows, columns, selectedFilters]);

  const filteredRows = useMemo(
    () => rows.filter((row) => rowMatchesFilters(row, columns, selectedFilters)),
    [rows, columns, selectedFilters]
  );

  const loadRows = async (range, forceRefresh = false) => {
    setLoading(true);
    setError('');
    setOpenFilter('');

    try {
      const response = await getUsageData({
        ...range,
        forceRefresh,
      });

      const data = Array.isArray(response) ? response : (response?.data || []);
      setRows(Array.isArray(data) ? data : []);
      setSelectedFilters({});
      setPendingFilters({});
      setFilterSearch({});
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load usage records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;

    const loadInitialRows = async () => {
      const navigationDateRange = location.state?.dateRange;
      let initialRange = fallbackDateRange;

      if (navigationDateRange?.startDate && navigationDateRange?.endDate) {
        initialRange = resolveDateRange(null, navigationDateRange);
      } else {
        try {
          const config = await getUsageConfig();
          initialRange = resolveDateRange(config, navigationDateRange);
        } catch (err) {
          initialRange = resolveDateRange(null, navigationDateRange);
        }
      }

      setDateRange(initialRange);
      await loadRows(initialRange);
    };

    loadInitialRows();
  }, []);

  const handleBackClick = () => navigate(-1);

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
    loadRows(dateRange, true);
  };

  const handleSearchChange = (column, value) => {
    setFilterSearch((current) => ({
      ...current,
      [column]: value,
    }));
  };

  const toggleFilterValue = (column, value) => {
    setPendingFilters((current) => {
      const selected = new Set(current[column] || []);

      if (selected.has(value)) {
        selected.delete(value);
      } else {
        selected.add(value);
      }

      return {
        ...current,
        [column]: Array.from(selected),
      };
    });
  };

  const applyColumnFilter = (column) => {
    setSelectedFilters((current) => ({
      ...current,
      [column]: pendingFilters[column] || [],
    }));
    setOpenFilter('');
  };

  const clearColumnFilter = (column) => {
    setPendingFilters((current) => ({
      ...current,
      [column]: [],
    }));
    setFilterSearch((current) => ({
      ...current,
      [column]: '',
    }));
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
    setPendingFilters({});
    setFilterSearch({});
    setOpenFilter('');
  };

  const getVisibleOptions = (column) => {
    const search = (filterSearch[column] || '').trim().toLowerCase();
    const options = columnOptions[column] || [];

    return options
      .filter((value) => value.toLowerCase().includes(search))
      .slice(0, optionLimit);
  };

  const toggleChartColumn = (column) => {
    setSelectedColumns((current) => {
      const selected = new Set(current);
      if (selected.has(column)) {
        selected.delete(column);
      } else if (selected.size < 2) {
        selected.add(column);
      }
      return Array.from(selected);
    });
  };

  const chartData = useMemo(() => {
    if (!chartMode || !selectedColumns.length) {
      return [];
    }

    const rowsForChart = filteredRows.length ? filteredRows : rows;
    if (!rowsForChart.length) {
      return [];
    }

    if (selectedColumns.length === 1) {
      const [column] = selectedColumns;
      if (selectedChartType !== 'pie') {
        return [];
      }

      const counts = {};
      rowsForChart.forEach((row) => {
        const name = formatCellValue(column, row[column]) || '(Blank)';
        counts[name] = (counts[name] || 0) + 1;
      });

      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }

    const [categoryColumn, valueColumn] = selectedColumns;

    if (selectedChartType === 'pie') {
      const totals = {};
      rowsForChart.forEach((row) => {
        const name = formatCellValue(categoryColumn, row[categoryColumn]) || '(Blank)';
        const value = Number(row[valueColumn]);
        totals[name] = (totals[name] || 0) + (Number.isFinite(value) ? value : 0);
      });

      return Object.entries(totals).map(([name, value]) => ({ name, value }));
    }

    return rowsForChart.map((row, index) => ({
      [categoryColumn]: formatCellValue(categoryColumn, row[categoryColumn]) || `Row ${index + 1}`,
      [valueColumn]: Number(row[valueColumn]) || 0,
      __id: `${index}-${categoryColumn}-${valueColumn}`,
    }));
  }, [chartMode, filteredRows, rows, selectedChartType, selectedColumns]);

  const renderChartPreview = () => {
    if (!selectedColumns.length) {
      return <div className="chart-creator-panel__empty">Select one or two columns to begin.</div>;
    }

    if (selectedColumns.length === 1 && selectedChartType !== 'pie') {
      return <div className="chart-creator-panel__empty">Choose a second column for this chart type.</div>;
    }

    if (!chartData.length) {
      return <div className="chart-creator-panel__empty">No chart data is available for the selected columns.</div>;
    }

    const [categoryColumn, valueColumn] = selectedColumns;

    switch (selectedChartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={categoryColumn} />
              <YAxis />
              <RechartTooltip />
              <Legend />
              <Bar dataKey={valueColumn} fill="#2f80ed" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={categoryColumn} />
              <YAxis />
              <RechartTooltip />
              <Legend />
              <Line type="monotone" dataKey={valueColumn} stroke="#2f80ed" strokeWidth={3} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={categoryColumn} />
              <YAxis />
              <RechartTooltip />
              <Legend />
              <Area type="monotone" dataKey={valueColumn} stroke="#2f80ed" fill="#bfdbfe" />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                fill="#2f80ed"
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <RechartTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  const hasColumnFilters = Object.values(selectedFilters).some((values) => values?.length);

  return (
    <div className="tables-layout">
      <Sidebar />

      <div className="tables-content">
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

        <div className="tables-header">
          <button type="button" className="back-btn" onClick={handleBackClick}>
            <ArrowLeft size={16} />
            Back
          </button>
          <div>
            <h1>{chartMode ? 'Create Chart' : 'Grid View'}</h1>
            <p>
              {chartMode
                ? 'Choose columns and chart type to generate a visualization.'
                : loading
                  ? 'Loading records'
                  : `${filteredRows.length.toLocaleString()} of ${rows.length.toLocaleString()} records`}
            </p>
          </div>
        </div>

        {error && <div className="tables-error">{error}</div>}

        <div className="tables-actions">
          <button type="button" className="report-view-btn" onClick={() => navigate('/dashboard')}>
            Report View
          </button>
          <button type="button" onClick={clearAllFilters} disabled={!hasColumnFilters}>
            Clear column filters
          </button>
          {!chartMode && (
            <button type="button" className="report-view-btn" onClick={() => navigate('/tables?createChart=true')}>
              Create Chart
            </button>
          )}
          {chartMode && (
            <button type="button" className="report-view-btn report-view-btn--secondary" onClick={() => navigate('/tables')}>
              Exit Chart Creator
            </button>
          )}
        </div>

        {chartMode && (
          <section className="chart-creator-panel">
            <div className="chart-creator-panel__header">
              <div>
                <h2>Chart Creator</h2>
                <p>Select one or two columns, then pick a chart type.</p>
              </div>
              <div className="chart-creator-panel__summary">
                <span>{selectedColumns.length} column(s) selected</span>
                <span>{CHART_TYPES.find((chart) => chart.key === selectedChartType)?.label}</span>
              </div>
            </div>

            <div className="chart-creator-panel__section">
              <div className="chart-creator-panel__section-title">Pick columns</div>
              <div className="chart-creator-panel__columns">
                {columns.map((column) => (
                  <button
                    key={column}
                    type="button"
                    className={`chart-creator-panel__column ${selectedColumns.includes(column) ? 'selected' : ''}`}
                    onClick={() => toggleChartColumn(column)}
                  >
                    <span>{column}</span>
                    {selectedColumns.includes(column) && <strong>Selected</strong>}
                  </button>
                ))}
              </div>
              <p className="chart-creator-panel__hint">You can select up to 2 columns. For line/bar/area charts, choose a category and a numeric column.</p>
            </div>

            <div className="chart-creator-panel__section">
              <div className="chart-creator-panel__section-title">Pick chart type</div>
              <div className="chart-creator-panel__chart-types">
                {CHART_TYPES.map((chart) => (
                  <button
                    key={chart.key}
                    type="button"
                    className={`chart-creator-panel__type-btn ${selectedChartType === chart.key ? 'active' : ''}`}
                    onClick={() => setSelectedChartType(chart.key)}
                  >
                    {chart.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="chart-creator-panel__section chart-creator-panel__preview">
              {renderChartPreview()}
            </div>
          </section>
        )}

        <div className={`usage-table-wrap${loading ? ' loading' : ''}`}>
          {loading && (
            <div className="usage-table__loading-overlay">
              <button type="button" className="usage-table__loading-button" disabled>
                Fetching data…
              </button>
            </div>
          )}

          <table className="usage-table">
            <thead>
              <tr>
                {columns.map((column) => {
                  const selectedCount = selectedFilters[column]?.length || 0;
                  const visibleOptions = getVisibleOptions(column);
                  const isDateColumn = column === 'Date';

                  return (
                    <th key={column}>
                      <div className="usage-table__column-head">
                        <span title={column}>{column}</span>
                        {!isDateColumn && (
                          <button
                            type="button"
                            className={`usage-table__filter-btn ${selectedCount ? 'active' : ''}`}
                            onClick={() => {
                              if (openFilter === column) {
                                setOpenFilter('');
                              } else {
                                setPendingFilters((current) => ({
                                  ...current,
                                  [column]: selectedFilters[column] || [],
                                }));
                                setOpenFilter(column);
                              }
                            }}
                            aria-label={`Filter ${column}`}
                          >
                            <Filter size={14} />
                            {selectedCount > 0 && <strong>{selectedCount}</strong>}
                          </button>
                        )}
                      </div>

                      {openFilter === column && !isDateColumn && (
                        <div className="column-filter">
                          <div className="column-filter__search">
                            <Search size={14} />
                            <input
                              type="search"
                              value={filterSearch[column] || ''}
                              onChange={(event) => handleSearchChange(column, event.target.value)}
                              placeholder="Search options"
                            />
                          </div>

                          <div className="column-filter__options">
                            {visibleOptions.length > 0 ? (
                              visibleOptions.map((value) => (
                                <label key={value || '__blank__'}>
                                  <input
                                    type="checkbox"
                                    checked={(pendingFilters[column] || []).includes(value)}
                                    onChange={() => toggleFilterValue(column, value)}
                                  />
                                  <span title={value}>{value || '(Blank)'}</span>
                                </label>
                              ))
                            ) : (
                              <p>No options found</p>
                            )}
                          </div>

                          {(columnOptions[column]?.length || 0) > optionLimit && (
                            <p className="column-filter__hint">Showing first {optionLimit} matches</p>
                          )}

                          <div className="column-filter__footer">
                            <button type="button" onClick={() => clearColumnFilter(column)}>
                              <X size={14} />
                              Clear
                            </button>
                            <button type="button" className="column-filter__apply" onClick={() => applyColumnFilter(column)}>
                              Apply
                            </button>
                          </div>
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length || 1}>Loading records...</td>
                </tr>
              ) : filteredRows.length > 0 ? (
                filteredRows.map((row, rowIndex) => (
                  <tr key={`${rowIndex}-${columns.map((column) => formatCellValue(column, row[column])).join('-')}`}>
                    {columns.map((column) => {
                      const value = formatCellValue(column, row[column]);
                      return (
                        <td key={column} title={value}>
                          {value || '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length || 1}>No records found for this date range or filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Tables;
