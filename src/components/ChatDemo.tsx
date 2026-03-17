"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const USE_CASES = [
  "Recruit 50 participants who's interested in Skiing, lives in north america, and complete this google form, https://forms.gle/example",
  "I need 20 personas who drinks starbucks coffee, help me do a sales pitch A/B test.",
];

const TYPING_SPEED = 25;
const PAUSE_BETWEEN_MESSAGES = 800;
const PAUSE_BEFORE_CLEAR = 3500;
const CLEAR_SPEED = 12;
const PAUSE_BETWEEN_CYCLES = 1500;

export function ChatDemo() {
  const [currentText, setCurrentText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const timeoutRefsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const shouldAnimateRef = useRef(true);

  useEffect(() => {
    const clearTimeouts = () => {
      timeoutRefsRef.current.forEach((id) => clearTimeout(id));
      timeoutRefsRef.current = [];
    };

    const delay = (ms: number) =>
      new Promise((resolve) => {
        const timeoutId = setTimeout(resolve, ms);
        timeoutRefsRef.current.push(timeoutId);
      });

    const typeMessage = async (fullText: string) => {
      for (let i = 0; i <= fullText.length; i++) {
        setCurrentText(fullText.slice(0, i));
        await delay(TYPING_SPEED);
      }
    };

    const deleteMessage = async (fullText: string) => {
      for (let i = fullText.length; i >= 0; i--) {
        setCurrentText(fullText.slice(0, i));
        await delay(CLEAR_SPEED);
      }
    };

    const runCycle = async () => {
      // Type out each message sequentially
      for (let i = 0; i < USE_CASES.length; i++) {
        if (!shouldAnimateRef.current) return; // Stop if user started editing
        await typeMessage(USE_CASES[i]);
        if (i < USE_CASES.length - 1) {
          await delay(PAUSE_BETWEEN_MESSAGES);
        }
      }

      if (!shouldAnimateRef.current) return;

      // View all messages
      await delay(PAUSE_BEFORE_CLEAR);

      if (!shouldAnimateRef.current) return;

      // Delete the last message
      await deleteMessage(USE_CASES[USE_CASES.length - 1]);
      setCurrentText("");

      // Pause before next cycle
      await delay(PAUSE_BETWEEN_CYCLES);

      if (!shouldAnimateRef.current) return;

      // Restart
      runCycle();
    };

    runCycle();

    return clearTimeouts;
  }, []);

  return (
    <div
      style={{
        marginTop: "var(--space-4xl)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-2xl)",
        position: "relative",
      }}
    >
      {/* Input Demo - Text appears IN the textarea */}
      <div
        style={{
          width: "min(66.67vw, 600px)",
          minWidth: "320px",
          display: "flex",
          alignItems: "flex-end",
          gap: "var(--space-sm)",
          padding: "var(--space-base) var(--space-lg)",
          border: "1px solid var(--color-gray-200)",
          borderRadius: "0.5rem",
          cursor: isEditing ? "text" : "pointer",
        }}
        onClick={() => {
          if (!isEditing) {
            shouldAnimateRef.current = false;
            // Clear all pending timeouts
            timeoutRefsRef.current.forEach((id) => clearTimeout(id));
            timeoutRefsRef.current = [];
            setIsEditing(true);
          }
        }}
      >
        <textarea
          value={isEditing ? userInput : currentText}
          onChange={(e) => isEditing && setUserInput(e.target.value)}
          placeholder="Type your use case..."
          disabled={!isEditing}
          style={{
            flex: 1,
            padding: "var(--space-sm) 0",
            border: "none",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            color: "var(--color-navy)",
            resize: "none",
            transition: "all 0.2s ease",
            minHeight: "44px",
            maxHeight: "120px",
            outline: "none",
            backgroundColor: "transparent",
            cursor: isEditing ? "text" : "pointer",
          }}
        />
        <Link
          href="/waitlist"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
              !isEditing || !userInput.trim()
                ? "var(--color-gray-300)"
                : "var(--color-teal)",
            color: "var(--color-white)",
            border: "none",
            borderRadius: "0.375rem",
            padding: "var(--space-sm) var(--space-base)",
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            textDecoration: "none",
            cursor:
              !isEditing || !userInput.trim() ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
            flexShrink: 0,
            opacity: !isEditing || !userInput.trim() ? 0.6 : 1,
            pointerEvents:
              !isEditing || !userInput.trim() ? "none" : "auto",
          }}
          onMouseEnter={(e) => {
            if (isEditing && userInput.trim()) {
              const target = e.currentTarget as HTMLAnchorElement;
              target.style.backgroundColor = "var(--color-teal-light)";
            }
          }}
          onMouseLeave={(e) => {
            if (isEditing && userInput.trim()) {
              const target = e.currentTarget as HTMLAnchorElement;
              target.style.backgroundColor = "var(--color-teal)";
            }
          }}
        >
          Send
        </Link>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blink {
          0%, 50% {
            opacity: 1;
          }
          51%, 100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
