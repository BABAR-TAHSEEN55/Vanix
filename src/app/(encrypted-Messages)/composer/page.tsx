"use client";

import CommonComposer from "@/app/common/CommonComposer";
import { Button } from "@/components/ui/button";
import { getBaseUrl } from "@/lib/config";
import { NewEncryption } from "@/lib/encryptionClient";
import { PostBodyType } from "@/types/common";
import axios from "axios";
import {
  AlertTriangle,
  Check,
  Clock,
  Copy,
  Cpu,
  Eye,
  Lock,
  RefreshCw,
  Shield,
  Terminal,
} from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
type ViewLimit = "1 (Burn)" | "5 Views" | "10 Views" | "Unlimited";
type EncryptionType = "AES-256-GCM" | "AES-CTR" | "PBKDF2-HMAC";
type Expiration = "1 Hour" | "24 Hours" | "7 Days" | "Never";
const InitialSettings = {
  encryption: "AES-256-GCM",
  views: "1 (Burn)",
  expiration: "1 Hour",
};
// type dataType = {
//   input: string;
//   GENERATE_URL: string;
// };

const MessageComposer = () => {
  const [message, setMessage] = useState("");
  const [Step, setStep] = useState<
    "input" | "configure" | "processing" | "result"
  >("input");
  const [settings, setSettings] = useState(InitialSettings);
  const [data, setData] = useState<{
    link?: string;
    fullUrl: string;
  }>();
  const [consoleLog, setConsoleLog] = useState<string[]>([]);
  const [copy, setCopy] = useState(false);

  const HitReset = () => {
    setMessage("");
    setStep("input");
    setConsoleLog([""]);
  };

  const SendInput = async () => {
    const resp = await NewEncryption(message);
    try {
      const payload: PostBodyType = {
        settings,
        res: resp,
      };

      await axios.post("/api/message", payload).then((res) => {
        setData(res.data);
        console.log("Augemented", res.data);
      });
    } catch (err) {
      console.log(err);
    }
  };
  const baseUrl = getBaseUrl();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${baseUrl}/composer/${data?.fullUrl}`);
    setCopy(true);

    setTimeout(() => {
      setCopy(false);
    }, 3000);
  };
  useEffect(() => {
    if (Step !== "processing") return;

    const logs = [
      "Initiating handshake...",
      "Generating ephemeral keys...",
      "Applying cipher...",
      "Salting hash...",
      "Allocating storage shard...",
      "Link generated.",
    ];

    const delay = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    let cancelled = false;

    (async () => {
      for (const log of logs) {
        if (cancelled) return;

        setConsoleLog((prev) => [...prev, `> ${log}`]);
        await delay(1200);
      }

      await delay(500);

      if (!cancelled) {
        setStep("result");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [Step]);

  return (
    <div className="">
      <div className="max-w-5xl mx-auto mt-8 md:mt-15 px-6 relative z-10">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded bg-white/5 border border-white/10">
            <Terminal size={14} className="text-neon-green" />
            <span className="text-xs font-mono text-white/60 uppercase tracking-widest">
              Secure Payload Composer
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
            Encrypt{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b026ff] to-[#00f3ff]">
              Message
            </span>
          </h2>
        </div>

        <CommonComposer
          status={
            Step === "input"
              ? "Awaiting Input"
              : Step === "processing"
                ? "Encrypting..."
                : "Secure Link Ready"
          }
          statusColor={
            Step === "input"
              ? "yellow"
              : Step === "processing"
                ? "blue"
                : "green"
          }
        >
          {Step === "input" && (
            <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
              <textarea
                // ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your top-secret payload here..."
                className="flex-1 bg-transparent border-none outline-none text-white/90 font-mono text-sm md:text-base resize-none placeholder:text-white/20 h-64 focus:ring-0"
                spellCheck={false}
              />
              <div className="mt-6 flex justify-between items-center border-t border-white/5 pt-6">
                <span className="text-xs md:text-lg font-mono text-white/30 flex items-center gap-2">
                  <Cpu
                    size={14}
                    className="md:size-[35px] hover:text-emerald-400"
                  />
                  {message.length} CHARS
                </span>
                <Button
                  onClick={async () => {
                    // await SendInput();
                    setStep("configure");
                  }}
                  disabled={!message.trim()}
                  variant="secondary"
                >
                  Configure Encryption
                </Button>
              </div>
            </div>
          )}

          {Step === "configure" && (
            <div className="flex flex-col gap-8 animate-in slide-in-from-end-translate-full duration-300 ">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Encryption Select */}
                <div className="space-y-3">
                  <label className="text-xs font-mono text-neon-green uppercase tracking-wider flex items-center gap-2">
                    <Shield size={14} /> Encryption Algorithm
                  </label>
                  <div className="flex flex-col gap-2">
                    {(
                      [
                        "AES-256-GCM",
                        "AES-CTR",
                        "PBKDF2-HMAC",
                      ] as EncryptionType[]
                    ).map((type) => (
                      <button
                        key={type}
                        onClick={async () => {
                          setSettings({ ...settings, encryption: type });
                          // await SendInput();
                        }}
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
                      [
                        "1 (Burn)",
                        "5 Views",
                        "10 Views",
                        "Unlimited",
                      ] as ViewLimit[]
                    ).map((limit) => (
                      <button
                        key={limit}
                        onClick={() =>
                          setSettings({ ...settings, views: limit })
                        }
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
                    {(
                      ["1 Hour", "24 Hours", "7 Days", "Never"] as Expiration[]
                    ).map((time) => (
                      <button
                        key={time}
                        onClick={() =>
                          setSettings({ ...settings, expiration: time })
                        }
                        className={`px-4 py-3 text-left text-xs font-mono border transition-all ${
                          settings.expiration === time
                            ? "bg-neon-cyan/10 border-neon-cyan text-neon-cyan"
                            : "bg-white/5 border-transparent text-white/50 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto flex justify-between items-center border-t border-white/5 pt-6">
                <button
                  onClick={() => setStep("input")}
                  className="text-xs font-mono text-white/50 hover:text-white uppercase tracking-wider"
                >
                  &lt; Back to Compose
                </button>
                <Button
                  onClick={async () => {
                    setStep("processing");
                    await SendInput();
                  }}
                  // variant="primary"
                  className="min-w-[200px]"
                >
                  Generate Secure Link
                </Button>
              </div>
            </div>
          )}

          {/*{}*/}
          {Step === "processing" && (
            <div className="flex flex-col items-center justify-center h-full gap-6 animate-in fade-in duration-300">
              <RefreshCw className="w-12 h-12 text-neon-green animate-spin" />
              <div className="w-full max-w-5xl bg-black border border-white/10 p-4 font-mono text-xs h-52 overflow-y-auto">
                {consoleLog.map((log, i) => (
                  <div key={i} className="text-green-500 mb-1">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
          {Step === "result" && (
            <div className="flex flex-col items-center justify-center h-full gap-8 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-neon-green/10 rounded-full flex items-center justify-center border border-neon-green/50 shadow-[0_0_30px_rgba(0,255,65,0.3)]">
                <Lock className="w-10 h-10 text-neon-green" />
              </div>

              <div className="text-center">
                <h3 className="text-2xl text-white font-bold uppercase tracking-tight mb-2">
                  Payload Secured
                </h3>
                <p className="text-white/50 text-sm max-w-sm mx-auto">
                  This link allows access to your encrypted message. It will
                  destroy itself after{" "}
                  {/*{settings.views === "1 (Burn)" ? "1 view" : settings.views}.*/}
                </p>
              </div>

              <div className="w-full max-w-lg relative">
                <input
                  readOnly
                  value={`${baseUrl}/composer/${data?.fullUrl}`}
                  className="w-full bg-black border border-white/20 text-neon-green font-mono text-sm py-4 px-6 rounded
                          focus:outline-none focus:border-neon-green transition-colors
                          overflow-hidden text-ellipsis whitespace-nowrap
                          pr-10"
                />
                <button
                  onClick={handleCopy}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded transition-colors"
                >
                  {copy ? (
                    <Check size={18} className="text-neon-green" />
                  ) : (
                    <Copy size={18} className="text-white/70" />
                  )}
                </button>
              </div>

              <div className="flex gap-4">
                <Button variant="secondary" onClick={HitReset}>
                  Encrypt Another
                </Button>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-amber-500/80 font-mono bg-amber-500/10 px-3 py-2 rounded border border-amber-500/20">
                <AlertTriangle size={12} />
                WARNING: WE CANNOT RECOVER THIS MESSAGE IF THE LINK IS LOST.
              </div>
              <div
                style={{
                  height: "auto",
                  margin: "0 auto",
                  maxWidth: 200,
                  width: "100%",
                }}
                className=" border-white/30 rounded-xl p-2"
              >
                <QRCode
                  size={256}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  value={`${baseUrl}/composer/${data?.fullUrl}`}
                  viewBox={`0 0 256 256`}
                />
              </div>
            </div>
          )}
        </CommonComposer>
      </div>
    </div>
  );
};

export default MessageComposer;
