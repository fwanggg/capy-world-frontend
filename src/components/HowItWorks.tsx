"use client";

import { useState } from "react";

const STEPS = [
  {
    number: 1,
    title: "Recruit The Panel",
    description:
      "Describe your target audience in natural language based on demographics, interests, experience, and more. Capysan automatically finds and recruits the perfect personas.",
    icon: "people",
    color: "#0d9488",
  },
  {
    number: 2,
    title: "Define Study & Survey",
    description:
      "Start interviewing your panel with custom questions, surveys, or Google Forms. Get real feedback from authentic perspectives.",
    icon: "clipboard_list",
    color: "#0a8173",
  },
  {
    number: 3,
    title: "Analyze & Conclude",
    description:
      "Review responses, identify patterns, and reach data-backed conclusions. Export reports and share insights with your team.",
    icon: "analytics",
    color: "#067d6e",
  },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section
      style={{
        padding: "var(--space-4xl) var(--space-xl)",
        background: "linear-gradient(180deg, var(--color-gray-50) 0%, rgba(13, 148, 136, 0.03) 100%)",
      }}
    >
      <style>{`
        .step-item {
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          padding-left: 32px;
          padding-top: 12px;
          padding-bottom: 12px;
        }

        .step-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 18px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(13, 148, 136, 0.1) 0%, rgba(13, 148, 136, 0.05) 100%);
          border: 2px solid rgba(13, 148, 136, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 12px;
          color: var(--color-teal);
          transition: all 0.3s ease;
        }

        .step-item.active {
          transform: translateX(8px);
        }

        .step-item.active::before {
          background: linear-gradient(135deg, var(--color-teal) 0%, #0a8173 100%);
          color: white;
          border-color: var(--color-teal);
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
        }

        .step-title {
          margin: 0 0 8px 0;
          font-weight: 700;
          font-size: 18px;
          color: var(--color-navy);
          transition: all 0.3s ease;
        }

        .step-item.active .step-title {
          color: var(--color-teal);
        }

        .step-description {
          margin: 0;
          font-size: 14px;
          color: var(--color-gray-600);
          line-height: 1.6;
          opacity: 0.6;
          transition: all 0.3s ease;
        }

        .step-item.active .step-description {
          opacity: 1;
          color: var(--color-gray-700);
        }

        .animation-container {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(13, 148, 136, 0.05) 0%, rgba(13, 148, 136, 0.02) 100%);
          border-radius: 16px;
          border: 1px solid rgba(13, 148, 136, 0.1);
          overflow: hidden;
        }

        .animation-icon {
          font-family: "Material Symbols Rounded";
          font-size: 120px;
          font-weight: 700;
          transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          opacity: 0;
          transform: scale(0) rotate(-180deg);
          position: absolute;
        }

        .animation-icon.active {
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }

        .step-connector {
          position: absolute;
          left: 14px;
          top: 42px;
          width: 0;
          height: 48px;
          border-left: 2px solid var(--color-gray-200);
          transition: border-color 0.3s ease;
          pointer-events: none;
        }

        .step-item:last-child .step-connector {
          display: none;
        }

        .step-item.active ~ .step-item .step-connector,
        .step-item.active .step-connector {
          border-color: var(--color-teal);
        }

        .animation-glow {
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          transition: all 0.6s ease;
          pointer-events: none;
        }

        @media (max-width: 768px) {
          .how-it-works-grid {
            grid-template-columns: 1fr !important;
          }

          .animation-container {
            display: none;
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
          Get real feedback from authentic personas in three powerful steps.
        </p>

        <div
          className="how-it-works-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-4xl)",
            alignItems: "start",
          }}
        >
          {/* Left side - Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
            {STEPS.map((step, idx) => (
              <div key={idx} style={{ position: "relative" }}>
                <div
                  className={`step-item ${activeStep === idx ? "active" : ""}`}
                  onClick={() => setActiveStep(idx)}
                  onMouseEnter={() => setActiveStep(idx)}
                >
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-description">{step.description}</p>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className="step-connector"
                    style={{
                      borderColor:
                        activeStep === idx || activeStep === idx + 1
                          ? "var(--color-teal)"
                          : "var(--color-gray-200)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Right side - Animation */}
          <div className="animation-container">
            {STEPS.map((step, idx) => (
              <div
                key={idx}
                className={`animation-icon ${activeStep === idx ? "active" : ""}`}
                style={{
                  color: step.color,
                }}
              >
                {step.icon}
              </div>
            ))}

            {/* Animated background glow */}
            <div
              className="animation-glow"
              style={{
                background: `radial-gradient(circle, ${STEPS[activeStep].color}20 0%, transparent 70%)`,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
