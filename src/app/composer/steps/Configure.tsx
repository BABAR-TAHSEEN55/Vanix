"use client";

import { Button } from "@/components/ui/button";
import { EncryptionType, Expiration, ViewLimit } from "@/types/common";
import { Clock, Eye, Shield } from "lucide-react";
import PasswordSetup from "./passwordSetup";

interface ConfigureProps {
  settings: {
    encryption: EncryptionType;
    views: ViewLimit;
    expiration: Expiration;
  };
  onSettingsChange: (newSettings: {
    encryption: EncryptionType;
    views: ViewLimit;
    expiration: Expiration;
  }) => void;
  onBack: () => void;
  onNext: () => void;
}

const Configure = ({
  settings,
  onSettingsChange,
  onBack,
  onNext,
}: ConfigureProps) => {
  const updateSetting = (key: keyof typeof settings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="flex flex-col gap-8 animate-in slide-in-from-end-translate-full duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <label className="text-xs font-mono text-neon-green uppercase tracking-wider flex items-center gap-2">
            <Shield size={14} /> Encryption Algorithm
          </label>
          <div className="flex flex-col gap-2">
            {(
              ["AES-256-GCM", "AES-CTR", "PBKDF2-HMAC"] as EncryptionType[]
            ).map((type) => (
              <button
                key={type}
                onClick={() => updateSetting("encryption", type)}
                className={`px-4 py-3 text-left text-xs font-mono border transition-all ${
                  settings?.encryption === type
                    ? "bg-neon-green/10 border-[#00ff41] text-[#00ff41]"
                    : "bg-white/5 border-transparent text-white/50 hover:bg-white/10 hover:text-white"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Views Select */}
        <div className="space-y-3">
          <label className="text-xs font-mono text-neon-purple uppercase tracking-wider flex items-center gap-2">
            <Eye size={14} /> View Limit
          </label>
          <div className="flex flex-col gap-2">
            {(
              ["1 (Burn)", "5 Views", "10 Views", "Unlimited"] as ViewLimit[]
            ).map((limit) => (
              <button
                key={limit}
                onClick={() => updateSetting("views", limit)}
                className={`px-4 py-3 text-left text-xs font-mono border transition-all ${
                  settings.views === limit
                    ? "bg-neon-purple/10 border-neon-purple text-neon-purple"
                    : "bg-white/5 border-transparent text-white/50 hover:bg-white/10 hover:text-white"
                }`}
              >
                {limit}
              </button>
            ))}
          </div>
        </div>

        {/* Expiration Select */}
        <div className="space-y-3">
          <label className="text-xs font-mono text-neon-cyan uppercase tracking-wider flex items-center gap-2">
            <Clock size={14} /> Self-Destruct Timer
          </label>
          <div className="flex flex-col gap-2">
            {(["1 Hour", "24 Hours", "7 Days", "Never"] as Expiration[]).map(
              (time) => (
                <button
                  key={time}
                  onClick={() => updateSetting("expiration", time)}
                  className={`px-4 py-3 text-left text-xs font-mono border transition-all ${
                    settings.expiration === time
                      ? "bg-neon-cyan/10 border-neon-cyan text-neon-cyan"
                      : "bg-white/5 border-transparent text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {time}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto flex justify-between items-center border-t border-white/5 pt-6">
        <button
          onClick={onBack}
          className="text-xs font-mono text-white/50 hover:text-white uppercase tracking-wider"
        >
          &lt; Back to Compose
        </button>
        <Button
          onClick={onNext}
          size={"xs"}
          className="md:h-9 md:px-4 md:py-2 md:has-[>svg]:px-3"
        >
          {settings.encryption === "PBKDF2-HMAC" ? (
            <span>Configure Password</span>
          ) : (
            <span>Generate Secure Link</span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Configure;
