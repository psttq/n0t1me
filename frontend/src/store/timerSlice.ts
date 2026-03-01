import { createSlice } from '@reduxjs/toolkit';

interface TimerState {
  isRunning: boolean;
}

const initialState: TimerState = {
  isRunning: false,
};

const timerSlice = createSlice({
  name: 'timer',
  initialState,
  reducers: {
    setTimerRunning: (state, action) => {
      state.isRunning = action.payload;
    },
  },
});

export const { setTimerRunning } = timerSlice.actions;
export default timerSlice.reducer;
