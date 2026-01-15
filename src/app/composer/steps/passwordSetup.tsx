"use client";

import { Button } from "@/components/ui/button";
import { Key, Eye, EyeOff, AlertTriangle, ArrowLeft } from "lucide-react";
import { useState } from "react";

interface PasswordSetupProps {
  onBack: () => void;
  onNext: (password: string) => void;
}

const PasswordSetup = ({ onBack, onNext }: PasswordSetupProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const handleNext = () => {
    setError("");

    if (!password) {
      setError("Password is required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    onNext(password);
  };

  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;

  const isValid = password.length > 0 && passwordsMatch;

  return (
    <div className="flex flex-col gap-8 h-full animate-in slide-in-from-right duration-300">
      <div className="text-center">
        <div className="w-16 h-16 bg-neon-yellow/10 rounded-full flex items-center justify-center border border-neon-yellow/50 mx-auto mb-4">
          <Key className="w-8 h-8 text-neon-yellow" />
        </div>
        <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-2">
          Password Protection
        </h3>
        <p className="text-white/50 text-sm max-w-md mx-auto">
          Set a password to encrypt your message. You will need this password to
          decrypt it later.
        </p>
      </div>

      <div className="max-w-md mx-auto w-full space-y-6 flex-1">
        {/* Password */}
        <div className="space-y-3">
          <label className="text-xs font-mono text-neon-yellow uppercase tracking-wider flex items-center gap-2">
            <Key size={14} /> Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              className="w-full bg-black border border-white/20 text-white font-mono text-sm py-4 px-4 pr-12 rounded
                         focus:outline-none focus:border-neon-yellow transition-colors
                         placeholder:text-white/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded"
            >
              {showPassword ? (
                <EyeOff size={16} className="text-white/50" />
              ) : (
                <Eye size={16} className="text-white/50" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-3">
          <label className="text-xs font-mono text-neon-purple uppercase tracking-wider flex items-center gap-2">
            <Key size={14} /> Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password..."
              className="w-full bg-black border border-white/20 text-white font-mono text-sm py-4 px-4 pr-12 rounded
                         focus:outline-none focus:border-neon-purple transition-colors
                         placeholder:text-white/30"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded"
            >
              {showConfirmPassword ? (
                <EyeOff size={16} className="text-white/50" />
              ) : (
                <Eye size={16} className="text-white/50" />
              )}
            </button>
          </div>

          {confirmPassword.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <div
                className={`w-2 h-2 rounded-full ${
                  passwordsMatch ? "bg-neon-green" : "bg-red-500"
                }`}
              />
              <span
                className={`font-mono ${
                  passwordsMatch ? "text-neon-green" : "text-red-500"
                }`}
              >
                {passwordsMatch ? "Passwords match" : "Passwords do not match"}
              </span>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded border border-red-500/20">
            <AlertTriangle size={12} />
            {error}
          </div>
        )}

        {/* Security Notice */}
        <div className="flex items-start gap-3 text-xs text-amber-500/80 bg-amber-500/10 px-4 py-3 rounded border border-amber-500/20">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold uppercase tracking-wider">
              Security Notice
            </p>
            <p className="leading-relaxed">
              This password cannot be recovered. If lost, the encrypted message
              becomes permanently inaccessible.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center border-t border-white/5 pt-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-mono text-white/50 hover:text-white uppercase tracking-wider"
        >
          <ArrowLeft size={12} />
          Back to Settings
        </button>
        <Button
          onClick={handleNext}
          disabled={!isValid}
          size="xs"
          className="md:h-9 md:px-4 md:py-2 disabled:opacity-50"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default PasswordSetup;
