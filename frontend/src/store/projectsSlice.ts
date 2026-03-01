import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Project } from '../types';
import * as api from '../api';

interface ProjectsState {
  items: Project[];
  loading: boolean;
  error: string | null;
}

const initialState: ProjectsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async () => {
    return await api.getProjects();
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (data: { name: string; totalHours: number; importance: number }) => {
    return await api.createProject(data);
  }
);

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ id, data }: { id: string; data: Partial<Project> }) => {
    return await api.updateProject(id, data);
  }
);

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (id: string) => {
    await api.deleteProject(id);
    return id;
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    updateProjectLocally: (state, action: PayloadAction<Project>) => {
      const index = state.items.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch projects';
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.items = state.items.filter(p => p.id !== action.payload);
      });
  },
});

export const { updateProjectLocally } = projectsSlice.actions;
export default projectsSlice.reducer;
