import React from "react";

interface CommonComposerProps {
  status?: string;
  statusColor?: "red" | "yellow" | "green" | "blue";
  children: React.ReactNode;
  minHeight?: string;
}

const CommonComposer: React.FC<CommonComposerProps> = ({
  status,

  children,
  minHeight = "min-h-[500px]",
}) => {
  return (
    <div className="bg-void-lighter border border-white/10 rounded-lg overflow-hidden shadow-2xl shadow-neon-purple/5 relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-neon-green/20 via-neon-purple/20 to-neon-cyan/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-overlay" />

      <div className="h-10 bg-black border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50 animate-bounce delay-75" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50 animate-bounce delay-100" />
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50 animate-bounce delay-150" />
        </div>
        <div className="text-[10px] font-mono text-white/50 tracking-widest uppercase">
          {status}
        </div>
      </div>

      <div className={`${minHeight} bg-void p-8`}>{children}</div>
    </div>
  );
};

export default CommonComposer;
