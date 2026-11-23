import type { Session } from "@supabase/supabase-js";

/** Keeps an older getSession response from replacing a newer Auth event. */
export function createSessionBootstrap(apply: (session: Session | null) => void) {
  let stopped = false;
  let receivedAuthEvent = false;

  return {
    onAuthEvent(session: Session | null) {
      if (stopped) return;
      receivedAuthEvent = true;
      apply(session);
    },
    onBootstrapSession(session: Session | null) {
      if (stopped || receivedAuthEvent) return;
      apply(session);
    },
    onBootstrapFailure() {
      if (stopped || receivedAuthEvent) return;
      apply(null);
    },
    stop() {
      stopped = true;
    },
  };
}
