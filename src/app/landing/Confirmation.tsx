"use client";

import React, { useState, useEffect, useEffectEvent } from "react";

interface Props {
  isOpen: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  isProcessing?: boolean;
}

const MessageConfirmationModal = ({
  isOpen,
  onConfirm,
  onCancel,
  isProcessing = false,
}: Props) => {
  const [isVisible, setIsVisible] = useState(false);

  const updateVisible = useEffectEvent(() => setIsVisible(true));

  useEffect(() => {
    if (isOpen) {
      updateVisible();
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleConfirmClick = async () => {
    await onConfirm();
  };

  if (!isVisible) return null;

  const variantStyles = {
    border: "group-hover:border-neon-green",
    iconBg: "bg-green-500/10 text-neon-green border-green-500/20",
    glow: "group-hover:shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)]",
    gradient: "from-green-500/10 via-transparent to-transparent",
    btn: "bg-green-600 hover:bg-green-500 text-white",
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-300 ${
        isOpen
          ? "opacity-100 backdrop-blur-sm"
          : "opacity-0 backdrop-blur-none pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 transition-opacity"
        onClick={!isProcessing ? onCancel : undefined}
      />

      {/* Modal Container */}
      <div
        className={`
          group relative w-full max-w-md lg:max-w-lg  bg-void border border-white/10
          overflow-hidden transition-all duration-500 ease-out transform
          ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-8"}
          ${variantStyles.border} ${variantStyles.glow}
        `}
      >
        {/* Animated Scanline Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
        <div
          className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-b ${variantStyles.gradient} pointer-events-none`}
        />

        {/* Top Decorative Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

        <div className="relative z-10 p-8 flex flex-col items-center text-center">
          {/* Header Section */}
          <div className="flex w-full justify-between items-start mb-8">
            {/* Icon */}
            <div
              className={`w-12 h-12 flex items-center justify-center rounded border ${variantStyles.iconBg} relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-current opacity-10 animate-pulse"></div>
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>

            {/* System ID Tag */}
            <div className="flex flex-col items-end">
              <span className="font-mono text-[10px] text-white/30 tracking-widest uppercase">
                Process ID
              </span>
              <span className="font-mono text-xs text-neon-purple/80">
                MSG_VIEW_01
              </span>
            </div>
          </div>

          {/* Content */}
          <h2 className="text-2xl font-bold font-mono uppercase tracking-tight mb-3 text-white">
            View Secure Message
          </h2>

          <p className="text-neutral-400 text-sm leading-relaxed mb-8 font-light w-full  md:max-w-sm">
            <span className="font-bold ">
              This encrypted message will be decrypted and displayed.
            </span>
            Once viewed, it may be automatically destroyed based on its
            configuration. Are you ready to proceed?
          </p>

          {/* Warning */}
          <div className="w-full mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-400 font-mono">
            ⚠️ WARNING: This action cannot be undone
          </div>

          {/* Actions */}
          <div className="w-full grid grid-cols-2 gap-3">
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="px-4 py-3 rounded text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white hover:bg-white/5 border border-white/5 hover:border-white/20 transition-all duration-200 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirmClick}
              disabled={isProcessing}
              className={`
                relative overflow-hidden px-4 py-3 rounded text-xs font-mono uppercase tracking-wider font-bold transition-all duration-200
                ${variantStyles.btn} disabled:opacity-70 disabled:cursor-not-allowed
              `}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Decrypting...
                </span>
              ) : (
                <span className="relative z-10 flex items-center justify-center gap-2 group/btn">
                  View Message
                  <svg
                    className="w-3 h-3 transition-transform group-hover/btn:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </span>
              )}
            </button>
          </div>

          {/* Footer Metadata */}
          <div className="w-full mt-6 pt-4 border-t border-dashed border-white/10 flex justify-between items-center text-[10px] font-mono text-neutral-600">
            <span>ZERO_KNOWLEDGE</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse"></span>
              CLIENT_DECRYPT
            </span>
          </div>
        </div>

        {/* Decorative Corner Makers */}
        <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-white/20"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-white/20"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-white/20"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-white/20"></div>
      </div>
    </div>
  );
};

export default MessageConfirmationModal;
