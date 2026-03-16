"use client";

import React, { useState, useRef, useEffect } from "react";

function MomTestTooltip() {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!show) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show]);

  return (
    <span ref={ref} style={{ position: "relative", display: "inline" }}>
      <button
        type="button"
        onClick={() => setShow(!show)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textDecoration: "underline",
          textDecorationStyle: "dotted",
          font: "inherit",
          color: "inherit",
        }}
      >
        The Mom Test
      </button>
      {show && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "100%",
            marginTop: "var(--space-xs)",
            padding: "var(--space-sm) var(--space-base)",
            backgroundColor: "var(--color-navy)",
            color: "var(--color-white)",
            fontSize: "var(--text-xs)",
            lineHeight: 1.4,
            borderRadius: "0.375rem",
            boxShadow: "var(--shadow-md)",
            width: "max-content",
            maxWidth: 220,
            zIndex: 10,
          }}
        >
          A customer interview framework: ask about past behavior and problems, not opinions—so you get honest feedback.
        </div>
      )}
    </span>
  );
}

const ROWS: {
  perspective: string;
  capysan: { content: React.ReactNode };
  traditionalAI: { content: React.ReactNode; sentiment: "good" | "bad" };
  manual: { good: React.ReactNode | null; bad: React.ReactNode | null };
}[] = [
  {
    perspective: "User Experience",
    capysan: {
      content: <>Persona-Level Conversationsal Response. Refreshingly simple to understand and act on.</>,
    },
    traditionalAI: {
      content: <>High barrier to digest, not actionable</>,
      sentiment: "bad",
    },
    manual: { good: null, bad: <>Not introvert friendly, requires interview skills to pass <MomTestTooltip />.</> },
  },
  {
    perspective: "Audience Sourcing",
    capysan: {
      content: <><strong>Recruit ICP aligned personas</strong> in seconds.</>,
    },
    traditionalAI: {
      content: <>Can&apos;t simulate <strong>niche audiences</strong>.</>,
      sentiment: "bad",
    },
    manual: { good: null, bad: <><strong>Days/weeks</strong> to source.</> },
  },
  {
    perspective: "Insight Fidelity",
    capysan: {
      content: <><strong>Individual-Level, Anonamized Real human data.</strong> Brutally honest. future proofing.</>,
    },
    traditionalAI: {
      content: <><strong>AI politeness, aggregated, only retrospective</strong> No depth.</>,
      sentiment: "bad",
    },
    manual: { good: <>High fidelity</>, bad: null },
  },
  {
    perspective: "Research Velocity",
    capysan: {
      content: <><strong>24/7.</strong> No scheduling. Respond instantly.</>,
    },
    traditionalAI: {
      content: <><strong>10+ min</strong> per analysis.</>,
      sentiment: "good",
    },
    manual: { good: null, bad: <> 15-min windows. Hard to reach.</> },
  },
];

const styles = {
  good: {
    bg: "#ecfdf5",
    border: "#10b981",
    text: "#065f46",
  },
  bad: {
    bg: "#fef2f2",
    border: "#ef4444",
    text: "#991b1b",
  },
};

function CellGood({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: styles.good.bg,
        borderLeft: `4px solid ${styles.good.border}`,
        color: styles.good.text,
        padding: "var(--space-base) var(--space-lg)",
        borderRadius: "0 0.375rem 0.375rem 0",
        fontSize: "var(--text-sm)",
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  );
}

function CellBad({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: styles.bad.bg,
        borderLeft: `4px solid ${styles.bad.border}`,
        color: styles.bad.text,
        padding: "var(--space-base) var(--space-lg)",
        borderRadius: "0 0.375rem 0.375rem 0",
        fontSize: "var(--text-sm)",
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  );
}

export function LandingCompetitiveAnalysis() {
  return (
    <section
      style={{
        padding: "var(--space-4xl) var(--space-xl)",
        backgroundColor: "var(--color-white)",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h2
          style={{
            textAlign: "center",
            marginBottom: "var(--space-base)",
            fontSize: "var(--text-3xl)",
            fontWeight: 700,
          }}
        >
          How Capysan Compares
        </h2>
        <p
          style={{
            textAlign: "center",
            marginBottom: "var(--space-3xl)",
            color: "var(--color-gray-500)",
            fontSize: "var(--text-lg)",
          }}
        >
          See why Capysan exceed at early stage idea validation
        </p>

        <div
          style={{
            overflowX: "auto",
            borderRadius: "0.5rem",
            border: "1px solid var(--color-gray-200)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 640,
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "var(--color-navy)",
                  color: "var(--color-white)",
                }}
              >
                <th
                  style={{
                    padding: "var(--space-lg) var(--space-xl)",
                    textAlign: "left",
                    fontWeight: 600,
                    fontSize: "var(--text-sm)",
                    width: "18%",
                  }}
                >
                  Perspective
                </th>
                <th
                  style={{
                    padding: "var(--space-lg) var(--space-xl)",
                    textAlign: "left",
                    fontWeight: 600,
                    fontSize: "var(--text-sm)",
                    width: "27%",
                    backgroundColor: "rgba(13, 148, 136, 0.2)",
                  }}
                >
                  Capysan
                </th>
                <th
                  style={{
                    padding: "var(--space-lg) var(--space-xl)",
                    textAlign: "left",
                    fontWeight: 600,
                    fontSize: "var(--text-sm)",
                    width: "27%",
                  }}
                >
                  Traditional AI Tools
                </th>
                <th
                  style={{
                    padding: "var(--space-lg) var(--space-xl)",
                    textAlign: "left",
                    fontWeight: 600,
                    fontSize: "var(--text-sm)",
                    width: "28%",
                  }}
                >
                  Manual Interviews
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr
                  key={row.perspective}
                  style={{
                    backgroundColor: i % 2 === 1 ? "var(--color-gray-50)" : "var(--color-white)",
                  }}
                >
                  <td
                    style={{
                      padding: "var(--space-base) var(--space-xl)",
                      fontWeight: 600,
                      fontSize: "var(--text-sm)",
                      color: "var(--color-navy)",
                      verticalAlign: "top",
                    }}
                  >
                    {row.perspective}
                  </td>
                  <td style={{ padding: "var(--space-sm)", verticalAlign: "top" }}>
                    <CellGood>{row.capysan.content}</CellGood>
                  </td>
                  <td style={{ padding: "var(--space-sm)", verticalAlign: "top" }}>
                    {row.traditionalAI.sentiment === "good" ? (
                      <CellGood>{row.traditionalAI.content}</CellGood>
                    ) : (
                      <CellBad>{row.traditionalAI.content}</CellBad>
                    )}
                  </td>
                  <td style={{ padding: "var(--space-sm)", verticalAlign: "top" }}>
                    {row.manual.good ? (
                      <CellGood>{row.manual.good}</CellGood>
                    ) : row.manual.bad ? (
                      <CellBad>{row.manual.bad}</CellBad>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
