"use client";

import React from "react";

const COMPARISON_AXES = [
  {
    axis: "Speed",
    description: "Time to recruit ICP-aligned users",
    capysan: "Seconds",
    competitors: "Days to weeks",
  },
  {
    axis: "Accessibility",
    description: "How easily can you find hard-to-reach personas",
    capysan: "Niche audiences instantly available",
    competitors: "Limited or manually sourced",
  },
  {
    axis: "Directness",
    description: "Unfiltered, ego-free feedback without social politeness",
    capysan: "AI personas answer honestly, directly",
    competitors: "Guarded responses, ego-protection bias",
  },
];

function ComparisonRow({ axis, description, capysan, competitors }: typeof COMPARISON_AXES[0]) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "var(--space-lg)",
        padding: "var(--space-2xl)",
        borderBottom: "1px solid var(--color-gray-200)",
      }}
    >
      <div>
        <h3
          style={{
            fontSize: "var(--text-base)",
            fontWeight: 600,
            color: "var(--color-navy)",
            marginBottom: "var(--space-xs)",
          }}
        >
          {axis}
        </h3>
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-gray-500)",
            margin: 0,
          }}
        >
          {description}
        </p>
      </div>

      <div
        style={{
          padding: "var(--space-lg)",
          backgroundColor: "rgba(13, 148, 136, 0.08)",
          borderRadius: "0.375rem",
          borderLeft: "3px solid var(--color-teal)",
        }}
      >
        <p
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            color: "var(--color-navy)",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {capysan}
        </p>
      </div>

      <div
        style={{
          padding: "var(--space-lg)",
          backgroundColor: "var(--color-gray-50)",
          borderRadius: "0.375rem",
          borderLeft: "3px solid var(--color-gray-300)",
        }}
      >
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-gray-600)",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {competitors}
        </p>
      </div>
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
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h2
          style={{
            textAlign: "center",
            marginBottom: "var(--space-base)",
            fontSize: "var(--text-3xl)",
            fontWeight: 700,
            color: "var(--color-navy)",
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
          Three dimensions where Capysan outperforms traditional research methods
        </p>

        <div
          style={{
            border: "1px solid var(--color-gray-200)",
            borderRadius: "0.5rem",
            overflow: "hidden",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {COMPARISON_AXES.map((item) => (
            <ComparisonRow
              key={item.axis}
              axis={item.axis}
              description={item.description}
              capysan={item.capysan}
              competitors={item.competitors}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
