import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/endpoints';
import { tokenStore } from '../api/client';

const AuthContext = createContext(null);

// Read the JWT payload ({ id, role, email?, exp }) - no verification, display/route-guard only.
// The backend still verifies the token on every request.
function decodeJwt(token) {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(part))));
  } catch {
    return null;
  }
}

const isExpired = (payload) => !payload || (payload.exp && payload.exp * 1000 <= Date.now());

function loadSession() {
  const token = tokenStore.get();
  if (!token) return { token: null, user: null };
  const payload = decodeJwt(token);
  if (isExpired(payload) || (payload.role !== 'SuperAdmin' && payload.role !== 'junior_admin')) {
    tokenStore.clear();
    return { token: null, user: null };
  }
  const saved = tokenStore.getUser() || {};
  return { token, user: { ...saved, id: payload.id, role: payload.role } };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);
  const [notice, setNotice] = useState('');

  const logout = useCallback((message = '') => {
    tokenStore.clear();
    setSession({ token: null, user: null });
    setNotice(message);
  }, []);

  useEffect(() => {
    const onExpired = () => logout('Your session has expired. Please log in again.');
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [logout]);

  const login = useCallback(async (kind, email, password) => {
    const res = kind === 'super'
      ? await authApi.superAdminLogin(email, password)
      : await authApi.juniorAdminLogin(email, password);
    if (!res.success || !res.token) throw new Error(res.message || 'Login failed');
    const profile = res.Superadmin || res.JuniorAdmin || {};
    const payload = decodeJwt(res.token);
    const user = {
      id: payload ? payload.id : profile.id,
      role: payload ? payload.role : (kind === 'super' ? 'SuperAdmin' : 'junior_admin'),
      name: profile.name,
      email: profile.email,
    };
    tokenStore.set(res.token, user);
    setNotice('');
    setSession({ token: res.token, user });
    return user;
  }, []);

  const value = useMemo(() => ({
    token: session.token,
    user: session.user,
    isSuper: session.user?.role === 'SuperAdmin',
    isAuthenticated: Boolean(session.token),
    notice,
    login,
    logout,
  }), [session, notice, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
