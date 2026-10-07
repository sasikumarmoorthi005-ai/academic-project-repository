import { createContext, useContext, useEffect, useState } from 'react';
import api, { errMsg } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pv_user'));
    } catch {
      return null;
    }
  });
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authRetry, setAuthRetry] = useState(0);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      const token = localStorage.getItem('pv_token');
      if (!token) {
        localStorage.removeItem('pv_user');
        if (active) {
          setUser(null);
          setAuthError('');
          setAuthReady(true);
        }
        return;
      }

      if (active) {
        setAuthReady(false);
        setAuthError('');
      }

      try {
        const { data } = await api.get('/auth/me');
        if (active) {
          localStorage.setItem('pv_user', JSON.stringify(data));
          setUser(data);
        }
      } catch (err) {
        if (active && err.response?.status === 401) {
          localStorage.removeItem('pv_token');
          localStorage.removeItem('pv_user');
          setUser(null);
        } else if (active) {
          setAuthError(`Could not verify your sign-in: ${errMsg(err)}`);
        }
      } finally {
        if (active) setAuthReady(true);
      }
    }

    verifySession();
    return () => { active = false; };
  }, [authRetry]);

  function save(data) {
    const { token, ...profile } = data;
    localStorage.setItem('pv_token', token);
    localStorage.setItem('pv_user', JSON.stringify(profile));
    setUser(profile);
    return profile;
  }

  /** expectedRole is the tab chosen on the login screen (STUDENT or ADMIN). */
  async function login(email, password, expectedRole) {
    const { data } = await api.post('/auth/login', { email, password });
    if (expectedRole && data.role !== expectedRole) {
      throw new Error(
        expectedRole === 'ADMIN'
          ? 'This account is not an admin account. Use the Student tab.'
          : 'This is an admin account. Use the Admin tab.'
      );
    }
    return save(data);
  }

  async function register(name, email, dateOfBirth, password, department) {
    const { data } = await api.post('/auth/register', { name, email, dateOfBirth, password, department });
    return save(data);
  }

  function logout() {
    localStorage.removeItem('pv_token');
    localStorage.removeItem('pv_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isAdmin: user?.role === 'ADMIN',
      authReady,
      authError,
      retryAuth: () => setAuthRetry((value) => value + 1),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
