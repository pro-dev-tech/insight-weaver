import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

// Create a no-op proxy when credentials are missing so the app doesn't crash
function createMockClient(): SupabaseClient {
  const handler: ProxyHandler<any> = {
    get: (_target, prop) => {
      if (prop === "auth") {
        return new Proxy({}, {
          get: () => (..._args: any[]) => Promise.resolve({ data: { session: null, user: null, subscription: { unsubscribe: () => {} } }, error: { message: "Supabase not configured" } }),
        });
      }
      return new Proxy(() => {}, handler);
    },
    apply: () => new Proxy({}, handler),
  };
  return new Proxy({} as SupabaseClient, handler);
}

export const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : (console.warn("Supabase credentials not set – running in offline mode"), createMockClient());
