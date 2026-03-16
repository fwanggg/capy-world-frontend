export default function Privacy() {
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
            Privacy Policy
          </h1>
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-gray-500)",
              marginBottom: "var(--space-2xl)",
            }}
          >
            Last updated: March 2025. We&apos;re an early-stage MVP and may update
            this policy as we grow.
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
                What we collect
              </h2>
              <p>
                When you sign up, we collect your email and basic profile info
                (e.g. name, avatar) from Google OAuth. We store chat messages
                and session data to provide the service. We do not sell your
                data.
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
                How we use it
              </h2>
              <p>
                We use your data to run the product—authentication, chat
                history, and persona research. We may use aggregated,
                anonymized data to improve the service.
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
                Infrastructure
              </h2>
              <p>
                We use Supabase for auth and database. Data is stored in the
                cloud. We rely on their security practices.
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
