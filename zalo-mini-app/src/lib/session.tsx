import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { signInWithZalo, type SessionUser } from "./api";

interface SessionState {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

const SessionContext = createContext<SessionState>({
  user: null,
  loading: true,
  error: null,
  retry: () => undefined,
});

/** Signs in automatically on first open — the user never sees a login screen. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(() => {
    setLoading(true);
    setError(null);
    signInWithZalo()
      .then(setUser)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(run, [run]);

  return (
    <SessionContext.Provider value={{ user, loading, error, retry: run }}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
