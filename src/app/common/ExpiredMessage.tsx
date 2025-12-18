import { Terminal } from "lucide-react";
import CommonComposer from "./CommonComposer";

// Component for expired messages
const ExpiredMessage = () => (
  <div className="max-w-5xl mx-auto mt-8 md:mt-15 px-6 relative z-10">
    <div className="mb-10 text-center">
      <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded bg-white/5 border border-white/10">
        <Terminal size={14} className="text-red-500" />
        <span className="text-xs font-mono text-white/60 uppercase tracking-widest">
          Message Expired
        </span>
      </div>
    </div>
    <CommonComposer>
      <div className="text-center p-12">
        <div className="text-red-500 text-xl mb-4"> Message Expired</div>
        <div className="text-white/60">
          This message has expired and been permanently deleted.
        </div>
      </div>
    </CommonComposer>
  </div>
);

export default ExpiredMessage;
