// actions.js
import axios from 'axios';
import { loginRequest, loginSuccess, loginFailure, logout } from './store';

export const login = (email, password) => async (dispatch) => {
  try {
    dispatch(loginRequest());
    const response = await axios.post('/api/auth/agency/login', { email, password });
    const token = response.data;
    
    // Fetch agency profile to get agencyId
    const profileResponse = await axios.get('/api/agency/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    dispatch(loginSuccess({
      token,
      agencyId: profileResponse.data.id
    }));
  } catch (error) {
    dispatch(loginFailure(error.response?.data || 'Login failed'));
  }
};

export const logoutAction = () => (dispatch) => {
  dispatch(logout());
};