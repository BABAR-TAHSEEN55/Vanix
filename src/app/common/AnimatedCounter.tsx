"use client";

import { KeyframeOptions } from "framer-motion";
import { animate } from "framer-motion/dom";
import { useEffect, useRef } from "react";

interface AnimatedCounterProps {
  from: number;
  to: number;
  animatedOptions?: KeyframeOptions;
}
const AnimatedCounter = ({
  from,
  to,
  animatedOptions,
}: AnimatedCounterProps) => {
  const SpanRef = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const element = SpanRef.current;
    if (!element) return;
    element.textContent = String(from);
    const controls = animate(from, to, {
      duration: 1.5,
      ease: "easeOut",
      ...animatedOptions,
      onUpdate(value) {
        element.textContent = value.toFixed(0);
      },
    });
    return () => controls.stop();
  }, [SpanRef, from, to]);
  return <span ref={SpanRef} />;
};

export default AnimatedCounter;
