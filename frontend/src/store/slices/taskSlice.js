import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list: [],
  current: null,
  loading: false,
  error: null
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks: (state, action) => {
      state.list = action.payload;
    },
    setCurrentTask: (state, action) => {
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

export const { setTasks, setCurrentTask, setLoading, setError } = taskSlice.actions;
export default taskSlice.reducer;
