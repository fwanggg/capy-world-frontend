import Link from "next/link";
import { TypingHero } from "@/components/TypingHero";

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
            Talk to AI Personas
            <br />
            <TypingHero />
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
            Recruit army of high-fidelity personas aligned with your Ideal Customer Profile.
            Run surveys, validate ideas, and get brutally honest feedback, in seconds.
          </p>

          <Link
            href="/waitlist"
            className="btn btn-primary"
            style={{ marginTop: "var(--space-lg)" }}
          >
            Get Early Access Now
          </Link>
        </div>
      </section>

      <section
        style={{
          backgroundColor: "var(--color-gray-50)",
          padding: "var(--space-4xl) var(--space-xl)",
        }}
      >
        <div className="container">
          <h2
            style={{
              textAlign: "center",
              marginBottom: "var(--space-3xl)",
              fontSize: "var(--text-3xl)",
            }}
          >
            Why Capysan Works
          </h2>

          <div
            className="grid grid-2"
            style={{ maxWidth: "1000px", margin: "0 auto" }}
          >
            {[{
                title: "Built for Early Stage AI Builders",
                desc: "Natural Language, Vibe Check, and Get Feedback in Seconds.",
              },
              {
                title: "Recuits ICP-Matched Personas in seconds",
                desc: "High-fidelity Personas by segments.",
              },
              {
                title: "Actionable Individual-Level Feedback, NO BS",
                desc: "Actionable, brutally honest, individual-level feedback, backed by anonamized real human data. no BS.",
              },
              
              {
                title: "Future-Proof Insights",
                desc: "Predict Emerging behaviors, not just history.",
              },
              {
                title: "Always On, Conversational",
                desc: "24/7 research. No scheduling, no waiting. Just ask.",
              },
            ].map((item) => (
              <div key={item.title} className="card">
                <h3
                  style={{
                    fontSize: "var(--text-xl)",
                    marginBottom: "var(--space-base)",
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ fontSize: "var(--text-base)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
                ICP-matched personas. Real-time validation. Unfiltered feedback.
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
                    Get Early Access Now
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
                  <a
                    href="#"
                    style={{
                      color: "var(--color-gray-300)",
                      textDecoration: "none",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    style={{
                      color: "var(--color-gray-300)",
                      textDecoration: "none",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    Terms
                  </a>
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
