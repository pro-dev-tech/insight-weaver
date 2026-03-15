import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

// Create a no-op proxy when credentials are missing so the app doesn't crash
function createMockClient(): SupabaseClient {
  const noop = () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } });
  const chainable: ProxyHandler<any> = {
    get: (_t, p) => {
      if (p === "then" || p === "catch" || p === "finally") return undefined; // not a thenable
      return new Proxy(noop, chainable);
    },
    apply: (_t, _this, args) => {
      // Return chainable proxy that is also a promise
      const result: any = new Proxy(noop, chainable);
      result.then = (fn: any) => Promise.resolve({ data: null, error: null }).then(fn);
      result.catch = (fn: any) => Promise.resolve({ data: null, error: null }).catch(fn);
      return result;
    },
  };

  const authMethods: Record<string, any> = {
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { session: null, user: null }, error: { message: "Supabase not configured" } }),
    signUp: () => Promise.resolve({ data: { session: null, user: null }, error: { message: "Supabase not configured" } }),
    signOut: () => Promise.resolve({ error: null }),
    updateUser: () => Promise.resolve({ data: { user: null }, error: null }),
    resend: () => Promise.resolve({ data: null, error: null }),
  };

  const handler: ProxyHandler<any> = {
    get: (_target, prop) => {
      if (prop === "auth") return new Proxy(authMethods, { get: (t, p) => t[p as string] || (() => Promise.resolve({ data: null, error: null })) });
      if (prop === "from") return (_table: string) => new Proxy({}, chainable);
      return new Proxy(noop, chainable);
    },
  };
  return new Proxy({} as SupabaseClient, handler);
}

export const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : (console.warn("Supabase credentials not set – running in offline mode"), createMockClient());
