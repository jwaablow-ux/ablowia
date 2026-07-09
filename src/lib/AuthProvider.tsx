import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useLocation } from "react-router-dom";
import { supabase } from "./supabaseClient";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

/**
 * Revalida a sessão contra o servidor do Supabase (getUser(), não getSession())
 * a cada navegação — nunca confia só no token em cache local.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    supabase.auth.getUser().then(({ data, error }) => {
      if (cancelado) return;
      setUser(error ? null : data.user);
      setLoading(false);
    });
    return () => {
      cancelado = true;
    };
  }, [location.pathname]);

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
