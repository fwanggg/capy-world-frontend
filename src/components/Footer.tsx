"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer
      style={{
        background: "linear-gradient(135deg, var(--color-navy) 0%, #0f172a 100%)",
        color: "var(--color-gray-300)",
        padding: "var(--space-4xl) var(--space-xl)",
        borderTop: "1px solid rgba(13, 148, 136, 0.1)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-40%",
          right: "-10%",
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle, rgba(13, 148, 136, 0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "var(--space-3xl)",
            marginBottom: "var(--space-3xl)",
          }}
        >
          <div>
            <h3
              style={{
                color: "var(--color-white)",
                marginBottom: "var(--space-base)",
                fontSize: "var(--text-lg)",
                fontWeight: 700,
              }}
            >
              Capysan
            </h3>
            <p
              style={{
                fontSize: "var(--text-sm)",
                lineHeight: "1.6",
                color: "var(--color-gray-400)",
              }}
            >
              Digital twins trained on real human data. Authentic user research.
              Instant insights.
            </p>
          </div>

          <div>
            <h4
              style={{
                color: "var(--color-white)",
                marginBottom: "var(--space-base)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Product
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ marginBottom: "var(--space-sm)" }}>
                <Link
                  href="/"
                  style={{
                    color: "var(--color-gray-400)",
                    textDecoration: "none",
                    fontSize: "var(--text-sm)",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLAnchorElement).style.color =
                      "var(--color-teal)";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLAnchorElement).style.color =
                      "var(--color-gray-400)";
                  }}
                >
                  Home
                </Link>
              </li>
              <li style={{ marginBottom: "var(--space-sm)" }}>
                <Link
                  href="/waitlist"
                  style={{
                    color: "var(--color-gray-400)",
                    textDecoration: "none",
                    fontSize: "var(--text-sm)",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLAnchorElement).style.color =
                      "var(--color-teal)";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLAnchorElement).style.color =
                      "var(--color-gray-400)";
                  }}
                >
                  Start Recruiting Now!
                </Link>
              </li>
              <li>
                <Link
                  href="/use-cases"
                  style={{
                    color: "var(--color-gray-400)",
                    textDecoration: "none",
                    fontSize: "var(--text-sm)",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLAnchorElement).style.color =
                      "var(--color-teal)";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLAnchorElement).style.color =
                      "var(--color-gray-400)";
                  }}
                >
                  Use Cases
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4
              style={{
                color: "var(--color-white)",
                marginBottom: "var(--space-base)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Legal
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ marginBottom: "var(--space-sm)" }}>
                <Link
                  href="/privacy"
                  style={{
                    color: "var(--color-gray-400)",
                    textDecoration: "none",
                    fontSize: "var(--text-sm)",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLAnchorElement).style.color =
                      "var(--color-teal)";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLAnchorElement).style.color =
                      "var(--color-gray-400)";
                  }}
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  style={{
                    color: "var(--color-gray-400)",
                    textDecoration: "none",
                    fontSize: "var(--text-sm)",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLAnchorElement).style.color =
                      "var(--color-teal)";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLAnchorElement).style.color =
                      "var(--color-gray-400)";
                  }}
                >
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(13, 148, 136, 0.1)",
            paddingTop: "var(--space-2xl)",
            textAlign: "center",
            fontSize: "var(--text-sm)",
            color: "var(--color-gray-500)",
          }}
        >
          <p style={{ margin: 0 }}>© 2025 Capysan. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
