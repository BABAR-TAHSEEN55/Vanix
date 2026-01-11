"use client";

import { RefreshCw } from "lucide-react";

interface ProcessingProps {
  logs: string[];
}

const Processing = ({ logs }: ProcessingProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 animate-in fade-in duration-300">
      <RefreshCw className="w-12 h-12 text-neon-green animate-spin" />
      <div className="w-full max-w-5xl bg-black border border-white/10 p-4 font-mono text-xs h-52 overflow-y-auto">
        {logs.map((log, i) => (
          <div key={i} className="text-green-500 mb-1">
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Processing;
