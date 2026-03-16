export default function About() {
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
              marginBottom: "var(--space-2xl)",
              fontSize: "var(--text-xl)",
              fontWeight: 600,
              color: "var(--color-navy)",
            }}
          >
            Why we built Capysan
          </h1>
          <p
            style={{
              fontSize: "var(--text-base)",
              lineHeight: 1.7,
              color: "var(--color-gray-700)",
              marginBottom: "var(--space-2xl)",
            }}
          >
            We observed three recurring gaps in how early-stage teams validate
            product direction:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2xl)" }}>
            <div>
              <h2
                style={{
                  fontSize: "var(--text-base)",
                  fontWeight: 600,
                  color: "var(--color-navy)",
                  marginBottom: "var(--space-sm)",
                }}
              >
                Deep research tools
              </h2>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  lineHeight: 1.7,
                  color: "var(--color-gray-600)",
                }}
              >
                Aggregated insights are packaged into long-form reports that
                take 10+ minutes to generate and often require multiple retries.
                The output can be difficult to parse and act on.
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
                Direct customer engagement
              </h2>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  lineHeight: 1.7,
                  color: "var(--color-gray-600)",
                }}
              >
                To validate direction, founders need hands-on conversations with
                customers who match their ICP. Capturing nuanced needs and
                catching misalignments early typically takes days or weeks—even
                for early-stage validation.
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
                Comfort with outreach
              </h2>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  lineHeight: 1.7,
                  color: "var(--color-gray-600)",
                }}
              >
                Customer validation is essential, but founders who are less
                comfortable talking to strangers may avoid it—blocking critical
                feedback from reaching them.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "var(--space-4xl) var(--space-xl)" }}>
        <div className="container" style={{ maxWidth: "720px" }}>
          <h2
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: 600,
              color: "var(--color-navy)",
              marginBottom: "var(--space-lg)",
            }}
          >
            What we offer
          </h2>
          <p
            style={{
              fontSize: "var(--text-sm)",
              lineHeight: 1.7,
              color: "var(--color-gray-600)",
              marginBottom: "var(--space-base)",
            }}
          >
            Capysan lets you chat directly with AI personas backed by anonamized real human data. Each persona reflects implicit needs and communication style,
            not just demographics. You get individual feedback in minutes instead
            of aggregated reports or weeks of outreach.
          </p>
          <p
            style={{
              fontSize: "var(--text-sm)",
              lineHeight: 1.7,
              color: "var(--color-gray-600)",
            }}
          >
            Built for founders, marketers, and product teams who need to test
            ideas quickly and iterate with confidence.
          </p>
        </div>
      </section>
    </div>
  );
}
