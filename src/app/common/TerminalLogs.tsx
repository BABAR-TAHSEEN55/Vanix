import { Terminal } from "lucide-react";

const COLORS = {
  success: "text-purple-400",
  success2: "text-green-500",
  error: "text-red-400",
  info: "text-cyan-400",
};
interface TerminalProps {
  logs: string[];
  color: "success" | "success2" | "error" | "info";
}
const TerminalLogs = ({ logs, color }: TerminalProps) => {
  return (
    <div className="mt-auto pt-8 border-t border-white/5 font-mono text-[9px] text-neutral-600">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2">
          <Terminal size={10} /> SYSTEM_LOGS
        </span>
        <span className="text-neon-green/40">LIVE_CONNECTION</span>
      </div>
      <div className="space-y-1 overflow-hidden w-full max-w-5xl bg-black border border-white/10 p-4 font-mono text-xs min-h-20 overflow-y-auto">
        {logs.length > 0 ? (
          logs.map((log, i) => (
            <div
              key={i}
              className={`animate-in fade-in slide-in-from-left-2 ${COLORS[color]}`}
            >
              {log}
            </div>
          ))
        ) : (
          <div className="text-red-400">
            &gt; Waiting for user interaction...
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalLogs;
