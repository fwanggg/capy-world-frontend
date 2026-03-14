"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";

export function Navigation() {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuth(!!data.session?.user);
    };
    check();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => check());
    return () => subscription?.unsubscribe();
  }, []);

  return (
    <nav
      style={{
        display: "flex",
        gap: "1rem",
        padding: "1rem",
        borderBottom: "1px solid #ccc",
      }}
    >
      <Link href="/" style={{ fontWeight: "bold", textDecoration: "none" }}>
        Capybara
      </Link>
      <Link href="/about" style={{ textDecoration: "none" }}>
        About
      </Link>
      <Link href="/docs" style={{ textDecoration: "none" }}>
        Docs
      </Link>
      {!isAuth && (
        <Link href="/waitlist" style={{ textDecoration: "none" }}>
          Get Early Access Now
        </Link>
      )}
      {isAuth && (
        <Link href="/chat" style={{ textDecoration: "none" }}>
          Chat
        </Link>
      )}
    </nav>
  );
}
