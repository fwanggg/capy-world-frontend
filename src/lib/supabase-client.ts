"use client";

import { createClient, User } from "@supabase/supabase-js";
import { logAppUrlOnce } from "./logging";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * No-op lock to avoid Supabase auth Web Locks API deadlocks.
 * Supabase uses navigator.locks.request() internally; concurrent requests
 * (e.g. multiple tabs, rapid auth checks) can cause "Lock broken by another
 * request with the 'steal' option" AbortError on Vercel/production.
 * See: https://github.com/supabase/supabase-js/issues/1594
 */
const noOpLock = async <R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> => fn();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    lock: noOpLock,
  },
});

export async function waitForAuthInitialization(): Promise<void> {
  return new Promise((resolve) => {
    supabase.auth.getSession().then(() => resolve());
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => resolve());
    setTimeout(resolve, 1000);
    return () => subscription?.unsubscribe();
  });
}

export async function signInWithGoogle() {
  logAppUrlOnce();
  // Prod (Vercel): NEXT_PUBLIC_APP_URL set from VERCEL_URL in next.config
  // Dev: NEXT_PUBLIC_APP_URL unset → use window.location.origin (http://localhost:3000)
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : null) ||
    "http://localhost:3000";
  const redirectTo = `${origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) throw error;
  return data;
}

export async function getAuthToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  return data.session.access_token;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}

export async function isLoggedIn(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

export async function getAuthHeaders(): Promise<
  { Authorization: string } | Record<string, never>
> {
  const token = await getAuthToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
