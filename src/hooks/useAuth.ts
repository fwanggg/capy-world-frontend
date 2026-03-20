"use client";

import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";

/** Max attempts to detect session (Supabase can take a moment to restore from storage) */
const SESSION_RETRY_ATTEMPTS = 10;
const SESSION_RETRY_DELAY_MS = 200;

export interface UseAuthResult {
  user: User | null;
  loading: boolean;
  isSignedIn: boolean;
}

/**
 * Consolidated auth hook. Single source of truth for signed-in state across the app.
 * Uses getSession() with retries (session may not be immediately available on load).
 * Never show "Sign in" UI when isSignedIn is true.
 */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      let attempts = 0;

      while (attempts < SESSION_RETRY_ATTEMPTS) {
        const { data } = await getSupabaseClient().auth.getSession();
        const sessionUser = data.session?.user ?? null;

        if (sessionUser) {
          if (isMounted) {
            setUser(sessionUser);
            setLoading(false);
          }
          return;
        }

        attempts++;
        if (attempts < SESSION_RETRY_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, SESSION_RETRY_DELAY_MS));
        }
      }

      if (isMounted) {
        setUser(null);
        setLoading(false);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = getSupabaseClient().auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    isSignedIn: !!user,
  };
}
