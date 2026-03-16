export default function UseCases() {
  const useCases = [
    {
      title: "Early Stage Idea Validation",
      steps: [
        { label: "Identify ICP", desc: "Define your ideal customer profile and key demographics." },
        { label: "Recruit ICP-matched personas", desc: "Capysan finds and activates personas that match your target audience." },
        { label: "Validate pain points", desc: "Chat with personas to confirm whether your assumptions about their problems hold." },
        { label: "Get brutally honest feedback", desc: "Receive unfiltered responses—no sugarcoating, no politeness." },
      ],
    },
    {
      title: "Brand Survey",
      steps: [
        { label: "Recruit personas with brand usage", desc: "Find personas who have used or engaged with your brand." },
        { label: "Ask personas to complete a survey in seconds", desc: "Send questions via Capysan; personas respond immediately." },
        { label: "View report", desc: "Review responses in a structured format to identify patterns and gaps." },
      ],
    },
  ];

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
            Use Cases
          </h1>
          <p
            style={{
              fontSize: "var(--text-sm)",
              lineHeight: 1.7,
              color: "var(--color-gray-600)",
            }}
          >
            How teams use Capysan to validate ideas and gather feedback.
          </p>
        </div>
      </section>

      <section style={{ padding: "var(--space-4xl) var(--space-xl)" }}>
        <div className="container" style={{ maxWidth: "720px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4xl)" }}>
            {useCases.map((uc, idx) => (
              <div key={idx}>
                <h2
                  style={{
                    fontSize: "var(--text-lg)",
                    fontWeight: 600,
                    color: "var(--color-navy)",
                    marginBottom: "var(--space-xl)",
                  }}
                >
                  {uc.title}
                </h2>
                <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {uc.steps.map((step, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        gap: "var(--space-base)",
                        marginBottom: "var(--space-lg)",
                      }}
                    >
                      <span
                        style={{
                          flexShrink: 0,
                          width: "1.5rem",
                          height: "1.5rem",
                          borderRadius: "50%",
                          backgroundColor: "var(--color-teal)",
                          color: "var(--color-white)",
                          fontSize: "var(--text-xs)",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {String.fromCharCode(97 + i)}
                      </span>
                      <div>
                        <span
                          style={{
                            fontSize: "var(--text-sm)",
                            fontWeight: 600,
                            color: "var(--color-navy)",
                          }}
                        >
                          {step.label}
                        </span>
                        <span
                          style={{
                            fontSize: "var(--text-sm)",
                            color: "var(--color-gray-600)",
                            marginLeft: "var(--space-xs)",
                          }}
                        >
                          — {step.desc}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
