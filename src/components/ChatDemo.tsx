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
  const [displayedMessages, setDisplayedMessages] = useState<string[]>([]);
  const [showCTA, setShowCTA] = useState(false);
  const timeoutRefsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

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

    const typeMessage = async (fullText: string, messageIndex: number) => {
      for (let i = 0; i <= fullText.length; i++) {
        setDisplayedMessages((prev) => {
          const updated = [...prev];
          updated[messageIndex] = fullText.slice(0, i);
          return updated;
        });
        await delay(TYPING_SPEED);
      }
    };

    const deleteMessage = async (fullText: string, messageIndex: number) => {
      for (let i = fullText.length; i >= 0; i--) {
        setDisplayedMessages((prev) => {
          const updated = [...prev];
          updated[messageIndex] = fullText.slice(0, i);
          return updated;
        });
        await delay(CLEAR_SPEED);
      }
    };

    const runCycle = async () => {
      // Type out each message
      for (let i = 0; i < USE_CASES.length; i++) {
        await typeMessage(USE_CASES[i], i);
        if (i < USE_CASES.length - 1) {
          await delay(PAUSE_BETWEEN_MESSAGES);
        }
      }

      // View all messages
      await delay(PAUSE_BEFORE_CLEAR);

      // Delete messages in order
      for (let i = 0; i < USE_CASES.length; i++) {
        await deleteMessage(USE_CASES[i], i);
      }

      // Clear array
      setDisplayedMessages([]);

      // Pause before next cycle
      await delay(PAUSE_BETWEEN_CYCLES);

      // Restart
      runCycle();
    };

    runCycle();

    return clearTimeouts;
  }, []);

  // Show CTA after initial delay
  useEffect(() => {
    const ctaTimer = setTimeout(() => {
      setShowCTA(true);
    }, 6500);

    return () => clearTimeout(ctaTimer);
  }, []);

  return (
    <div
      style={{
        marginTop: "var(--space-4xl)",
        width: "100vw",
        position: "relative",
        left: "50%",
        right: "50%",
        marginLeft: "-50vw",
        marginRight: "-50vw",
        display: "flex",
        justifyContent: "center",
        padding: "var(--space-2xl) var(--space-xl)",
      }}
    >
      <div
        style={{
          width: "min(66.67vw, 700px)",
          minWidth: "320px",
          backgroundColor: "var(--color-gray-900)",
          borderRadius: "0.75rem",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--color-gray-700)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Chat Header */}
        <div
          style={{
            borderBottom: "1px solid var(--color-gray-700)",
            padding: "var(--space-lg) var(--space-xl)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "var(--color-teal)",
            }}
          />
          <span
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-gray-300)",
              fontWeight: 500,
            }}
          >
            Capybara AI
          </span>
        </div>

        {/* Messages Area */}
        <div
          style={{
            padding: "var(--space-2xl) var(--space-xl)",
            minHeight: "200px",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-lg)",
            justifyContent: "flex-start",
          }}
        >
          {displayedMessages.map((message, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: "flex-start",
                animation: `fadeIn 0.2s ease-in`,
              }}
            >
              <div
                style={{
                  maxWidth: "85%",
                  backgroundColor: "var(--color-gray-800)",
                  borderRadius: "0.5rem",
                  padding: "var(--space-base) var(--space-lg)",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                <p
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-gray-200)",
                    margin: 0,
                    lineHeight: 1.5,
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  }}
                >
                  {message}
                  {index === displayedMessages.length - 1 && message.length > 0 && (
                    <span
                      style={{
                        display: "inline-block",
                        width: "2px",
                        height: "1em",
                        backgroundColor: "var(--color-teal)",
                        marginLeft: "2px",
                        animation: "blink 1s infinite",
                      }}
                    />
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input Area (Placeholder) */}
        <div
          style={{
            borderTop: "1px solid var(--color-gray-700)",
            padding: "var(--space-lg) var(--space-xl)",
            display: "flex",
            gap: "var(--space-sm)",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Type your use case..."
            disabled
            style={{
              flex: 1,
              backgroundColor: "var(--color-gray-800)",
              border: "1px solid var(--color-gray-700)",
              borderRadius: "0.375rem",
              padding: "var(--space-base) var(--space-lg)",
              fontSize: "var(--text-sm)",
              color: "var(--color-gray-400)",
              outline: "none",
              cursor: "not-allowed",
            }}
          />
          <button
            disabled
            style={{
              backgroundColor: "var(--color-gray-700)",
              color: "var(--color-gray-400)",
              border: "none",
              borderRadius: "0.375rem",
              padding: "var(--space-base) var(--space-lg)",
              cursor: "not-allowed",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
            }}
          >
            Send
          </button>
        </div>
      </div>

      {/* CTA Button Below */}
      {showCTA && (
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "50%",
            transform: "translateX(-50%)",
            animation: "fadeInUp 0.4s ease-out",
          }}
        >
          <Link
            href="/waitlist"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--space-base) var(--space-2xl)",
              backgroundColor: "var(--color-teal)",
              color: "var(--color-navy)",
              textDecoration: "none",
              borderRadius: "0.375rem",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              transition: "all 0.2s ease",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              const target = e.currentTarget as HTMLAnchorElement;
              target.style.backgroundColor = "var(--color-teal-light)";
              target.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLAnchorElement;
              target.style.backgroundColor = "var(--color-teal)";
              target.style.transform = "scale(1)";
            }}
          >
            Start Now
          </Link>
        </div>
      )}

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
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
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
