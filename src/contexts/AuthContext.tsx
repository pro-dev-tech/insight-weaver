import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  companyLocation: string;
  cinNumber?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Demo user for development
const DEMO_USER: User = {
  id: "demo-1",
  name: "Rajesh Kumar",
  email: "rajesh@example.com",
  phone: "+919876543210",
  companyName: "Kumar Enterprises",
  companyLocation: "Mumbai, Maharashtra",
  cinNumber: "U12345MH2020PTC123456",
  role: "admin",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("payrecovery_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (email: string, _password: string) => {
    // Demo auth — accepts any credentials
    const u = { ...DEMO_USER, email };
    localStorage.setItem("payrecovery_user", JSON.stringify(u));
    setUser(u);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const u: User = {
      id: `user-${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      companyName: data.companyName,
      companyLocation: data.companyLocation,
      cinNumber: data.cinNumber,
      role: "admin",
    };
    localStorage.setItem("payrecovery_user", JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("payrecovery_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
