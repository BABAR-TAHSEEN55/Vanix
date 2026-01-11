"use client";
import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // console.log("ScrollToTop mounted");

    const toggleVisibility = () => {
      const scrolled = window.scrollY > 400;
      // console.log("Scroll position:", window.scrollY, "Show button:", scrolled); 
      setIsVisible(scrolled);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    // console.log("Scrolling to top");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-black border-2 border-green-400 text-green-400 hover:bg-green-400  hover:bg-green-700 hover:text-black transition-all duration-300 flex items-center justify-center"
      style={{
        display: isVisible ? "flex" : "none",
        position: "fixed",
        bottom: "32px",
        right: "32px",
        zIndex: 50,
        width: "48px",
        height: "48px",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        border: "1px solid rgba(0, 255, 65, 0.5)",
        color: "#00ff41",
        borderRadius: "4px",
        cursor: "pointer",
      }}
      aria-label="Scroll to top"
    >
      <ChevronUp className="w-5 h-5" strokeWidth={1.5} />
    </button>
  );
};

export default ScrollToTop;
