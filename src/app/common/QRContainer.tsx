"use client";
import { useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import { X } from "lucide-react";

import * as htmltoImage from "html-to-image";
import { Button } from "@/components/ui/button";
type Props = {
  value: string;
  size?: number;
  onClose?: () => void;
  className?: string;
};

const QRContainer = ({ value, size = 200, onClose, className }: Props) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  const refContainer = useRef(null);

  const downloadQr = () => {
    if (!refContainer.current) return;
    htmltoImage
      .toPng(refContainer?.current)
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "qr-code.png";
        link.click();
      })
      .catch((err) => {
        console.log("Errro", err);
      });
  };
  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center pt-12 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`animate-in slide-in-from-top-2 bg-white rounded-2xl p-4 shadow-lg ${className ?? ""}`}
        style={{ width: size + 24, maxWidth: "90%" }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-mono text-neutral-700">
            Secure Link QR
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-100 transition-colors"
            aria-label="Close QR"
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="flex justify-center bg-white p-3 rounded"
          ref={refContainer}
        >
          <QRCode
            size={size}
            value={value}
            level="H"
            style={{ width: "100%", height: "auto" }}
          />
        </div>
        <Button className="w-full" onClick={downloadQr}>
          Download
        </Button>
      </div>
    </div>
  );
};

export default QRContainer;
