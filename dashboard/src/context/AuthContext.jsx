import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is logged in from localStorage and not expired (2h)
    const adminData = localStorage.getItem('adminData');
    if (adminData) {
      const parsed = JSON.parse(adminData);
      const now = Date.now();
      // 2 hours in ms = 2 * 60 * 60 * 1000 = 7200000
      if (
        parsed.username === 'abhijitshyamal005@gmail.com' &&
        parsed.loginTime &&
        now - parsed.loginTime < 7200000
      ) {
        setAdmin(parsed);
        setIsAuthenticated(true);
      } else {
        setAdmin(null);
        setIsAuthenticated(false);
        localStorage.removeItem('adminData');
      }
    } else {
      setAdmin(null);
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  const login = (adminData) => {
    // Always store the admin username in localStorage with loginTime
    const adminObj = {
      ...adminData,
      username: 'abhijitshyamal005@gmail.com',
      loginTime: Date.now(),
    };
    setAdmin(adminObj);
    setIsAuthenticated(true);
    localStorage.setItem('adminData', JSON.stringify(adminObj));
  };

  const logout = () => {
    setAdmin(null);
    setIsAuthenticated(false);
    localStorage.removeItem('adminData');
  };

  const value = {
    isAuthenticated,
    admin,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 