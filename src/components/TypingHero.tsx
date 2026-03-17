"use client";

import { useState, useEffect, useRef } from "react";

const STATIC_PREFIX = "Run ";
const TYPING_OPTIONS = ["Survey", "Customer Interview", "A/B Test"];
const TYPING_DELAY = 80;
const DELETE_DELAY = 50;
const PAUSE_AFTER_TYPE_MS = 1500;
const PAUSE_AFTER_DELETE_MS = 500;
const CURSOR_BLINK_MS = 530;

export function TypingHero() {
  const [typedPart, setTypedPart] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const optionIndexRef = useRef(0);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const currentOption = () =>
      TYPING_OPTIONS[optionIndexRef.current % TYPING_OPTIONS.length];

    const typeNext = (charIndex: number) => {
      const option = currentOption();
      if (charIndex < option.length) {
        setTypedPart(option.slice(0, charIndex + 1));
        timeoutId = setTimeout(() => typeNext(charIndex + 1), TYPING_DELAY);
      } else {
        timeoutId = setTimeout(() => removeNext(option.length), PAUSE_AFTER_TYPE_MS);
      }
    };

    const removeNext = (remaining: number) => {
      if (remaining > 0) {
        setTypedPart((prev) => prev.slice(0, -1));
        timeoutId = setTimeout(() => removeNext(remaining - 1), DELETE_DELAY);
      } else {
        optionIndexRef.current++;
        timeoutId = setTimeout(() => typeNext(0), PAUSE_AFTER_DELETE_MS);
      }
    };

    const startDelay = setTimeout(() => typeNext(0), 1500);

    return () => {
      clearTimeout(startDelay);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setCursorVisible((v) => !v), CURSOR_BLINK_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <span style={{ color: "var(--color-teal)" }}>
      {STATIC_PREFIX}
      {typedPart}
      <span
        style={{
          opacity: cursorVisible ? 1 : 0,
          transition: "opacity 0.1s",
        }}
      >
        |
      </span>
    </span>
  );
}
