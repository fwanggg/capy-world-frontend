"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";

export function Navigation() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    };
    check();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => check());
    return () => subscription?.unsubscribe();
  }, []);

  const avatarUrl =
    user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        padding: "1rem",
        borderBottom: "1px solid #ccc",
      }}
    >
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <Link href="/" style={{ fontWeight: "bold", textDecoration: "none" }}>
          Capybara
        </Link>
        <Link href="/about" style={{ textDecoration: "none" }}>
          About
        </Link>
        <Link href="/docs" style={{ textDecoration: "none" }}>
          Docs
        </Link>
        {!user && (
          <Link href="/waitlist" style={{ textDecoration: "none" }}>
            Get Early Access Now
          </Link>
        )}
        {user && (
          <Link href="/chat" style={{ textDecoration: "none" }}>
            Chat
          </Link>
        )}
      </div>
      {user && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <span
            style={{
              fontSize: "0.875rem",
              color: "var(--color-gray-600, #4b5563)",
              maxWidth: "180px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.email}
          </span>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
              backgroundColor: "var(--color-gray-200, #e5e7eb)",
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                width={32}
                height={32}
                style={{ objectFit: "cover", width: 32, height: 32 }}
              />
            ) : (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--color-teal, #0d9488)",
                }}
              >
                {(user.email?.[0] ?? "?").toUpperCase()}
              </span>
            )}
          </span>
        </div>
      )}
    </nav>
  );
}
