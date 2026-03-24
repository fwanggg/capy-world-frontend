"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithGoogle,
  getAuthHeaders,
} from "@/lib/supabase-client";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/analytics";

type ApprovalStatus = "approved" | "pending" | null;

export default function WaitlistClient() {
  const router = useRouter();
  const { isSignedIn, loading: authLoading } = useAuth();
  const [approvalLoading, setApprovalLoading] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setApprovalLoading(false);
      setApprovalStatus(null);
      return;
    }

    setApprovalLoading(true);
    let cancelled = false;
    (async () => {
      try {
        const headers = await getAuthHeaders();
        let res = await fetch("/api/user/profile", {
          headers: { ...headers, "Content-Type": "application/json" },
        });
        if (cancelled) return;
        let user = res.ok ? await res.json() : null;
        if ((!res.ok || user?.approval_status == null) && "Authorization" in headers) {
          await fetch("/api/waitlist/join", {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: "{}",
          });
          res = await fetch("/api/user/profile", {
            headers: { ...headers, "Content-Type": "application/json" },
          });
          if (cancelled) return;
          user = res.ok ? await res.json() : null;
        }
        if (!res.ok) {
          const body = user ?? (await res.json().catch(() => ({})));
          setProfileError(body?.error ?? "Failed to check approval status");
          setApprovalStatus(null);
          return;
        }
        const status =
          user?.approval_status === "approved"
            ? "approved"
            : user?.approval_status === "pending"
              ? "pending"
              : null;
        setApprovalStatus(status);
      } catch {
        if (!cancelled) setProfileError("Failed to check approval status");
      } finally {
        if (!cancelled) setApprovalLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      setApprovalStatus(null);
      setProfileError(null);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (approvalStatus === "approved") {
      router.replace("/chat");
    }
  }, [approvalStatus, router]);

  const handleSignIn = async () => {
    trackEvent('user_signin_started', { method: 'google' });
    setSignInLoading(true);
    setSignInError(null);

    try {
      await signInWithGoogle();
      trackEvent('user_signin_success', { method: 'google' });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Authentication failed";
      trackEvent('user_signin_failed', { method: 'google', error: message });
      setSignInError(message);
      setSignInLoading(false);
    }
  };

  const displayError = profileError ?? signInError;
  const loading = authLoading || (isSignedIn && approvalLoading);

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
          Start Now (Limited Early Access for Free)
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "var(--color-gray-500)",
            marginBottom: "var(--space-2xl)",
          }}
        >
          Get early access to Capysan and start testing your ideas with
          AI-powered user research.
        </p>

        {loading && (
          <div
            style={{
              textAlign: "center",
              color: "var(--color-gray-500)",
              marginBottom: "var(--space-lg)",
            }}
          >
            Checking...
          </div>
        )}

        {!loading && isSignedIn && approvalStatus === "pending" && (
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

        {!loading && isSignedIn && approvalStatus === "approved" && (
          <div
            style={{
              textAlign: "center",
              color: "var(--color-gray-600)",
              marginBottom: "var(--space-lg)",
            }}
          >
            Redirecting to Chat...
          </div>
        )}

        {displayError && (
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
            {displayError}
          </div>
        )}

        {!loading && !isSignedIn && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "var(--space-2xl)",
            }}
          >
            <button
              onClick={handleSignIn}
              disabled={signInLoading}
              style={{
                padding: "var(--space-sm) var(--space-xl)",
                fontSize: "var(--text-base)",
                fontWeight: 600,
                backgroundColor: signInLoading
                  ? "var(--color-gray-300)"
                  : "var(--color-teal)",
                color: "var(--color-white)",
                border: "none",
                borderRadius: "0.375rem",
                cursor: signInLoading ? "not-allowed" : "pointer",
                opacity: signInLoading ? 0.7 : 1,
                transition: "all var(--transition-fast)",
              }}
            >
              {signInLoading
                ? "Signing in with Google..."
                : "Sign in with Google"}
            </button>
          </div>
        )}

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
