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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
          cursor: "text",
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(13, 148, 136, 0.02) 100%)",
          boxShadow: "0 8px 32px -8px rgba(13, 148, 136, 0.15)",
          backdropFilter: "blur(10px)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 12px 48px -12px rgba(13, 148, 136, 0.25)";
          e.currentTarget.style.borderColor = "var(--color-teal)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 8px 32px -8px rgba(13, 148, 136, 0.15)";
          e.currentTarget.style.borderColor = "var(--color-gray-200)";
        }}
      >
        <textarea
          ref={textareaRef}
          value={isEditing ? userInput : currentText}
          onChange={(e) => setUserInput(e.target.value)}
          onFocus={() => {
            if (!isEditing) {
              shouldAnimateRef.current = false;
              timeoutRefsRef.current.forEach((id) => clearTimeout(id));
              timeoutRefsRef.current = [];
              setIsEditing(true);
            }
          }}
          placeholder="Type your use case..."
          disabled={false}
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
            cursor: "text",
          }}
        />
        <Link
          href="/waitlist"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, var(--color-teal) 0%, #0a8173 100%)",
            color: "var(--color-white)",
            border: "none",
            borderRadius: "0.375rem",
            padding: "var(--space-base) var(--space-lg)",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            textDecoration: "none",
            cursor: "pointer",
            transition: "all 0.3s ease",
            whiteSpace: "nowrap",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(13, 148, 136, 0.3)",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            const target = e.currentTarget as HTMLAnchorElement;
            target.style.transform = "translateY(-2px)";
            target.style.boxShadow = "0 8px 20px rgba(13, 148, 136, 0.5)";
          }}
          onMouseLeave={(e) => {
            const target = e.currentTarget as HTMLAnchorElement;
            target.style.transform = "translateY(0)";
            target.style.boxShadow = "0 4px 12px rgba(13, 148, 136, 0.3)";
          }}
        >
          Try For Free
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
