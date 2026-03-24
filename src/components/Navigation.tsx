"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/supabase-client";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/analytics";

export function Navigation() {
  const router = useRouter();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);

  const handleSignOut = async () => {
    trackEvent('user_logout');
    setMenuOpen(false);
    setSigningOut(true);
    try {
      await logout();
      router.replace("/waitlist");
    } catch {
      setSigningOut(false);
    } finally {
      setSigningOut(false);
    }
  };

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
        <Link href="/" onClick={() => trackEvent('page_navigated', { page: 'home' })} style={{ fontWeight: "bold", textDecoration: "none" }}>
          Capysan
        </Link>
        <Link href="/about" onClick={() => trackEvent('page_navigated', { page: 'about' })} style={{ textDecoration: "none" }}>
          About
        </Link>
        <Link href="/use-cases" onClick={() => trackEvent('page_navigated', { page: 'use_cases' })} style={{ textDecoration: "none" }}>
          Use Cases
        </Link>
        {!user && (
          <Link href="/waitlist" onClick={() => trackEvent('page_navigated', { page: 'waitlist' })} style={{ textDecoration: "none" }}>
            Start Recruiting Now!
          </Link>
        )}
        {user && (
          <Link href="/chat" onClick={() => trackEvent('page_navigated', { page: 'chat' })} style={{ textDecoration: "none" }}>
            Try for free
          </Link>
        )}
      </div>
      {user && (
        <div
          ref={menuRef}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            position: "relative",
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
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Open profile menu"
            aria-expanded={menuOpen}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
              backgroundColor: "var(--color-gray-200, #e5e7eb)",
              border: "none",
              padding: 0,
              cursor: "pointer",
              opacity: menuOpen ? 0.9 : 1,
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
          </button>
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "0.25rem",
                backgroundColor: "var(--color-white, #fff)",
                border: "1px solid var(--color-gray-200, #e5e7eb)",
                borderRadius: "0.375rem",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                minWidth: "140px",
                zIndex: 50,
              }}
            >
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  textAlign: "left",
                  fontSize: "0.875rem",
                  color: "var(--color-gray-700, #374151)",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: signingOut ? "wait" : "pointer",
                  borderRadius: "0.25rem",
                }}
                onMouseEnter={(e) => {
                  if (!signingOut)
                    e.currentTarget.style.backgroundColor =
                      "var(--color-gray-100, #f3f4f6)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
