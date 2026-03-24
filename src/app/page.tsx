import Link from "next/link";
import { ChatDemo } from "@/components/ChatDemo";
import { HowItWorks } from "@/components/HowItWorks";
import { RealVsSynthetic } from "@/components/RealVsSynthetic";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div style={{ overflow: "hidden" }}>
      <style>{`
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, rgba(13, 148, 136, 0.1) 0%, rgba(15, 23, 42, 0.05) 100%);
          border: 1px solid rgba(13, 148, 136, 0.2);
          border-radius: 9999px;
          font-size: 0.875rem;
          color: var(--color-teal);
          font-weight: 500;
          animation: slideInDown 0.6s ease-out;
        }

        .hero-title {
          animation: slideInUp 0.6s ease-out 0.1s both;
        }

        .hero-subtitle {
          animation: slideInUp 0.6s ease-out 0.2s both;
        }

        .hero-cta {
          animation: slideInUp 0.6s ease-out 0.3s both;
        }
      `}</style>

      <section
        style={{
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.03) 0%, rgba(13, 148, 136, 0.05) 100%)",
          paddingTop: "var(--space-4xl)",
          paddingBottom: "var(--space-4xl)",
          paddingLeft: "var(--space-xl)",
          paddingRight: "var(--space-xl)",
          position: "relative",
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <div className="hero-badge">
            <span style={{ fontSize: "1.2em" }}>✨</span>
            Real human data at scale
          </div>

          <h1
            className="hero-title"
            style={{
              fontSize: "var(--text-5xl)",
              fontWeight: 800,
              marginBottom: "var(--space-lg)",
              marginTop: "var(--space-2xl)",
              lineHeight: "var(--line-tight)",
              background: "linear-gradient(135deg, var(--color-navy) 0%, var(--color-teal) 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundSize: "100% 100%",
            }}
          >
            User Research with Digital Twins,
            <br />
            Backed by Real Human Data
          </h1>

          <p
            className="hero-subtitle"
            style={{
              fontSize: "var(--text-lg)",
              color: "var(--color-gray-600)",
              marginBottom: "var(--space-3xl)",
              lineHeight: 1.6,
              maxWidth: "600px",
              margin: "0 auto var(--space-3xl)",
            }}
          >
            Digital Twins, not synthetic, each backed by real human data. No fabricated emotion, inconsistent behavior.
          </p>

          <div className="hero-cta">
            <ChatDemo />
          </div>
        </div>
      </section>

      <HowItWorks />

      <RealVsSynthetic />

      <Footer />
    </div>
  );
}
