"use client";

import { useSocket } from "@/context/SocketProvider";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import WebRTCPeerConnection from "@/lib/PeerToPeer";
import { Button } from "@/components/ui/button";

type UploadStatus = "idle" | "uploading" | "success" | "error";
type ConnectionStatus = "waiting" | "connected" | "idle";

const CHUNK_SIZE = 16 * 1024; // 16 KB

const FileSharing = () => {
  const { socket, socketId, userId } = useSocket();

  const [sender, setSender] = useState<WebRTCPeerConnection | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [connectedUser, setConnectedUser] = useState<string>("");

  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("idle");
  const [isRegistered, setIsRegistered] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleWebRTCFileUpload = () => {
    if (!sender || !file) return;

    setIsUploading(true);
    setStatus("uploading");
    setProgress(0);

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
          setTimeout(sendNextChunk, 10); // prevents buffer overload
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

  const copyShareableLink = () => {
    navigator.clipboard.writeText(shareableLink);
    alert("Link copied! Share it to receive files from someone.");
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
      setConnectionStatus("waiting");
    };

    if (socket.connected) {
      handleConnect();
    }
    socket.on("connect", handleConnect);

    socket.on("incoming-connection", (data) => {
      console.log("Sender: Incoming connection request:", data);
      setConnectionRequests((prev) => [...prev, data]);
      setConnectedUser(data.fromUserId);
      setConnectionStatus("connected");

      setSender((currentSender) => {
        if (!currentSender) {
          console.log(
            "Sender: Auto-creating sender for incoming connection...",
          );
          const senderPeer = new WebRTCPeerConnection(true);

          // Auto-send offer after short delay
          setTimeout(async () => {
            try {
              console.log("Sender: Creating and sending offer...");
              const offer = await senderPeer.createOffer();

              socket.emit("offer", {
                targetUserId: data.fromUserId,
                offer: offer,
              });
              console.log("Sender: Offer sent to", data.fromUserId);
            } catch (error) {
              console.error("Sender: Error creating offer:", error);
            }
          }, 300);

          return senderPeer;
        } else {
          console.log("Sender: Using existing sender peer");
          return currentSender;
        }
      });
    });

    socket.on("answer", async (data) => {
      console.log("Sender: Received WebRTC answer from:", data.fromUserId);

      setSender((currentSender) => {
        if (currentSender) {
          currentSender
            .setRemoteAnswer(data.answer)
            .then(() => {
              console.log("Sender: P2P CONNECTION ESTABLISHED!");
              setConnectionStatus("connected");
            })
            .catch((error) => {
              console.error("Sender: Error setting remote answer:", error);
            });
        }
        return currentSender;
      });
    });

    socket.on("connection-requested", (data) => {
      console.log("Sender: Connection request sent:", data);
    });

    socket.on("connection-failed", (data) => {
      console.log("Sender: Connection failed:", data);
      alert(`Connection failed: ${data.reason}`);
    });

    socket.on("disconnect", () => {
      console.log("Sender: Socket disconnected!");
      setIsRegistered(false);
      setConnectionStatus("idle");
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
  }, [socket, userId]);

  return (
    <div className="space-y-6 max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold">📤 Send Files P2P</h2>

      {/* Connection Status */}
      <div className="p-4 border rounded-lg">
        <p className="text-sm mb-2">
          <strong>Status:</strong>{" "}
          <span
            className={
              connectionStatus === "connected"
                ? "text-green-600"
                : connectionStatus === "waiting"
                  ? "text-yellow-600"
                  : "text-gray-600"
            }
          >
            {connectionStatus === "idle" && "Not registered"}
            {connectionStatus === "waiting" && "Waiting for receiver..."}
            {connectionStatus === "connected" &&
              `✅ Connected to ${connectedUser}`}
          </span>
        </p>

        <p className="text-xs text-gray-500">
          Socket: {socketId ? "✅ Connected" : "❌ Disconnected"}
        </p>
        <p className="text-xs text-gray-500">
          Registered: {isRegistered ? "✅ Yes" : "❌ No"}
        </p>
      </div>

      {/* Share Link */}
      <div className="p-4 bg-green-800 border border-blue-200 rounded-lg">
        <h3 className="font-medium mb-2">📋 Your Shareable Link</h3>
        <div className="bg-gray-900 p-2 rounded mb-2">
          <code className="text-blue-400 text-xs break-all">
            {shareableLink}
          </code>
        </div>
        <Button onClick={copyShareableLink} variant="outline" size="sm">
          📋 Copy Link
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          Share this link to send files to someone!
        </p>
      </div>

      {/* File Selection */}
      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />

        <Button
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
        >
          📁 Select File
        </Button>

        {file && (
          <div className="p-3 bg-gray-50 border rounded-lg">
            <p className="text-sm">
              <strong>Name:</strong> {file.name}
            </p>
            <p className="text-sm">
              <strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        {/* Upload Progress */}
        {status === "uploading" && (
          <div className="space-y-2">
            <p className="text-sm">Sending: {Math.round(progress)}%</p>
            <div className="w-full bg-gray-200 h-2 rounded">
              <div
                className="bg-green-500 h-2 rounded transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Send Button */}
        <Button
          disabled={!file || isUploading || connectionStatus !== "connected"}
          onClick={handleWebRTCFileUpload}
          className="w-full"
        >
          {isUploading ? "📤 Sending..." : "📤 Send File"}
        </Button>

        {status === "success" && (
          <p className="text-green-600 text-center">
            ✅ File sent successfully!
          </p>
        )}
      </div>
    </div>
  );
};

export default FileSharing;
