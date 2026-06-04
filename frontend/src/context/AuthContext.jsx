import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearToken,
  fetchProfileRequest,
  loginRequest,
  signupRequest,
} from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await fetchProfileRequest();
      setUser(profile);
    } catch {
      /* network / server error — keep session; user can retry */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email, password) => {
    const data = await loginRequest(email, password);
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    setUser(data.user ?? null);
    return data;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    return signupRequest(name, email, password);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      signup,
      logout,
      refreshUser,
    }),
    [user, loading, login, signup, logout, refreshUser],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
