"use client";

export function RealVsSynthetic() {
  return (
    <section
      style={{
        padding: "var(--space-4xl) var(--space-xl)",
        background: "linear-gradient(180deg, rgba(13, 148, 136, 0.05) 0%, var(--color-gray-50) 100%)",
      }}
    >
      <style>{`
        .comparison-card {
          padding: 32px;
          border-radius: 16px;
          transition: all 0.3s ease;
          animation: slideInUp 0.6s ease-out backwards;
        }

        .comparison-card:hover {
          transform: translateY(-6px);
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .feature-check {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
          font-size: 15px;
          line-height: 1.7;
        }

        .feature-check:last-child {
          margin-bottom: 0;
        }

        .check-icon {
          color: var(--color-teal);
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 2px;
          font-size: 18px;
        }

        .cross-icon {
          color: var(--color-gray-400);
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 2px;
          font-size: 18px;
        }
      `}</style>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "var(--space-3xl)" }}>
          <h2
            style={{
              fontSize: "var(--text-3xl)",
              fontWeight: 800,
              background: "linear-gradient(135deg, var(--color-navy) 0%, var(--color-teal) 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "var(--space-lg)",
            }}
          >
            Real Human Personas, Not Synthetic
          </h2>
          <p
            style={{
              fontSize: "var(--text-lg)",
              color: "var(--color-gray-600)",
              maxWidth: "600px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Our digital twins are grounded in real, anonymized human data—not generic LLM outputs pretending to be people.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-2xl)",
          }}
        >
          {/* Synthetic LLM Column */}
          <div
            className="comparison-card"
            style={{
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(243, 244, 246, 0.5) 100%)",
              border: "1px solid rgba(209, 213, 219, 0.5)",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.5)",
              animationDelay: "0s",
            }}
          >
            <h3
              style={{
                fontSize: "var(--text-lg)",
                fontWeight: 700,
                color: "var(--color-navy)",
                marginBottom: "24px",
                marginTop: 0,
              }}
            >
              ❌ Generic LLM Personas
            </h3>

            <div className="feature-check">
              <span className="cross-icon">✗</span>
              <span>
                <strong>Generic outputs:</strong> Just ask LLM to assume a role of certain identity(35 YO, Male), i.e. 'LLM, You are a 35 year old male', works only as good as a sentimental analysis.
              </span>
            </div>

            <div className="feature-check">
              <span className="cross-icon">✗</span>
              <span>
                <strong>Fabricated experience:</strong> no details, no context, inconsistent because there is no grounding of truth.
              </span>
            </div>
          </div>

          {/* Real Human Data Column */}
          <div
            className="comparison-card"
            style={{
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(13, 148, 136, 0.03) 100%)",
              border: "2px solid var(--color-teal)",
              boxShadow: "0 8px 32px rgba(13, 148, 136, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.8)",
              animationDelay: "0.1s",
            }}
          >
            <h3
              style={{
                fontSize: "var(--text-lg)",
                fontWeight: 700,
                color: "var(--color-teal)",
                marginBottom: "24px",
                marginTop: 0,
              }}
            >
              ✓ Capysan Real Personas
            </h3>

            <div className="feature-check">
              <span className="check-icon">✓</span>
              <span>
                <strong>Real human foundation:</strong> Each Personas backed by anonymized private knowledge of a real human.
              </span>
            </div>

            <div className="feature-check">
              <span className="check-icon">✓</span>
              <span>
                <strong>Authentic perspectives:</strong> Personas' segments are extracted from actual human history. Not the other way around.
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
