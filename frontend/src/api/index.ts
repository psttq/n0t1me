import axios from 'axios';
import { Project, Settings, TimeEntry, Statistics } from '../types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Projects
export const getProjects = (includeCompleted = false): Promise<Project[]> =>
  api.get(`/projects?includeCompleted=${includeCompleted}`).then(res => res.data);

export const getProject = (id: string): Promise<Project> =>
  api.get(`/projects/${id}`).then(res => res.data);

export const createProject = (data: { name: string; totalHours: number; importance: number }): Promise<Project> =>
  api.post('/projects', data).then(res => res.data);

export const updateProject = (id: string, data: Partial<Project>): Promise<Project> =>
  api.put(`/projects/${id}`, data).then(res => res.data);

export const deleteProject = (id: string): Promise<void> =>
  api.delete(`/projects/${id}`).then(res => res.data);

export const completeProject = (id: string): Promise<Project> =>
  api.patch(`/projects/${id}/complete`).then(res => res.data);

// Settings
export const getSettings = (): Promise<Settings> =>
  api.get('/settings').then(res => res.data);

export const updateSettings = (data: Partial<Settings>): Promise<Settings> =>
  api.put('/settings', data).then(res => res.data);

// Time Entries
export const getTimeEntries = (params?: { projectId?: string; startDate?: string; endDate?: string }): Promise<TimeEntry[]> =>
  api.get('/time-entries', { params }).then(res => res.data);

export const createTimeEntry = (data: { projectId: string; duration: number; notes?: string }): Promise<TimeEntry> =>
  api.post('/time-entries', data).then(res => res.data);

export const deleteTimeEntry = (id: string): Promise<void> =>
  api.delete(`/time-entries/${id}`).then(res => res.data);

// Statistics
export const getStatistics = (): Promise<Statistics> =>
  api.get('/statistics').then(res => res.data);

export default api;
