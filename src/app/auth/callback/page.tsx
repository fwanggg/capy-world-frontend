"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

export default function AuthCallback() {
  const router = useRouter();
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handleCallback = async () => {
      try {
        let sessionFound = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!sessionFound && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          attempts++;

          const { data } = await supabase.auth.getSession();

          if (data.session?.user) {
            sessionFound = true;
            if (!isMounted) return;

            try {
              const { error: selectError } = await supabase
                .from("waitlist")
                .select("id")
                .eq("user_id", data.session.user.id)
                .single();

              if (selectError?.code === "PGRST116") {
                await supabase.from("waitlist").insert({
                  user_id: data.session.user.id,
                  approval_status: "pending",
                });
              }
            } catch {
              /* ignore */
            }

            router.replace("/chat");
            return;
          }
        }

        if (!isMounted) return;

        if (!sessionFound) {
          setDebugError(
            `No session found after ${maxAttempts} attempts. Supabase did not detect the OAuth token.`
          );
          setTimeout(() => router.replace("/waitlist"), 3000);
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        if (!isMounted) return;
        setDebugError(errMsg);
        setTimeout(() => router.replace("/waitlist"), 3000);
      }
    };

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "var(--color-gray-50)",
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: "500px",
          padding: "2rem",
        }}
      >
        {debugError ? (
          <div
            style={{
              backgroundColor: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: "0.5rem",
              color: "#991b1b",
              padding: "1.5rem",
            }}
          >
            <h2>⚠️ Login Failed</h2>
            <p>
              <strong>{debugError}</strong>
            </p>
            <p>Redirecting to login in 3 seconds...</p>
          </div>
        ) : (
          <>
            <h2>Authenticating...</h2>
            <p>Please wait while we complete your sign-in.</p>
          </>
        )}
      </div>
    </div>
  );
}
