const STEPS = [
  {
    title: "3,000 AI Personas",
    description:
      "Backed by anonymized real human data. Each persona has unique life experience, expertise, and opinions about the world.",
    icon: "people",
  },
  {
    title: "Indexed & Searchable",
    description:
      "Organized by personal traits, interests, and past experience. Find the right personas for your research in seconds.",
    icon: "search",
  },
  {
    title: "Recruit in Plain English",
    description:
      "Describe your Ideal Customer Profile in natural language. Capysan matches and recruits the right personas automatically.",
    icon: "auto_awesome",
  },
  {
    title: "Get Real Feedback",
    description:
      "Ask questions directly, run interviews, or send a Google Form—personas complete surveys and give unfiltered feedback.",
    icon: "chat_bubble",
  },
];

export function HowItWorks() {
  return (
    <section
      style={{
        padding: "var(--space-4xl) var(--space-xl)",
        background: "linear-gradient(180deg, var(--color-gray-50) 0%, rgba(13, 148, 136, 0.03) 100%)",
      }}
    >
      <style>{`
        .feature-card {
          transition: all 0.3s ease;
          animation: fadeInUp 0.6s ease-out backwards;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 16px 40px -8px rgba(13, 148, 136, 0.2);
          border-color: var(--color-teal);
        }

        .feature-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(13, 148, 136, 0.1) 0%, rgba(13, 148, 136, 0.05) 100%);
          color: var(--color-teal);
          font-size: 28px;
          margin-bottom: var(--space-base);
          transition: all 0.3s ease;
        }

        .feature-card:hover .feature-icon {
          background: linear-gradient(135deg, var(--color-teal) 0%, #0a8173 100%);
          color: var(--color-white);
          transform: scale(1.1);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h2
          style={{
            fontSize: "var(--text-3xl)",
            fontWeight: 800,
            background: "linear-gradient(135deg, var(--color-navy) 0%, var(--color-teal) 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textAlign: "center",
            marginBottom: "var(--space-xl)",
          }}
        >
          How It Works
        </h2>
        <p
          style={{
            fontSize: "var(--text-base)",
            color: "var(--color-gray-600)",
            textAlign: "center",
            marginBottom: "var(--space-3xl)",
            maxWidth: "600px",
            margin: "0 auto var(--space-3xl)",
          }}
        >
          Get real feedback from authentic personas in four simple steps.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "var(--space-xl)",
          }}
        >
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="feature-card"
              style={{
                padding: "var(--space-2xl) var(--space-xl)",
                backgroundColor: "var(--color-white)",
                borderRadius: "12px",
                border: "1px solid var(--color-gray-200)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <div className="feature-icon">
                <span style={{ fontFamily: "Material Symbols Rounded" }}>
                  {step.icon}
                </span>
              </div>
              <h3
                style={{
                  fontSize: "var(--text-lg)",
                  fontWeight: 700,
                  color: "var(--color-navy)",
                  marginBottom: "var(--space-sm)",
                  marginTop: 0,
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-gray-600)",
                  lineHeight: 1.6,
                  margin: 0,
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
