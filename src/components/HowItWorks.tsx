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
          content: attr(data-number);
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
          font-weight: 700;
          font-size: 14px;
          color: var(--color-teal);
          transition: all 0.3s ease;
          line-height: 1;
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
          height: 100%;
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(13, 148, 136, 0.05) 0%, rgba(13, 148, 136, 0.02) 100%);
          border-radius: 16px;
          border: 1px solid rgba(13, 148, 136, 0.1);
          overflow: hidden;
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
            alignItems: "stretch",
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
                  data-number={step.number}
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
            {/* Step 1: Recruit The Panel - Animated avatars with person icons */}
            {activeStep === 0 && (
              <svg
                viewBox="0 0 300 300"
                style={{
                  width: "280px",
                  height: "280px",
                  position: "absolute",
                }}
              >
                <defs>
                  <style>{`
                    @keyframes popIn {
                      0% { r: 0; opacity: 0; }
                      60% { r: 28px; }
                      100% { r: 24px; opacity: 1; }
                    }
                    @keyframes float {
                      0%, 100% { transform: translateY(0px); }
                      50% { transform: translateY(-10px); }
                    }
                    .avatar { animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
                    .avatar-group { animation: float 3s ease-in-out infinite; }
                    .person-icon { font-family: "Material Symbols Rounded"; font-size: 28px; font-weight: 700; }
                  `}</style>
                </defs>
                <g className="avatar-group">
                  {/* Avatar 1 */}
                  <circle cx="90" cy="120" r="24" fill="#0d9488" className="avatar" style={{ animationDelay: "0s" }} />
                  <g style={{ animationDelay: "0s" }}>
                    <circle cx="90" cy="113" r="6" fill="white" />
                    <path d="M85 122 Q85 125 90 125 Q95 125 95 122" fill="white" />
                  </g>

                  {/* Avatar 2 */}
                  <circle cx="150" cy="100" r="24" fill="#0a8173" className="avatar" style={{ animationDelay: "0.1s" }} />
                  <g style={{ animationDelay: "0.1s" }}>
                    <circle cx="150" cy="93" r="6" fill="white" />
                    <path d="M145 102 Q145 105 150 105 Q155 105 155 102" fill="white" />
                  </g>

                  {/* Avatar 3 */}
                  <circle cx="210" cy="120" r="24" fill="#067d6e" className="avatar" style={{ animationDelay: "0.2s" }} />
                  <g style={{ animationDelay: "0.2s" }}>
                    <circle cx="210" cy="113" r="6" fill="white" />
                    <path d="M205 122 Q205 125 210 125 Q215 125 215 122" fill="white" />
                  </g>

                  {/* Avatar 4 */}
                  <circle cx="120" cy="180" r="24" fill="#0d9488" className="avatar" style={{ animationDelay: "0.15s" }} />
                  <g style={{ animationDelay: "0.15s" }}>
                    <circle cx="120" cy="173" r="6" fill="white" />
                    <path d="M115 182 Q115 185 120 185 Q125 185 125 182" fill="white" />
                  </g>

                  {/* Avatar 5 */}
                  <circle cx="180" cy="180" r="24" fill="#0a8173" className="avatar" style={{ animationDelay: "0.25s" }} />
                  <g style={{ animationDelay: "0.25s" }}>
                    <circle cx="180" cy="173" r="6" fill="white" />
                    <path d="M175 182 Q175 185 180 185 Q185 185 185 182" fill="white" />
                  </g>
                </g>
              </svg>
            )}

            {/* Step 2: Define Study & Survey - Animated survey form */}
            {activeStep === 1 && (
              <svg
                viewBox="0 0 300 300"
                style={{
                  width: "280px",
                  height: "280px",
                  position: "absolute",
                }}
              >
                <defs>
                  <style>{`
                    @keyframes slideInLine {
                      0% { strokeDashoffset: 100; opacity: 0; }
                      100% { strokeDashoffset: 0; opacity: 1; }
                    }
                    @keyframes checkmark {
                      0% { strokeDashoffset: 30; }
                      100% { strokeDashoffset: 0; }
                    }
                    .question { animation: slideInLine 0.8s ease-out both; }
                    .check { animation: checkmark 0.6s ease-out both; }
                  `}</style>
                </defs>
                {/* Form background */}
                <rect x="60" y="60" width="180" height="180" rx="12" fill="rgba(13, 148, 136, 0.1)" stroke="#0d9488" strokeWidth="2" />

                {/* Question lines */}
                <line x1="85" y1="95" x2="145" y2="95" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" className="question" style={{ animationDelay: "0s" }} strokeDasharray="100" />
                <line x1="85" y1="130" x2="215" y2="130" stroke="#0a8173" strokeWidth="3" strokeLinecap="round" className="question" style={{ animationDelay: "0.2s" }} strokeDasharray="100" />
                <line x1="85" y1="165" x2="215" y2="165" stroke="#067d6e" strokeWidth="3" strokeLinecap="round" className="question" style={{ animationDelay: "0.4s" }} strokeDasharray="100" />

                {/* Checkmarks */}
                <g>
                  <path d="M215 90 L225 100 L235 85" stroke="#0d9488" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" className="check" style={{ animationDelay: "0.6s" }} strokeDasharray="30" />
                  <path d="M215 125 L225 135 L235 120" stroke="#0a8173" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" className="check" style={{ animationDelay: "0.8s" }} strokeDasharray="30" />
                  <path d="M215 160 L225 170 L235 155" stroke="#067d6e" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" className="check" style={{ animationDelay: "1s" }} strokeDasharray="30" />
                </g>
              </svg>
            )}

            {/* Step 3: Analyze & Conclude - Animated bar chart */}
            {activeStep === 2 && (
              <svg
                viewBox="0 0 300 300"
                style={{
                  width: "280px",
                  height: "280px",
                  position: "absolute",
                }}
              >
                <defs>
                  <style>{`
                    @keyframes growBar {
                      0% { height: 0; }
                      100% { height: var(--bar-height); }
                    }
                    .bar { animation: growBar 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
                    @keyframes pulse {
                      0%, 100% { opacity: 1; }
                      50% { opacity: 0.5; }
                    }
                    .pulse-dot { animation: pulse 2s ease-in-out infinite; }
                  `}</style>
                </defs>

                {/* Axis */}
                <line x1="70" y1="70" x2="70" y2="220" stroke="#0d9488" strokeWidth="2" />
                <line x1="70" y1="220" x2="230" y2="220" stroke="#0d9488" strokeWidth="2" />

                {/* Bar 1 */}
                <rect x="95" y="140" width="30" height="80" fill="#0d9488" className="bar" style={{"--bar-height": "80px", animationDelay: "0s"} as any} rx="4" />

                {/* Bar 2 */}
                <rect x="140" y="100" width="30" height="120" fill="#0a8173" className="bar" style={{"--bar-height": "120px", animationDelay: "0.2s"} as any} rx="4" />

                {/* Bar 3 */}
                <rect x="185" y="80" width="30" height="140" fill="#067d6e" className="bar" style={{"--bar-height": "140px", animationDelay: "0.4s"} as any} rx="4" />

                {/* Data points */}
                <circle cx="110" cy="135" r="4" fill="#0d9488" className="pulse-dot" style={{ animationDelay: "0.6s" }} />
                <circle cx="155" cy="95" r="4" fill="#0a8173" className="pulse-dot" style={{ animationDelay: "0.8s" }} />
                <circle cx="200" cy="75" r="4" fill="#067d6e" className="pulse-dot" style={{ animationDelay: "1s" }} />
              </svg>
            )}

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
