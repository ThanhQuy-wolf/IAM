import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  isLoading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isLoading: false };
    case 'LOGOUT':
      return { ...state, user: null, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = useCallback((user, accessToken) => {
    window.__accessToken = accessToken;
    dispatch({ type: 'SET_USER', payload: user });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      window.__accessToken = null;
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  // Call once on app mount to restore session via refresh token cookie
  const restoreSession = useCallback(async () => {
    try {
      const { data } = await api.post('/auth/refresh');
      window.__accessToken = data.accessToken;
      const me = await api.get('/auth/me');
      dispatch({ type: 'SET_USER', payload: me.data });
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, restoreSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
