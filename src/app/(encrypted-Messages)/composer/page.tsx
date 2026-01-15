"use client";

import CommonComposer from "@/app/common/CommonComposer";
import Configure from "@/app/composer/steps/Configure";

import Input from "@/app/composer/steps/Input";
import PasswordSetup from "@/app/composer/steps/passwordSetup";
import Processing from "@/app/composer/steps/Processing";
import Result from "@/app/composer/steps/Result";

import { getBaseUrl } from "@/lib/config";
import { NewEncryption } from "@/lib/encryptionClient";
import {
  EncryptionType,
  Expiration,
  PostBodyType,
  ViewLimit,
} from "@/types/common";
import axios from "axios";
import { Terminal } from "lucide-react";

import { useEffect, useState } from "react";

const InitialSettings = {
  encryption: "AES-256-GCM" as EncryptionType,
  views: "1 (Burn)" as ViewLimit,
  expiration: "1 Hour" as Expiration,
};

const MessageComposer = () => {
  const [qrState, setQr] = useState(false);
  const [message, setMessage] = useState("");
  const [Step, setStep] = useState<
    "input" | "configure" | "processing" | "passwordSetup" | "result"
  >("input");
  const [settings, setSettings] = useState(InitialSettings);
  const [password, setPassword] = useState<string>("");
  const [data, setData] = useState<{
    link?: string;
    fullUrl: string;
  }>();
  const [consoleLog, setConsoleLog] = useState<string[]>([]);

  const QRToggle = () => {
    setQr((prev) => !prev);
  };
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
        // console.log("Augemented", res.data);
      });
    } catch (err) {
      console.log(err);
    }
  };
  const baseUrl = getBaseUrl();

  // Delay effect
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
    <div>
      <div className="max-w-5xl mx-auto mt-8 md:mt-10 px-6 relative z-10">
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
            <Input
              message={message}
              setMessage={setMessage}
              onNext={() => setStep("configure")}
            />
          )}

          {Step === "configure" && (
            <Configure
              settings={settings}
              onSettingsChange={setSettings}
              onBack={() => setStep("input")}
              onNext={() => {
                if (settings.encryption === "PBKDF2-HMAC") {
                  setStep("passwordSetup");
                } else {
                  setStep("processing");
                  SendInput();
                }
              }}
            />
          )}

          {Step === "passwordSetup" && (
            <PasswordSetup
              onBack={() => setStep("configure")}
              onNext={(selectedPassword: string) => {
                setPassword(selectedPassword);
                setStep("processing");
                SendInput();
              }}
            />
          )}
          {Step === "processing" && <Processing logs={consoleLog} />}
          {Step === "result" && (
            <Result
              url={`${baseUrl}/composer/${data?.fullUrl}`}
              settings={settings}
              onReset={HitReset}
              onToggleQR={QRToggle}
              qrState={qrState}
            />
          )}
        </CommonComposer>
      </div>
    </div>
  );
};

export default MessageComposer;
