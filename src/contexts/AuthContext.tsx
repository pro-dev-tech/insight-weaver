import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";
import { mapUser } from "@/types";

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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch or create the users row for the current auth user
  const fetchOrCreateProfile = useCallback(async (authUserId: string) => {
    // Check if profile exists
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (data) return mapUser(data);

    // Profile doesn't exist — create it from auth metadata
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const meta = authUser?.user_metadata || {};

    const { data: newProfile, error: insertError } = await supabase
      .from("users")
      .insert({
        auth_user_id: authUserId,
        business_name: meta.companyName || "My Business",
        owner_name: meta.name || "",
        phone: meta.phone || "",
        business_email: authUser?.email || "",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating profile:", insertError);
      return null;
    }
    return newProfile ? mapUser(newProfile) : null;
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchOrCreateProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchOrCreateProfile(session.user.id);
        setUser(profile);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchOrCreateProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("Registration failed");

    // 2. Create users row
    const { error: profileError } = await supabase.from("users").insert({
      auth_user_id: authData.user.id,
      business_name: data.companyName,
      owner_name: data.name,
      phone: data.phone,
      business_email: data.email,
    });
    if (profileError) throw new Error(profileError.message);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
