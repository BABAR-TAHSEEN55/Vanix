"use client";

import CopyToClipboard from "@/app/common/CopyToClipboard";
import QRContainer from "@/app/common/QRContainer";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Lock } from "lucide-react";

interface ComposerResultProps {
  url: string;
  settings: {
    views: string;
    encryption: string;
    expiration: string;
  };
  onReset: () => void;
  onToggleQR: () => void;
  qrState: boolean;
}

const Result = ({
  url,
  settings,
  onReset,
  onToggleQR,
  qrState,
}: ComposerResultProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 animate-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-neon-green/10 rounded-full flex items-center justify-center border border-neon-green/50 shadow-[0_0_30px_rgba(0,255,65,0.3)]">
        <Lock className="w-10 h-10 text-neon-green" />
      </div>

      <div className="text-center">
        <h3 className="text-2xl text-white font-bold uppercase tracking-tight mb-2">
          Payload Secured
        </h3>
        <p className="text-white/50 text-sm max-w-sm mx-auto">
          This link allows access to your encrypted message. It will destroy
          itself after{" "}
          {settings.views === "1 (Burn)" ? "1 view" : settings.views}.
        </p>
      </div>

      <div className="w-full max-w-lg relative">
        <input
          readOnly
          value={url}
          className="w-full bg-black border border-white/20 text-neon-green font-mono text-sm py-4 px-6 rounded
                          focus:outline-none focus:border-neon-green transition-colors
                          overflow-hidden text-ellipsis whitespace-nowrap
                          pr-12"
        />
        <CopyToClipboard text={url} />
      </div>

      <div className="flex gap-4">
        <Button variant="secondary" onClick={onReset}>
          Encrypt Another
        </Button>
        <Button variant="default" onClick={onToggleQR}>
          Show QR Code
        </Button>
      </div>

      {qrState && <QRContainer value={url} onClose={onToggleQR} />}

      <div className="flex items-center gap-2 text-[10px] text-amber-500/80 font-mono bg-amber-500/10 px-3 py-2 rounded border border-amber-500/20">
        <AlertTriangle size={12} />
        WARNING: WE CANNOT RECOVER THIS MESSAGE IF THE LINK IS LOST.
      </div>
    </div>
  );
};

export default Result;
