import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/axios';

// ============================================================
// ASYNC THUNKS
// ============================================================

// Customer Registration
export const registerCustomer = createAsyncThunk(
  'auth/registerCustomer',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Registration failed'
      );
    }
  }
);

// Vendor Registration
export const registerVendor = createAsyncThunk(
  'auth/registerVendor',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/vendor/register', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Registration failed'
      );
    }
  }
);

// Login (Customer & Vendor)
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Login failed'
      );
    }
  }
);

// Admin Login
export const loginAdmin = createAsyncThunk(
  'auth/loginAdmin',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/admin/login', credentials);
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Login failed'
      );
    }
  }
);

// Get Current User Profile
export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch profile'
      );
    }
  }
);

// Logout
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('token');
      return null;
    } catch (error) {
      // Even if API fails, clear local storage
      localStorage.removeItem('token');
      return null;
    }
  }
);

// ============================================================
// SLICE
// ============================================================

const initialState = {
  user: null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  message: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = null;
    },
    resetAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      state.message = null;
      localStorage.removeItem('token');
    },
  },
  extraReducers: (builder) => {
    builder
      // ---- REGISTER CUSTOMER ----
      .addCase(registerCustomer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerCustomer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.message = action.payload.message;
      })
      .addCase(registerCustomer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // ---- REGISTER VENDOR ----
      .addCase(registerVendor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerVendor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message;
        // Vendor NOT authenticated after registration (pending approval)
      })
      .addCase(registerVendor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // ---- LOGIN USER ----
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.message = action.payload.message;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // ---- LOGIN ADMIN ----
      .addCase(loginAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.message = action.payload.message;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // ---- GET ME ----
      .addCase(getMe.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(getMe.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        localStorage.removeItem('token');
      })
      // ---- LOGOUT ----
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.message = 'Logged out successfully.';
      });
  },
});

export const { clearError, clearMessage, resetAuth } = authSlice.actions;
export default authSlice.reducer;
