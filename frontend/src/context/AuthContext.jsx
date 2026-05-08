import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem("token");
        if (savedToken) {
          // Try to get user with saved token
          const response = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${savedToken}` }
          });
          setUser(response.data);
          setToken(savedToken);
        }
      } catch (error) {
        // Token invalid, clear it
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const response = await axios.post(
      `${API}/auth/login`, 
      { email, password }
    );
    const { token, user: userData } = response.data;
    
    // Store token in localStorage for cross-domain compatibility
    localStorage.setItem("token", token);
    setToken(token);
    setUser(userData);
    return userData;
  };

  const register = async (email, password, name, role) => {
    const response = await axios.post(
      `${API}/auth/register`, 
      { email, password, name, role }
    );
    const { token, user: userData } = response.data;
    
    // Store token in localStorage
    localStorage.setItem("token", token);
    setToken(token);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      // Call logout endpoint (clears cookie if any)
      await axios.post(`${API}/auth/logout`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch (error) {
      // Silently fail
    } finally {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        const response = await axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${savedToken}` }
        });
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token,
      loading, 
      login, 
      register, 
      logout, 
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
