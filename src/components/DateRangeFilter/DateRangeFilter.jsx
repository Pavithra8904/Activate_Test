import './DateRangeFilter.scss';

const DateRangeFilter = ({ dateRange, loading, onDateChange, onSubmit }) => {
  return (
    <form className="date-range-filter" onSubmit={onSubmit}>
      <label>
        <span>Start date</span>
        <input
          type="date"
          name="startDate"
          value={dateRange.startDate}
          onChange={onDateChange}
          required
        />
      </label>
      <label>
        <span>End date</span>
        <input
          type="date"
          name="endDate"
          value={dateRange.endDate}
          onChange={onDateChange}
          required
        />
      </label>
      <button type="submit" disabled={loading}>
        Apply
      </button>
    </form>
  );
};

export default DateRangeFilter;
