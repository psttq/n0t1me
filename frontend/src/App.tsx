import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { fetchSettings } from './store/settingsSlice';
import { fetchProjects } from './store/projectsSlice';
import { ThemeProvider } from './hooks/useTheme';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ProjectFormPage from './pages/ProjectFormPage';
import TimerPage from './pages/TimerPage';
import SettingsPage from './pages/SettingsPage';
import DashboardPage from './pages/DashboardPage';

const AppContent: React.FC = () => {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  useEffect(() => {
    store.dispatch(fetchSettings());
    store.dispatch(fetchProjects());
  }, []);

  // Subscribe to timer state changes
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      setIsTimerRunning(state.timer.isRunning);
    });
    return unsubscribe;
  }, []);

  return (
    <BrowserRouter>
      <Layout isTimerActive={isTimerRunning}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/project/new" element={<ProjectFormPage />} />
          <Route path="/project/:id" element={<ProjectFormPage />} />
          <Route path="/timer" element={<TimerPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </Provider>
  );
};

export default App;
