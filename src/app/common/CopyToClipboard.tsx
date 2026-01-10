"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CopyToClipboardProps {
  text: string;
}

const CopyToClipboard = ({ text }: CopyToClipboardProps) => {
  const [copy, setCopy] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopy(true);

      setTimeout(() => {
        setCopy(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded transition-colors"
    >
      {copy ? (
        <Check size={18} className="text-neon-green" />
      ) : (
        <Copy size={18} className="text-white/70" />
      )}
    </button>
  );
};

export default CopyToClipboard;
