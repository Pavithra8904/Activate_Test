export const fallbackDateRange = {
  startDate: '2026-01-01',
  endDate: '2026-01-15',
};

const selectedDateRangeKey = 'activateUsageDateRange';

const isValidRange = (range) => Boolean(range?.startDate && range?.endDate);

export const getStoredDateRange = () => {
  try {
    const storedRange = sessionStorage.getItem(selectedDateRangeKey);
    return storedRange ? JSON.parse(storedRange) : null;
  } catch (error) {
    return null;
  }
};

export const saveDateRange = (range) => {
  if (!isValidRange(range)) {
    return;
  }

  try {
    sessionStorage.setItem(selectedDateRangeKey, JSON.stringify({
      startDate: range.startDate,
      endDate: range.endDate,
    }));
  } catch (error) {
    // Ignore storage errors so the filter still works in restricted browsers.
  }
};

export const resolveDateRange = (config, preferredRange = {}) => {
  const storedRange = getStoredDateRange();

  return {
    startDate: preferredRange?.startDate || storedRange?.startDate || config?.defaultStartDate || fallbackDateRange.startDate,
    endDate: preferredRange?.endDate || storedRange?.endDate || config?.defaultEndDate || fallbackDateRange.endDate,
  };
};
