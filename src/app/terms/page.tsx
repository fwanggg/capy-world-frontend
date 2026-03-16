export default function Terms() {
  return (
    <div>
      <section
        style={{
          padding: "var(--space-4xl) var(--space-xl)",
          backgroundColor: "var(--color-gray-50)",
        }}
      >
        <div className="container" style={{ maxWidth: "720px" }}>
          <h1
            style={{
              marginBottom: "var(--space-base)",
              fontSize: "var(--text-xl)",
              fontWeight: 600,
              color: "var(--color-navy)",
            }}
          >
            Terms of Service
          </h1>
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-gray-500)",
              marginBottom: "var(--space-2xl)",
            }}
          >
            Last updated: March 2025. We&apos;re an early-stage MVP. These terms
            are minimal and may change as we grow.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2xl)",
              fontSize: "var(--text-sm)",
              lineHeight: 1.7,
              color: "var(--color-gray-600)",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "var(--text-base)",
                  fontWeight: 600,
                  color: "var(--color-navy)",
                  marginBottom: "var(--space-sm)",
                }}
              >
                Use of the service
              </h2>
              <p>
                Capysan is a research tool. Use it for product validation,
                surveys, and feedback. Don&apos;t use it for anything illegal,
                harmful, or that violates others&apos; rights.
              </p>
            </div>

            <div>
              <h2
                style={{
                  fontSize: "var(--text-base)",
                  fontWeight: 600,
                  color: "var(--color-navy)",
                  marginBottom: "var(--space-sm)",
                }}
              >
                Early-stage disclaimer
              </h2>
              <p>
                We&apos;re in early development. The service may have bugs,
                downtime, or change without notice. We&apos;re doing our best
                but can&apos;t guarantee uptime or specific features yet.
              </p>
            </div>

            <div>
              <h2
                style={{
                  fontSize: "var(--text-base)",
                  fontWeight: 600,
                  color: "var(--color-navy)",
                  marginBottom: "var(--space-sm)",
                }}
              >
                Your content
              </h2>
              <p>
                You own your chat messages and research data. We need a license
                to store and process it to run the service. We won&apos;t use
                your content for training models or marketing without your
                consent.
              </p>
            </div>

            <div>
              <h2
                style={{
                  fontSize: "var(--text-base)",
                  fontWeight: 600,
                  color: "var(--color-navy)",
                  marginBottom: "var(--space-sm)",
                }}
              >
                Changes
              </h2>
              <p>
                We may update these terms. We&apos;ll post changes here. Continued
                use after updates means you accept them.
              </p>
            </div>

            <div>
              <h2
                style={{
                  fontSize: "var(--text-base)",
                  fontWeight: 600,
                  color: "var(--color-navy)",
                  marginBottom: "var(--space-sm)",
                }}
              >
                Contact
              </h2>
              <p>
                Questions? Reach out at the email on our website or waitlist
                page.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
