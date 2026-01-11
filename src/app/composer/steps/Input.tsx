import { Button } from "@/components/ui/button";
import { Cpu } from "lucide-react";

interface ComposerInputProps {
  message: string;
  setMessage: (value: string) => void;
  onNext: () => void;
}
const Input = ({ message, setMessage, onNext }: ComposerInputProps) => {
  return (
    <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter your top-secret payload here..."
        className="flex-1 bg-transparent border-none outline-none text-white/90 font-mono text-sm md:text-base resize-none placeholder:text-white/20 h-64 focus:ring-0"
        spellCheck={false}
      />
      <div className="mt-6 flex justify-between items-center border-t border-white/5 pt-6">
        <span className="text-xs md:text-lg font-mono text-white/30 flex items-center gap-2">
          <Cpu size={14} className="md:size-[25px] hover:text-emerald-400" />
          {message.length} CHARS
        </span>
        <Button
          onClick={onNext}
          disabled={!message.trim()}
          variant="secondary"
          size={"sm"}
          className="md:h-9 md:px-4 md:py-2 md:has-[>svg]:px-3"
        >
          Configure Encryption
        </Button>
      </div>
    </div>
  );
};

export default Input;
