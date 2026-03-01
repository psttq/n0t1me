import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Settings } from '../types';
import * as api from '../api';

interface SettingsState {
  data: Settings | null;
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async () => {
    return await api.getSettings();
  }
);

export const saveSettings = createAsyncThunk(
  'settings/saveSettings',
  async (data: Partial<Settings>) => {
    return await api.updateSettings(data);
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch settings';
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.data = action.payload;
      });
  },
});

export default settingsSlice.reducer;
