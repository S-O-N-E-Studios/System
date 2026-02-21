import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list: [],
  current: null,
  loading: false,
  error: null
};

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects: (state, action) => {
      state.list = action.payload;
    },
    setCurrentProject: (state, action) => {
      state.current = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const { setProjects, setCurrentProject, setLoading, setError } = projectSlice.actions;
export default projectSlice.reducer;
