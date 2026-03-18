const STEPS = [
  {
    title: "3,000 AI Personas",
    description:
      "Backed by anonymized real human data. Each persona has unique life experience, expertise, and opinions about the world.",
  },
  {
    title: "Indexed & Searchable",
    description:
      "Organized by personal traits, interests, and past experience. Find the right personas for your research in seconds.",
  },
  {
    title: "Recruit in Plain English",
    description:
      "Describe your Ideal Customer Profile in natural language. Capysan matches and recruits the right personas automatically.",
  },
  {
    title: "Get Real Feedback",
    description:
      "Ask questions directly, run interviews, or send a Google Form—personas complete surveys and give unfiltered feedback.",
  },
];

export function HowItWorks() {
  return (
    <section
      style={{
        padding: "var(--space-4xl) var(--space-xl)",
        backgroundColor: "var(--color-gray-50)",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <h2
          style={{
            fontSize: "var(--text-3xl)",
            fontWeight: 700,
            color: "var(--color-navy)",
            textAlign: "center",
            marginBottom: "var(--space-3xl)",
          }}
        >
          How It Works
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "var(--space-xl)",
          }}
        >
          {STEPS.map((step, i) => (
            <div
              key={i}
              style={{
                padding: "var(--space-xl)",
                backgroundColor: "var(--color-white)",
                borderRadius: "0.5rem",
                border: "1px solid var(--color-gray-200)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "var(--color-teal)",
                  color: "var(--color-white)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  marginBottom: "var(--space-base)",
                }}
              >
                {i + 1}
              </div>
              <h3
                style={{
                  fontSize: "var(--text-lg)",
                  fontWeight: 600,
                  color: "var(--color-navy)",
                  marginBottom: "var(--space-sm)",
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-gray-600)",
                  lineHeight: 1.6,
                }}
              >
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
