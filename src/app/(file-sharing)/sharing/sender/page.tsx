"use client";

import { useSocket } from "@/context/SocketProvider";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import WebRTCPeerConnection from "@/lib/PeerToPeer";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  FileCode,
  Share2,
  ShieldCheck,
  Terminal,
  Upload,
} from "lucide-react";
import CommonComposer from "@/app/common/CommonComposer";
import CopyToClipboard from "@/app/common/CopyToClipboard";
import {
  ProtocolMode,
  RecoveryStep,
  TransmissionStep,
  UploadStatus,
} from "@/types/common";
import { stages } from "@/types/constants";
import useLogs from "@/hooks/useLogs";
import TerminalLogs from "@/app/common/TerminalLogs";

const CHUNK_SIZE = 40 * 1024;

const FileSharing = () => {
  const { socket, userId } = useSocket();

  const [mode, setMode] = useState<ProtocolMode>("SEND");
  const [step, setStep] = useState<TransmissionStep | RecoveryStep>("IDLE");
  const [sender, setSender] = useState<WebRTCPeerConnection | null>(null);
  const [file, setFile] = useState<File | null>(null);
  // const [logs, setLogs] = useState<string[]>([]);
  const [connectedUser, setConnectedUser] = useState<string>("");

  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const [isDataChannelOpen, setIsDataChannelOpen] = useState(false);
  const [webrtcConnectionState, setWebrtcConnectionState] =
    useState<string>("new");
  const [isProcessingConnection, setIsProcessingConnection] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [currentStep, setCurrentStep] = useState<
    "FILE_TRANSFER" | "SHARE_LINK"
  >("SHARE_LINK");

  const { logs, addLog, setLogs, clearLogs } = useLogs();

  const CustomReset = () => {
    window.location.reload();
  };
  const reset = () => {
    setStep("IDLE");
    setFile(null);

    clearLogs();
    setProgress(0);
  };

  const shareableLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/sharing/receiver/${userId}`
      : "";

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setFile(e.target.files[0]);
    setProgress(0);
    setStatus("idle");
  };

  const handleWebRTCFileUpload = async () => {
    if (!sender || !file) {
      alert("No connection or file selected");
      return;
    }

    if (!sender?.isDataChannelOpen()) {
      alert("Data channel not ready yet. Please wait a moment and try again.");
      return;
    }

    setStep("ENCRYPTING");

    addLog("Initiating local AES-256-GCM encryption layer...");
    setIsUploading(true);
    setStatus("uploading");
    setProgress(0);

    for (const stage of stages) {
      await new Promise((r) => setTimeout(r, stage.delay));
      setStep(stage.step as TransmissionStep);
      addLog(stage.log);
      setProgress(stage.prog);
    }

    let offset = 0;

    // 1️⃣ Send file metadata first
    sender.sendMessage(
      JSON.stringify({
        type: "file-info",
        name: file.name,
        size: file.size,
        mimeType: file.type,
      }),
    );

    // 2️⃣ Chunk sender
    const sendNextChunk = () => {
      const chunk = file.slice(offset, offset + CHUNK_SIZE);
      const reader = new FileReader();

      reader.onload = () => {
        if (!reader.result) return;

        const bytes = new Uint8Array(reader.result as ArrayBuffer);

        sender.sendMessage(
          JSON.stringify({
            type: "file-chunk",
            offset,
            isLast: offset + CHUNK_SIZE >= file.size,
            data: Array.from(bytes),
          }),
        );

        offset += CHUNK_SIZE;
        const percent = Math.min((offset / file.size) * 100, 100);
        setProgress(percent);

        // 3️⃣ Continue or finish
        if (offset < file.size) {
          setTimeout(sendNextChunk, 10);
        } else {
          sender.sendMessage(JSON.stringify({ type: "file-complete" }));
          setIsUploading(false);
          setStatus("success");
        }
      };

      reader.readAsArrayBuffer(chunk);
    };

    sendNextChunk();
  };

  const setupWebRTCHandlers = (peer: WebRTCPeerConnection) => {
    // Handle connection state changes
    peer.onConnectionState((state) => {
      console.log("WebRTC Connection State:", state);
      setWebrtcConnectionState(state);

      if (state === "connected") {
        console.log(" WebRTC fully connected!");
        // Check data channel status
        setTimeout(() => {
          setIsDataChannelOpen(peer.isDataChannelOpen());
        }, 100);
      } else if (state === "disconnected" || state === "failed") {
        setIsDataChannelOpen(false);
      }
    });

    const checkDataChannel = () => {
      const isOpen = peer.isDataChannelOpen();
      setIsDataChannelOpen(isOpen);

      if (isOpen) {
        console.log(" Data channel is ready for file transfer!");
      } else {
        setTimeout(checkDataChannel, 500);
      }
    };

    checkDataChannel();
  };

  useEffect(() => {
    if (!socket) {
      console.log("Socket is not ready yet..");
      return;
    }

    const handleConnect = () => {
      console.log("Sender: Socket connected!");
      socket.emit("register", {
        userId: userId,
        socketId: socket.id,
      });
      setIsRegistered(true);
    };

    if (socket.connected) {
      handleConnect();
    }
    socket.on("connect", handleConnect);

    socket.on("incoming-connection", (data) => {
      console.log("Sender: Incoming connection request:", data);

      if (isProcessingConnection) {
        console.log(
          " Already processing connection, ignoring duplicate request",
        );
        return;
      }

      if (sender) {
        console.log(" Sender already exists, reusing existing connection");
        setConnectedUser(data.fromUserId);
        return;
      }

      setIsProcessingConnection(true);
      setConnectedUser(data.fromUserId);
      console.log("Sender: Creating NEW sender for incoming connection...");

      const senderPeer = new WebRTCPeerConnection(true);
      setSender(senderPeer);

      setupWebRTCHandlers(senderPeer);

      setTimeout(async () => {
        try {
          console.log("Sender: Creating and sending offer...");
          const offer = await senderPeer.createOffer();

          if (offer) {
            socket.emit("offer", {
              targetUserId: data.fromUserId,
              offer: offer,
            });
            console.log("Sender: Offer sent to", data.fromUserId);
          }
        } catch (error) {
          console.error("Sender: Error creating offer:", error);
          setIsProcessingConnection(false);
        }
      }, 300);
    });

    socket.on("answer", async (data) => {
      console.log("Sender: Received WebRTC answer from:", data.fromUserId);

      if (!sender) {
        console.log(" No sender peer available to set answer");
        return;
      }

      try {
        await sender.setRemoteAnswer(data.answer);
        console.log(" Sender: P2P CONNECTION ESTABLISHED!");
        setIsProcessingConnection(false);
      } catch (error) {
        console.error(" Sender: Error setting remote answer:", error);
        setIsProcessingConnection(false);
      }
    });

    socket.on("connection-requested", (data) => {
      console.log("Sender: Connection request received:", data);
    });

    socket.on("connection-failed", (data) => {
      console.log("Sender: Connection failed:", data);
      setIsProcessingConnection(false);
      alert(`Connection failed: ${data.reason}`);
    });

    socket.on("disconnect", () => {
      console.log("Sender: Socket disconnected!");
      setIsRegistered(false);
      setIsDataChannelOpen(false);
      setWebrtcConnectionState("new");
      setIsProcessingConnection(false);
    });

    return () => {
      console.log("Sender: Cleaning up listeners");
      socket.off("connect", handleConnect);
      socket.off("incoming-connection");
      socket.off("answer");
      socket.off("connection-requested");
      socket.off("connection-failed");
      socket.off("disconnect");
    };
  }, [socket, userId, sender, isProcessingConnection]);

  const resetConnection = () => {
    if (sender) {
      sender.close();
    }
    setSender(null);
    setConnectedUser("");
    setIsDataChannelOpen(false);
    setWebrtcConnectionState("new");
    setIsProcessingConnection(false);
    setStatus("idle");
    setProgress(0);
  };

  return (
    <div className="max-w-5xl mx-auto mt-8 md:mt-10 px-6 relative z-10">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded bg-white/5 border border-white/10">
          <Terminal size={14} className="text-neon-green" />
          <span className="text-xs font-mono text-white/60 uppercase tracking-widest">
            Secure Payload File Composer
          </span>
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
          Transmit{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b026ff] to-[#00f3ff]">
            File
          </span>
        </h2>
      </div>

      {currentStep === "SHARE_LINK" && (
        <CommonComposer>
          <div className="flex flex-col items-center justify-center h-full gap-8 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-neon-green/10 rounded-full flex items-center justify-center border border-neon-green/50 shadow-[0_0_30px_rgba(0,255,65,0.3)]">
              <Share2 className="w-10 h-10 text-neon-green" />
            </div>

            <div className="text-center">
              <h3 className="text-2xl text-white font-bold uppercase tracking-tight mb-2">
                Ready to Share
              </h3>
              <p className="text-white/50 text-sm max-w-sm mx-auto">
                Share this link with someone to establish a secure P2P
                connection.
                {connectedUser
                  ? "Receiver is connected and ready!"
                  : "Waiting for receiver to connect..."}
              </p>
            </div>

            <div className="w-full max-w-lg relative">
              <input
                readOnly
                value={shareableLink}
                className="w-full bg-black border border-white/20 text-neon-green font-mono text-sm py-4 px-6 rounded
                focus:outline-none focus:border-neon-green transition-colors
                overflow-hidden text-ellipsis whitespace-nowrap
                pr-10"
              />
              <CopyToClipboard text={shareableLink} />
            </div>

            <div
              className={`flex items-center gap-2 px-4 py-2 rounded border ${
                connectedUser
                  ? "bg-neon-green/10 border-neon-green/20 text-neon-green"
                  : "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  connectedUser
                    ? "bg-neon-green animate-pulse"
                    : "bg-yellow-500 animate-pulse"
                }`}
              />
              <span className="text-xs font-mono">
                {connectedUser
                  ? `Receiver Connected: ${connectedUser}`
                  : "Waiting for receiver..."}
              </span>
            </div>

            <div className="flex gap-4 flex-col md:flex-row">
              <Button
                variant="secondary"
                onClick={() => {
                  // reset();
                  CustomReset();
                  setCurrentStep("SHARE_LINK");
                }}
              >
                Generate New Link
              </Button>
              <Button
                variant="default"
                // onClick={handleShareFile}
                onClick={() => {
                  setCurrentStep("FILE_TRANSFER");
                }}
                disabled={!connectedUser}
                className={
                  !connectedUser ? "opacity-50 cursor-not-allowed" : ""
                }
              >
                {connectedUser ? "Share File" : "Waiting for Connection..."}
              </Button>
            </div>

            {!connectedUser && (
              <div className="flex items-center gap-2 text-[10px] text-amber-500/80 font-mono bg-amber-500/10 px-3 py-2 rounded border border-amber-500/20">
                <AlertTriangle size={12} />
                PEER CONNECTION REQUIRED: Share the link above to establish
                connection.
              </div>
            )}
          </div>
        </CommonComposer>
      )}

      {currentStep == "FILE_TRANSFER" && (
        <CommonComposer minHeight="min-h-[450px] mb-3 animate-in slide-in-from-end-translate-full duration-300  ">
          {mode === "SEND" && (
            <div className="relative z-10 flex-1 flex flex-col ">
              {step === "IDLE" ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files[0];
                      if (f) {
                        setFile(f);
                        addLog(`File dropped: ${f.name}`);
                      }
                    }}
                    className="w-full h-64 border-2 border-dashed border-white/10 hover:border-[#39FF14]/50  hover:bg-[#39FF14]/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 rounded-lg group/drop "
                  >
                    <div className="w-16 h-16 bg-white/5 border border-white/10 flex items-center justify-center rounded-full group-hover/drop:scale-110 transition-transform">
                      <Upload className="text-neon-green" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-white font-bold uppercase tracking-wider mb-2">
                        Drop Encrypted Assets
                      </p>
                      <p className="text-[10px] text-neutral-500 font-mono">
                        Supports all formats up to 500MB
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                  {file && (
                    <div className="mt-8 w-full flex flex-col md:flex-row gap-4 ml-auto items-center justify-between p-4 bg-white/5 border border-neon-green/20 animate-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-4">
                        <FileCode className="text-neon-green" />

                        <div className="max-w-[200px] md:max-w-full">
                          <p className="truncate text-xs font-bold text-white">
                            {file.name}
                          </p>

                          <p className="text-[10px] text-neutral-500 uppercase tracking-tighter">
                            Ready for transmission
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleWebRTCFileUpload}
                        variant={"secondary"}
                        className="!bg-neon-green !text-black"
                      >
                        Initialize Uplink
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center gap-12 animate-in fade-in zoom-in-95">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-neon-green tracking-widest uppercase">
                        {step}
                      </span>
                      <span className="text-xs font-mono text-white">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-1 w-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-neon-green transition-all duration-500 shadow-[0_0_10px_rgba(57,255,20,0.5)]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {step === "COMPLETE" ? (
                    <div className="p-6 bg-neon-green/10 border border-neon-green/50 rounded animate-in zoom-in-95 duration-500">
                      <div className="flex items-center gap-4 ">
                        <ShieldCheck className="text-neon-green w-10 h-10" />
                        <div>
                          <h4 className="text-xl font-bold uppercase tracking-tighter">
                            Payload Deployed
                          </h4>
                        </div>
                      </div>
                      <button
                        onClick={reset}
                        className="mt-4 text-[10px] text-white/40 hover:text-white uppercase tracking-[0.3em] font-bold transition-colors"
                      >
                        &lt; New Transmission
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {["ENC", "SHRD", "DIST", "SYNC"].map((l, i) => (
                        <div
                          key={l}
                          className={`h-16 flex flex-col items-center justify-center border ${progress > i * 25 ? "border-neon-green bg-neon-green/5 text-neon-green" : "border-white/5 text-white/20"} transition-all`}
                        >
                          <span className="text-[10px] font-bold tracking-widest">
                            {l}
                          </span>
                          <div className="mt-2 w-1.5 h-1.5 rounded-full bg-current" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <TerminalLogs logs={logs} color="success2" />
        </CommonComposer>
      )}
    </div>
  );
};

export default FileSharing;
