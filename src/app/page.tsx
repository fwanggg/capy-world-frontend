import Link from "next/link";
import { ChatDemo } from "@/components/ChatDemo";
import { HowItWorks } from "@/components/HowItWorks";

export default function Home() {
  return (
    <div>
      <section
        style={{
          paddingTop: "var(--space-4xl)",
          paddingBottom: "var(--space-4xl)",
          paddingLeft: "var(--space-xl)",
          paddingRight: "var(--space-xl)",
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "var(--text-5xl)",
              marginBottom: "var(--space-xl)",
              lineHeight: "var(--line-tight)",
            }}
          >
            User Research with Digital Twins, Backed by Real Human Data
          </h1>

          <p
            style={{
              fontSize: "var(--text-xl)",
              marginBottom: "var(--space-3xl)",
              color: "var(--color-gray-500)",
              maxWidth: "600px",
              margin: "0 auto var(--space-3xl)",
            }}
          >
            Interview AI personas trained on real Reddit user behavior.
            Validate ideas, run surveys, and gather unfiltered feedback from authentic digital twins.
          </p>

          

          <ChatDemo />

          <div style={{ marginTop: "var(--space-4xl)" }} />
        </div>
      </section>

      <HowItWorks />

      <footer
        style={{
          backgroundColor: "var(--color-navy)",
          color: "var(--color-gray-300)",
          padding: "var(--space-3xl) var(--space-xl)",
          borderTop: "1px solid var(--color-gray-700)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
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
                }}
              >
                Capysan
              </h3>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  lineHeight: "1.6",
                }}
              >
                Digital twins trained on real human data. Authentic user research. Instant insights.
              </p>
            </div>

            <div>
              <h4
                style={{
                  color: "var(--color-white)",
                  marginBottom: "var(--space-base)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                }}
              >
                Product
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <li style={{ marginBottom: "var(--space-sm)" }}>
                  <Link
                    href="/"
                    style={{
                      color: "var(--color-gray-300)",
                      textDecoration: "none",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    Home
                  </Link>
                </li>
                <li style={{ marginBottom: "var(--space-sm)" }}>
                  <Link
                    href="/waitlist"
                    style={{
                      color: "var(--color-gray-300)",
                      textDecoration: "none",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    Start Recruiting Now!
                  </Link>
                </li>
                <li>
                  <Link
                    href="/use-cases"
                    style={{
                      color: "var(--color-gray-300)",
                      textDecoration: "none",
                      fontSize: "var(--text-sm)",
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
                }}
              >
                Legal
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <li style={{ marginBottom: "var(--space-sm)" }}>
                  <Link
                    href="/privacy"
                    style={{
                      color: "var(--color-gray-300)",
                      textDecoration: "none",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    style={{
                      color: "var(--color-gray-300)",
                      textDecoration: "none",
                      fontSize: "var(--text-sm)",
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
              borderTop: "1px solid var(--color-gray-700)",
              paddingTop: "var(--space-2xl)",
              textAlign: "center",
              fontSize: "var(--text-sm)",
              color: "var(--color-gray-400)",
            }}
          >
            <p>© 2025 Capysan. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
