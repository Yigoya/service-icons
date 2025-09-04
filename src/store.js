// store.js
import { configureStore } from '@reduxjs/toolkit';
import { thunk } from 'redux-thunk';

const initialState = {
  token: localStorage.getItem('token') || null,
  agencyId: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

// Create a slice instead of a traditional reducer
import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginRequest(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action) {
      state.token = action.payload.token;
      state.agencyId = action.payload.agencyId;
      state.isAuthenticated = true;
      state.loading = false;
      localStorage.setItem('token', action.payload.token);
    },
    loginFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    logout(state) {
      state.token = null;
      state.agencyId = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('token');
    }
  }
});

export const { loginRequest, loginSuccess, loginFailure, logout } = authSlice.actions;

export const store = configureStore({
  reducer: authSlice.reducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(thunk),
});