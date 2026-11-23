import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthContext } from "./auth-context";
import { supabase } from "@/integrations/supabase/client";
import { createSessionBootstrap } from "./session-bootstrap";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = createSessionBootstrap((nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    try {
      const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        bootstrap.onAuthEvent(nextSession);
      });

      void supabase.auth
        .getSession()
        .then(({ data, error }) => {
          if (error) bootstrap.onBootstrapFailure();
          else bootstrap.onBootstrapSession(data.session);
        })
        .catch(() => bootstrap.onBootstrapFailure());

      return () => {
        bootstrap.stop();
        subscription.subscription.unsubscribe();
      };
    } catch {
      bootstrap.onBootstrapFailure();
      return () => bootstrap.stop();
    }
  }, []);

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, loading }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
