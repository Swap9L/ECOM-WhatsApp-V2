import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

type User = {
  id: number;
  username: string;
  isAdmin: boolean;
  twoFactorEnabled?: boolean;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async (): Promise<boolean> => {
    try {
      const response = await apiRequest("GET", "/api/user");
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          return true;
        } else {
          setUser(null);
        }
      }
      return false;
    } catch (error) {
      console.error("Auth check error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await apiRequest("POST", "/api/login", { username, password });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiRequest("POST", "/api/logout");
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Check authentication status on load
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}