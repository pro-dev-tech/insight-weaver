import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  companyName: string;
  companyLocation: string;
  cinNumber?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Build our app User from the Supabase auth user (no profile table needed)
function buildUser(authUser: SupabaseAuthUser): User {
  const meta = authUser.user_metadata || {};
  return {
    id: authUser.id, // This is auth.users.id — matches user_id FK in all tables
    email: authUser.email || "",
    name: meta.name || meta.full_name || "",
    phone: meta.phone || "",
    companyName: meta.companyName || "",
    companyLocation: meta.companyLocation || "",
    cinNumber: meta.cinNumber || "",
    role: "admin",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    // Set up auth state listener FIRST
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(buildUser(session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    subscription = data.subscription;

    // Then check existing session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          setUser(buildUser(session.user));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("getSession error:", err);
        setLoading(false);
      });

    return () => subscription?.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          name: data.name,
          phone: data.phone,
          companyName: data.companyName,
          companyLocation: data.companyLocation,
          cinNumber: data.cinNumber,
        },
      },
    });
    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("Registration failed");
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    if (error) throw new Error(error.message);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, register, resendConfirmation, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
