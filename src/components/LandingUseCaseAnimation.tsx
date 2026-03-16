"use client";

import { useState, useEffect, useRef } from "react";

const PHASES = {
  USER_ASK: 0,
  FOUND: 1,
  VALIDATE: 2,
  RESULT_1: 3,
  RESULT_2: 4,
  ELLIPSIS: 5,
  USER_SUMMARIZE: 6,
  CAPY_SUMMARY: 7,
  DONE: 8,
} as const;

type Phase = (typeof PHASES)[keyof typeof PHASES];

const USER_ASK_TEXT =
  "get me 10 personas in US, used carpooling service to get to ski resort";
const VALIDATE_TEXT = "@all_participants what was the last time carpooling didn't work?";
const RESULT_1 = "no one is on time, always need to wait in the mountain at the parking lot";
const RESULT_2 =
  "i ski with my team mostly but when i used carpool, i hate it when other rider's skis scratch my car";
const USER_SUMMARIZE_TEXT = "capysan! summarize and highlight painpoints";
const CAPY_SUMMARY = {
  painpoint:
    "Pain points: unreliable timing, vehicle damage from gear. Skiers need coordination + protection.",
  actions: ["Add ETA sync & reminders", "Offer gear covers or roof racks"],
};

const TYPING_MS = 30;
const PHASE_DELAY_MS = 550;

