"use client";

import { useState, useRef, useEffect, useEffectEvent } from "react";
import {
  Download,
  Cpu,
  Terminal,
  RefreshCw,
  FileCode,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CommonComposer from "@/app/common/CommonComposer";
import { useSocket } from "@/context/SocketProvider";
import WebRTCPeerConnection from "@/lib/PeerToPeer";
import { useParams } from "next/navigation";
import {
  ConnectionStatus,
  ProtocolMode,
  RecoveryStep,
  TransmissionStep,
} from "@/types/common";
import useLogs from "@/hooks/useLogs";
import TerminalLogs from "@/app/common/TerminalLogs";

type FileMetadata = {
  name: string;
  size: number;
  mimeType: string;
};

type FileMessage =
  | {
      type: "file-info";
      name: string;
      size: number;
      mimeType: string;
    }
  | {
      type: "file-chunk";
      offset: number;
      isLast: boolean;
      data: number[];
    }
  | {
      type: "file-complete";
    };

interface SocketResponse {
  exists: boolean;
}

const Receiver = () => {
  const { socket, userId: myUserId } = useSocket();
  const params = useParams<{ id: string }>();
  const targetUserId = params.id as string;

  const [mode, setMode] = useState<ProtocolMode>("RECEIVE");
  const [step, setStep] = useState<TransmissionStep | RecoveryStep>("IDLE");

  const [progress, setProgress] = useState(0);

  const [receiver, setReceiver] = useState<WebRTCPeerConnection | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("idle");
  const [error, setError] = useState<string>("");
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
  const [receivedFile, setReceivedFile] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState("");

  // Web Worker for expensive tasks
  const workerRef = useRef<Worker | null>(null);

  const { addLog, setLogs, logs, clearLogs } = useLogs();

  const simulateRecovery = async () => {
    if (!targetUserId || !socket) return;

    setStep("LOCATING");
    setProgress(0);
    addLog(`Searching network for sender: ${targetUserId.substring(0, 8)}...`);

    // Check if user exists and connect
    socket.emit("check-user", targetUserId, (response: SocketResponse) => {
      if (response.exists) {
        addLog("Target found! Requesting connection...");
        setConnectionStatus("requesting");
        setStep("RECONSTRUCTING");
        setProgress(30);

        socket.emit("request-connection", {
          targetUserId: targetUserId,
          fromUserId: myUserId,
        });
      } else {
        addLog("Target user not found or offline");
        setConnectionStatus("not-found");
        setError("User is not online or doesn't exist");
        setStep("IDLE");
        setProgress(0);
      }
    });
  };

  const reset = () => {
    setStep("IDLE");
    clearLogs();
    setProgress(0);
    setReceivedFile(null);
    setFileMetadata(null);
    setConnectionStatus("idle");
    setError("");
  };

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("@/lib/worker.ts", import.meta.url),
      { type: "module" },
    );
    return () => workerRef.current?.terminate();
  }, []);
  const HandleLogState = useEffectEvent((message: string) => {
    // addLog("Waiting for socket or targetUserId...");
    addLog(message);
  });

  useEffect(() => {
    if (!socket || !targetUserId) {
      HandleLogState("Waiting for socket or targetUserId...");
      // addLog("Waiting for socket or targetUserId...");
      return;
    }

    // addLog(`Connection available for: ${targetUserId}`);

    HandleLogState(`Connection available for: ${targetUserId}`);

    const handleConnect = () => {
      addLog("Socket connected, registering...");
      socket.emit("register", {
        userId: myUserId,
        socketId: socket.id,
      });
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on("connect", handleConnect);

    socket.on(
      "offer",
      async (data: {
        fromUserId: string;
        offer: RTCSessionDescriptionInit;
      }) => {
        addLog(`OFFER RECEIVED from: ${data.fromUserId}`);
        setConnectionStatus("offer-received");
        setStep("DECRYPTING");
        setProgress(75);

        try {
          const receiverPeer = new WebRTCPeerConnection(false);
          setReceiver(receiverPeer);

          receiverPeer.onConnectionState((state) => {
            addLog(`WebRTC Connection State: ${state}`);
            if (state === "connected") {
              setConnectionStatus("connected");
              setStep("READY");
              setProgress(70);
              addLog("Connection established! Ready to receive file...");
            } else if (state === "failed") {
              setConnectionStatus("failed");
              setError("WebRTC connection failed");
              setStep("IDLE");
              setProgress(0);
            }
          });

          await receiverPeer.setRemoteOffer(data.offer);
          const answer = await receiverPeer.createAnswer(data.offer);

          if (answer) {
            socket.emit("answer", {
              targetUserId: data.fromUserId,
              answer: answer,
            });
            addLog("Answer sent, waiting for connection...");
          }

          receiverPeer.onData((receivedData) => {
            addLog("File data received");
            if (receivedData && typeof receivedData == "object") {
              const data = receivedData as FileMessage;
              if (data.type === "file-info") {
                workerRef.current?.postMessage({
                  status: "file-info",
                  fileSize: data.size,
                });
                setFileName(data.name);
                setFileMetadata({
                  name: data.name,
                  size: data.size,
                  mimeType: data.mimeType,
                });
                addLog(
                  `Receiving file: ${data.name} (${(data.size / 1024 / 1024).toFixed(2)} MB)`,
                );
                setProgress(100);
              } else if (data.type == "file-chunk") {
                workerRef.current?.postMessage(data);
              } else {
                workerRef.current?.postMessage({ status: "file-complete" });
                addLog("File transfer complete!");
              }
            }
          });
        } catch (connectionError) {
          addLog(`Error handling offer: ${connectionError}`);
          setConnectionStatus("failed");
          setError(`Failed to process offer`);
          setStep("IDLE");
          setProgress(0);
        }
      },
    );

    socket.on("connection-failed", (data: { reason?: string }) => {
      addLog(`Connection failed: ${data.reason || "Unknown reason"}`);
      setConnectionStatus("failed");
      setError(data.reason || "Connection failed");
      setStep("IDLE");
      setProgress(0);
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("offer");
      socket.off("connection-failed");
    };
  }, [socket, targetUserId, myUserId]);

  useEffect(() => {
    if (!workerRef.current) return;
    workerRef.current.onmessage = (e) => {
      const { blob } = e.data;
      if (blob) {
        setReceivedFile(blob);
        addLog("File ready for download!");
      }
    };
  }, []);

  const getStatusText = () => {
    if (step !== "IDLE") return step;
    return "DOWNLINK_STANDBY";
  };

  return (
    <div className="max-w-5xl mx-auto mt-8 md:mt-10 px-6 relative z-10">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded bg-white/5 border border-white/10">
          <Terminal size={14} className="text-neon-purple" />
          <span className="text-xs font-mono text-white/60 uppercase tracking-widest">
            Secure Payload File Receiver
          </span>
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
          Receive{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b026ff] to-[#00f3ff]">
            File
          </span>
        </h2>
      </div>

      <CommonComposer minHeight="min-h-[450px] mb-3" status={getStatusText()}>
        {mode === "RECEIVE" && (
          <div className="relative z-10 flex-1 flex flex-col">
            {step === "IDLE" ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-8">
                <div className="w-20 h-20 bg-neon-purple/10 border border-neon-purple/50 rounded-full flex items-center justify-center animate-pulse">
                  <HardDrive className="text-neon-purple w-10 h-10" />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">
                    Protocol Downlink
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                    Waiting for connection from sender:{" "}
                    {targetUserId?.substring(0, 8) || "Unknown"}
                  </p>
                </div>
                <div className="w-full max-w-sm">
                  <div className="relative group/input">
                    <input
                      value={`RECEIVE-${targetUserId?.substring(0, 8) || "XXXX"}`}
                      className="w-full bg-transparent border-b-2 border-white/10 py-4 px-2 text-center text-xl font-bold tracking-[0.2em] focus:outline-none focus:border-neon-purple transition-all placeholder:text-white/10 uppercase"
                      disabled
                    />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-0.5 bg-neon-purple transition-all duration-700" />
                  </div>
                  <Button
                    onClick={simulateRecovery}
                    disabled={!targetUserId}
                    className="w-full mt-8 !bg-neon-purple !text-white border-none disabled:opacity-30"
                  >
                    Initiate Connection
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center gap-12 animate-in fade-in zoom-in-95">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-neon-purple tracking-widest uppercase">
                      {step}
                    </span>
                    <span className="text-xs font-mono text-white">
                      {progress}%
                    </span>
                  </div>
                  <div className="h-1 w-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-neon-purple transition-all duration-500 shadow-[0_0_10px_rgba(188,19,254,0.5)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {step === "READY" && receivedFile ? (
                  <div className="p-8 bg-neon-purple/10 border border-neon-purple/50 rounded animate-in zoom-in-95">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-neon-purple/20 flex items-center justify-center rounded border border-neon-purple/40">
                        <Download className="text-neon-purple" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold uppercase tracking-tighter">
                          Recovery Successful
                        </h4>
                        <p className="text-xs text-neutral-400">
                          Payload reconstruction complete. File ready for
                          download.
                        </p>
                      </div>
                    </div>

                    <div className="bg-black/50 p-4 border border-white/10 flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <FileCode size={20} className="text-neutral-500" />
                        <span className="text-sm font-bold">
                          {fileName || "received_file.vault"}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-600">
                        {fileMetadata
                          ? `${(fileMetadata.size / 1024 / 1024).toFixed(2)} MB`
                          : "Unknown"}
                      </span>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        onClick={() => {
                          if (receivedFile) {
                            const url = URL.createObjectURL(receivedFile);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = fileName || "received-file";
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }
                        }}
                        className="flex-1 !bg-neon-purple !text-white border-none"
                      >
                        Download Decrypted Payload
                      </Button>
                      <Button
                        onClick={reset}
                        variant="outline"
                        className="px-6 border-white/20 hover:text-white"
                      >
                        <RefreshCw size={18} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                      <Cpu className="w-16 h-16 text-neon-purple animate-pulse" />
                      <div className="absolute inset-0 bg-neon-purple/20 blur-xl animate-pulse" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-xs font-bold tracking-widest animate-pulse">
                        {connectionStatus === "requesting"
                          ? "ESTABLISHING_CONNECTION"
                          : connectionStatus === "offer-received"
                            ? "PROCESSING_HANDSHAKE"
                            : connectionStatus === "connected"
                              ? "AWAITING_FILE_TRANSFER"
                              : "PROCESSING_RECOVERY_QUEUE"}
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        Connecting to:{" "}
                        {targetUserId || "relay-node-4029.shadow-drop.mesh"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <TerminalLogs logs={logs} color="success" />
      </CommonComposer>
    </div>
  );
};

export default Receiver;
