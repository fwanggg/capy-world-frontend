"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  signInWithGoogle,
  getAuthHeaders,
  waitForAuthInitialization,
} from "@/lib/supabase-client";

export default function WaitlistClient() {
  const searchParams = useSearchParams();
  const urlPending = searchParams.get("pending") === "1";
  const [isPending, setIsPending] = useState(urlPending);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await waitForAuthInitialization();
      const headers = await getAuthHeaders();
      if (!("Authorization" in headers)) return;
      try {
        const res = await fetch("/api/user/profile", {
          headers: { ...headers, "Content-Type": "application/json" },
        });
        if (!res.ok) return;
        const user = await res.json();
        if (!cancelled && user?.approval_status === "pending") {
          setIsPending(true);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (urlPending) setIsPending(true);
  }, [urlPending]);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Authentication failed";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-xl)",
        backgroundColor: "var(--color-gray-50)",
      }}
    >
      <div
        style={{
          maxWidth: "450px",
          width: "100%",
          backgroundColor: "var(--color-white)",
          borderRadius: "0.75rem",
          padding: "var(--space-3xl)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            fontSize: "var(--text-3xl)",
            marginBottom: "var(--space-lg)",
          }}
        >
          Get Early Access Now
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "var(--color-gray-500)",
            marginBottom: "var(--space-2xl)",
          }}
        >
          Get early access to Capybara AI and start testing your ideas with
          AI-powered user research.
        </p>

        {isPending && (
          <div
            style={{
              backgroundColor: "#fef3c7",
              color: "#92400e",
              padding: "var(--space-base)",
              borderRadius: "0.375rem",
              marginBottom: "var(--space-lg)",
              fontSize: "var(--text-sm)",
            }}
          >
            You&apos;re on the waitlist. We&apos;ll notify you when you&apos;re approved.
          </div>
        )}

        {error && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              padding: "var(--space-base)",
              borderRadius: "0.375rem",
              marginBottom: "var(--space-lg)",
              fontSize: "var(--text-sm)",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "var(--space-2xl)",
          }}
        >
          <button
            onClick={handleSignIn}
            disabled={loading}
            style={{
              padding: "var(--space-sm) var(--space-xl)",
              fontSize: "var(--text-base)",
              fontWeight: 600,
              backgroundColor: loading
                ? "var(--color-gray-300)"
                : "var(--color-teal)",
              color: "var(--color-white)",
              border: "none",
              borderRadius: "0.375rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "all var(--transition-fast)",
            }}
          >
            {loading ? "Signing in with Google..." : "Sign in with Google"}
          </button>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: "var(--text-sm)",
            color: "var(--color-gray-400)",
            marginTop: "var(--space-2xl)",
          }}
        >
          We&apos;re in beta. Early applicants get priority access.
        </p>
      </div>
    </div>
  );
}
