/* eslint-disable react-refresh/only-export-components */
// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { loginUser, logoutUser, getProfile } from "../services/auth/authService"; // adjust path

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await getProfile();
        if (res.success) setUser(res.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    await loginUser(email, password); // cookie is set automatically
    const res = await getProfile(); // fetch user data
    if (res.success) setUser(res.data);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      console.log("something bad happened");
    } // ignore error
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
