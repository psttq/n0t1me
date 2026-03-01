import { configureStore } from '@reduxjs/toolkit';
import projectsReducer from './projectsSlice';
import settingsReducer from './settingsSlice';
import timerReducer from './timerSlice';

export const store = configureStore({
  reducer: {
    projects: projectsReducer,
    settings: settingsReducer,
    timer: timerReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
