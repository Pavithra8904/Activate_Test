import { useState } from 'react';
import './Reports.scss';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const fullData = [
  { month: 'Jan', year: 2023, usage: 400 },
  { month: 'Feb', year: 2023, usage: 600 },
  { month: 'Mar', year: 2023, usage: 1000 },
  { month: 'Apr', year: 2023, usage: 800 },
  { month: 'May', year: 2023, usage: 1200 },
  { month: 'Jun', year: 2023, usage: 900 },
  { month: 'Jul', year: 2023, usage: 1100 },
  { month: 'Aug', year: 2023, usage: 1300 },
  { month: 'Sep', year: 2023, usage: 1000 },
  { month: 'Oct', year: 2023, usage: 1400 },
  { month: 'Nov', year: 2023, usage: 1200 },
  { month: 'Dec', year: 2023, usage: 1500 },
  { month: 'Jan', year: 2024, usage: 500 },
  { month: 'Feb', year: 2024, usage: 700 },
  { month: 'Mar', year: 2024, usage: 1100 },
  { month: 'Apr', year: 2024, usage: 900 },
  { month: 'May', year: 2024, usage: 1300 },
  { month: 'Jun', year: 2024, usage: 1000 },
  { month: 'Jul', year: 2024, usage: 1200 },
  { month: 'Aug', year: 2024, usage: 1400 },
  { month: 'Sep', year: 2024, usage: 1100 },
  { month: 'Oct', year: 2024, usage: 1500 },
  { month: 'Nov', year: 2024, usage: 1300 },
  { month: 'Dec', year: 2024, usage: 1600 },
];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const years = [2023, 2024];

const Reports = () => {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedMonths, setSelectedMonths] = useState(months);
  const [showFilter, setShowFilter] = useState(false);

  const filteredData = fullData.filter(item => 
    item.year === selectedYear && selectedMonths.includes(item.month)
  );

  const handleMonthChange = (month) => {
    if (selectedMonths.includes(month)) {
      setSelectedMonths(selectedMonths.filter(m => m !== month));
    } else {
      setSelectedMonths([...selectedMonths, month]);
    }
  };

  return (
    <div className="reports-page">
      <h1>Usage Reports</h1>

      <div className="filter-section">
        <button className="filter-button" onClick={() => setShowFilter(!showFilter)}>
          Filter by Month & Year
        </button>
        {showFilter && (
          <div className="filter-dropdown">
            <div className="filter-group">
              <label>Year:</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Months:</label>
              <div className="month-checkboxes">
                {months.map(month => (
                  <label key={month}>
                    <input
                      type="checkbox"
                      checked={selectedMonths.includes(month)}
                      onChange={() => handleMonthChange(month)}
                    />
                    {month}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="usage"
              stroke="#8884d8"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Reports;