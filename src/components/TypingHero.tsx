"use client";

import { useState, useEffect } from "react";

const STATIC_PREFIX = "Get ";
const TYPING_PART = "Honest, Actionable";
const STATIC_SUFFIX = "Feedback in Seconds.";
const TYPING_DELAY = 80;
const CURSOR_BLINK_MS = 530;

export function TypingHero() {
  const [typedPrefix, setTypedPrefix] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    let charIndex = 0;
    const typeNext = () => {
      if (charIndex < TYPING_PART.length) {
        setTypedPrefix(TYPING_PART.slice(0, charIndex + 1));
        charIndex++;
        setTimeout(typeNext, TYPING_DELAY);
      }
    };
    const startDelay = setTimeout(typeNext, 1500);
    return () => clearTimeout(startDelay);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setCursorVisible((v) => !v), CURSOR_BLINK_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <span style={{ color: "var(--color-teal)" }}>
      {STATIC_PREFIX}
      {typedPrefix}
      <span
        style={{
          opacity: cursorVisible ? 1 : 0,
          transition: "opacity 0.1s",
        }}
      >
        |
      </span>
      {STATIC_SUFFIX}
    </span>
  );
}
