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
          padding: "var(--space-2xl)";
          border-radius: "12px";
          transition: all 0.3s ease;
          animation: slideInUp 0.6s ease-out backwards;
        }

        .comparison-card:hover {
          transform: translateY(-4px);
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
          gap: 12px;
          margin-bottom: 12px;
          font-size: 14px;
          line-height: 1.6;
        }

        .check-icon {
          color: var(--color-teal);
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .cross-icon {
          color: var(--color-gray-400);
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 2px;
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
              backgroundColor: "var(--color-white)",
              border: "1px solid var(--color-gray-200)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              animationDelay: "0s",
            }}
          >
            <h3
              style={{
                fontSize: "var(--text-lg)",
                fontWeight: 700,
                color: "var(--color-navy)",
                marginBottom: "var(--space-lg)",
                marginTop: 0,
              }}
            >
              ❌ Generic LLM Personas
            </h3>

            <div className="feature-check">
              <span className="cross-icon">✗</span>
              <span>
                <strong>Generic outputs:</strong> LLMs generate responses based on training data patterns, not real behavior
              </span>
            </div>

            <div className="feature-check">
              <span className="cross-icon">✗</span>
              <span>
                <strong>No authentic perspective:</strong> May produce inconsistent or unrealistic viewpoints
              </span>
            </div>

            <div className="feature-check">
              <span className="cross-icon">✗</span>
              <span>
                <strong>Fabricated experience:</strong> No grounding in actual human life events or decisions
              </span>
            </div>

            <div className="feature-check">
              <span className="cross-icon">✗</span>
              <span>
                <strong>Biased patterns:</strong> Reflect training data biases, not real demographic diversity
              </span>
            </div>
          </div>

          {/* Real Human Data Column */}
          <div
            className="comparison-card"
            style={{
              backgroundColor: "var(--color-white)",
              border: "2px solid var(--color-teal)",
              boxShadow: "0 8px 24px -8px rgba(13, 148, 136, 0.2)",
              animationDelay: "0.1s",
            }}
          >
            <h3
              style={{
                fontSize: "var(--text-lg)",
                fontWeight: 700,
                color: "var(--color-teal)",
                marginBottom: "var(--space-lg)",
                marginTop: 0,
              }}
            >
              ✓ Capysan Real Personas
            </h3>

            <div className="feature-check">
              <span className="check-icon">✓</span>
              <span>
                <strong>Real human foundation:</strong> Built from anonymized human data points.
              </span>
            </div>

            <div className="feature-check">
              <span className="check-icon">✓</span>
              <span>
                <strong>Authentic perspectives:</strong> Personas like "35-year-old male, US real estate agent" have real knowledge, opinions, and experiences
              </span>
            </div>

            <div className="feature-check">
              <span className="check-icon">✓</span>
              <span>
                <strong>Real interaction history:</strong> Grounded in actual posts, comments, and engagement patterns
              </span>
            </div>

            <div className="feature-check">
              <span className="check-icon">✓</span>
              <span>
                <strong>Genuine diversity:</strong> Represents actual demographic and psychographic variety from real humans
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