export function LandingUseCaseAnimation() {
  const [phase, setPhase] = useState<Phase>(PHASES.USER_ASK);
  const [typedLength, setTypedLength] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll only the animation container to bottom (not the page)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [phase, typedLength]);

  // Phase 1: Type user ask
  useEffect(() => {
    if (phase !== PHASES.USER_ASK) return;
    if (typedLength >= USER_ASK_TEXT.length) {
      const t = setTimeout(() => setPhase(PHASES.FOUND), PHASE_DELAY_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTypedLength((n) => n + 1), TYPING_MS);
    return () => clearTimeout(t);
  }, [phase, typedLength]);

  // Phase 2 → 8: Advance phases
  useEffect(() => {
    if (phase === PHASES.USER_ASK || phase === PHASES.DONE) return;
    const next: Record<Phase, Phase | null> = {
      [PHASES.USER_ASK]: null,
      [PHASES.FOUND]: PHASES.VALIDATE,
      [PHASES.VALIDATE]: PHASES.RESULT_1,
      [PHASES.RESULT_1]: PHASES.RESULT_2,
      [PHASES.RESULT_2]: PHASES.ELLIPSIS,
      [PHASES.ELLIPSIS]: PHASES.USER_SUMMARIZE,
      [PHASES.USER_SUMMARIZE]: PHASES.CAPY_SUMMARY,
      [PHASES.CAPY_SUMMARY]: PHASES.DONE,
      [PHASES.DONE]: null,
    };
    const nextPhase = next[phase];
    if (!nextPhase) return;
    const t = setTimeout(() => setPhase(nextPhase), PHASE_DELAY_MS);
    return () => clearTimeout(t);
  }, [phase]);


  return (
    <div
      style={{
        width: "min(66.67vw, 1100px)",
        minWidth: "320px",
        margin: "0 auto",
        background: "var(--color-white)",
        border: "1px solid var(--color-gray-200)",
        borderRadius: "0.75rem",
        boxShadow: "var(--shadow-lg)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "var(--space-sm) var(--space-base)",
          borderBottom: "1px solid var(--color-gray-100)",
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          color: "var(--color-gray-500)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Early Stage Idea Validation
      </div>

      <div
        ref={scrollContainerRef}
        style={{
          maxHeight: "320px",
          overflowY: "auto",
          padding: "var(--space-lg)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-base)",
          scrollBehavior: "smooth",
        }}
      >
        {/* User ask */}
        <div style={{ alignSelf: "flex-end", maxWidth: "90%", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-gray-500)", marginBottom: "2px" }}>You</span>
          <div
            style={{
              padding: "var(--space-sm) var(--space-base)",
              background: "var(--color-teal)",
              color: "var(--color-white)",
              borderRadius: "0.75rem 0.75rem 0.25rem 0.75rem",
              fontSize: "var(--text-sm)",
              lineHeight: 1.5,
            }}
          >
            {USER_ASK_TEXT.slice(0, typedLength)}
            <span
              style={{
                opacity:
                  phase === PHASES.USER_ASK && typedLength < USER_ASK_TEXT.length
                    ? 1
                    : 0,
                animation: "blink 0.8s step-end infinite",
              }}
            >
              |
            </span>
          </div>
        </div>

        {/* Found */}
        {phase >= PHASES.FOUND && (
          <div style={{ alignSelf: "flex-start", maxWidth: "90%", display: "flex", flexDirection: "column", gap: "var(--space-sm)", animation: "fadeIn 0.3s ease-out" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-gray-500)", marginBottom: "2px", display: "block" }}>Capysan</span>
            <div
              style={{
                padding: "var(--space-xs) var(--space-sm)",
                background: "var(--color-gray-50)",
                color: "var(--color-gray-600)",
                borderRadius: "0.5rem",
                fontSize: "var(--text-xs)",
                lineHeight: 1.5,
                borderLeft: "3px solid var(--color-teal)",
              }}
            >
              <span style={{ fontWeight: 600, color: "var(--color-gray-500)" }}>Reasoning:</span> get_demographic_segments → location, profession, interests. search_clones: Whistler, Big Sky, carpooling. Found 10.
            </div>
            <div
              style={{
                padding: "var(--space-xs) var(--space-sm)",
                background: "var(--color-gray-50)",
                color: "var(--color-gray-600)",
                borderRadius: "0.5rem",
                fontSize: "var(--text-xs)",
                lineHeight: 1.5,
              }}
            >
              Recruited Persona 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 to the studyroom.
            </div>
            <div
              style={{
                padding: "var(--space-sm) var(--space-base)",
                background: "var(--color-gray-100)",
                color: "var(--color-gray-600)",
                borderRadius: "0.75rem 0.75rem 0.75rem 0.25rem",
                fontSize: "var(--text-sm)",
                lineHeight: 1.5,
              }}
            >
              Recruited 10 personas that skied in Whistler, BC, Big Sky, MT, and used carpooling before.
            </div>
          </div>
        )}

        {/* Validate - from User */}
        {phase >= PHASES.VALIDATE && (
          <div style={{ alignSelf: "flex-end", maxWidth: "90%", display: "flex", flexDirection: "column", alignItems: "flex-end", animation: "fadeIn 0.3s ease-out" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-gray-500)", marginBottom: "2px" }}>You</span>
            <div
              style={{
                padding: "var(--space-sm) var(--space-base)",
                background: "var(--color-teal)",
                color: "var(--color-white)",
                borderRadius: "0.75rem 0.75rem 0.25rem 0.75rem",
                fontSize: "var(--text-sm)",
                lineHeight: 1.5,
              }}
            >
              {VALIDATE_TEXT}
            </div>
          </div>
        )}

        {/* Result 1 */}
        {phase >= PHASES.RESULT_1 && (
          <div style={{ alignSelf: "flex-start", maxWidth: "90%", animation: "fadeIn 0.3s ease-out" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-gray-500)", marginBottom: "2px", display: "block" }}>Persona 1</span>
            <div
              style={{
                padding: "var(--space-sm) var(--space-base)",
                background: "var(--color-white)",
                border: "1px solid var(--color-gray-200)",
                color: "var(--color-navy)",
                borderRadius: "0.75rem 0.75rem 0.75rem 0.25rem",
                fontSize: "var(--text-sm)",
                lineHeight: 1.5,
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {RESULT_1}
            </div>
          </div>
        )}

        {/* Result 2 */}
        {phase >= PHASES.RESULT_2 && (
          <div style={{ alignSelf: "flex-start", maxWidth: "90%", animation: "fadeIn 0.3s ease-out" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-gray-500)", marginBottom: "2px", display: "block" }}>Persona 2</span>
            <div
              style={{
                padding: "var(--space-sm) var(--space-base)",
                background: "var(--color-white)",
                border: "1px solid var(--color-gray-200)",
                color: "var(--color-navy)",
                borderRadius: "0.75rem 0.75rem 0.75rem 0.25rem",
                fontSize: "var(--text-sm)",
                lineHeight: 1.5,
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {RESULT_2}
            </div>
          </div>
        )}

        {/* Ellipsis - more responses */}
        {phase >= PHASES.ELLIPSIS && (
          <div
            style={{
              alignSelf: "flex-start",
              fontSize: "var(--text-sm)",
              color: "var(--color-gray-400)",
              animation: "fadeIn 0.3s ease-out",
            }}
          >
            ...
          </div>
        )}

        {/* User summarize */}
        {phase >= PHASES.USER_SUMMARIZE && (
          <div style={{ alignSelf: "flex-end", maxWidth: "90%", display: "flex", flexDirection: "column", alignItems: "flex-end", animation: "fadeIn 0.3s ease-out" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-gray-500)", marginBottom: "2px" }}>You</span>
            <div
              style={{
                padding: "var(--space-sm) var(--space-base)",
                background: "var(--color-teal)",
                color: "var(--color-white)",
                borderRadius: "0.75rem 0.75rem 0.25rem 0.75rem",
                fontSize: "var(--text-sm)",
                lineHeight: 1.5,
              }}
            >
              {USER_SUMMARIZE_TEXT}
            </div>
          </div>
        )}

        {/* Capy summary */}
        {phase >= PHASES.CAPY_SUMMARY && (
          <div style={{ alignSelf: "flex-start", maxWidth: "90%", animation: "fadeIn 0.3s ease-out" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-gray-500)", marginBottom: "2px", display: "block" }}>Capysan</span>
            <div
              style={{
                padding: "var(--space-base)",
                background: "var(--color-navy)",
                color: "var(--color-white)",
                borderRadius: "0.75rem 0.75rem 0.75rem 0.25rem",
                fontSize: "var(--text-sm)",
                lineHeight: 1.6,
              }}
            >
            <div style={{ fontWeight: 600, marginBottom: "var(--space-xs)" }}>
              Pain points
            </div>
            <div style={{ marginBottom: "var(--space-sm)", color: "var(--color-gray-300)" }}>
              {CAPY_SUMMARY.painpoint}
            </div>
            <div style={{ fontWeight: 600, marginBottom: "var(--space-xs)" }}>
              Actionable
            </div>
            <ul style={{ margin: 0, paddingLeft: "var(--space-base)", color: "var(--color-gray-300)" }}>
              {CAPY_SUMMARY.actions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
