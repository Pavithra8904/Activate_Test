import { createSlice } from '@reduxjs/toolkit';

const dashboardSlice = createSlice({
  name: 'dashboard',

  initialState: {
    loading: false,
    stats: [],
    error: null
  },

  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setStats: (state, action) => {
      state.stats = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const {
  setLoading,
  setStats,
  setError
} = dashboardSlice.actions;

export default dashboardSlice.reducer;