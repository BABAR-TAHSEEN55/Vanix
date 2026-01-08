"use client";

import { useSocket } from "@/context/SocketProvider";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import WebRTCPeerConnection from "@/lib/PeerToPeer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type UploadStatus = "idle" | "uploading" | "success" | "error";

const CHUNK_SIZE = 40 * 1024; // 16 KB

const FileSharing = () => {
  const { socket, socketId, userId } = useSocket();

  const [sender, setSender] = useState<WebRTCPeerConnection | null>(null);
  const [file, setFile] = useState<File | null>(null);
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
    if (!sender || !file) {
      alert("No connection or file selected");
      return;
    }

    if (!sender.isDataChannelOpen()) {
      alert("Data channel not ready yet. Please wait a moment and try again.");
      return;
    }

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
    console.log(" Connection reset");
  };

  // Check if we can send files
  const canSendFiles = sender && isDataChannelOpen && !isUploading;

  return (
    <div className="space-y-6 max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold"> Send Files P2P</h2>

      {/* Connection Status */}
      <div className="p-4 border rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm">
            <strong>Status:</strong>{" "}
            <span
              className={
                isDataChannelOpen
                  ? "text-green-600"
                  : connectedUser
                    ? "text-yellow-600"
                    : "text-gray-600"
              }
            >
              {!connectedUser && "Waiting for receiver..."}
              {connectedUser &&
                !isDataChannelOpen &&
                ` Connecting to ${connectedUser}...`}
              {connectedUser &&
                isDataChannelOpen &&
                ` Ready to send to ${connectedUser}`}
            </span>
          </p>

          {connectedUser && (
            <Button onClick={resetConnection} variant="outline" size="sm">
              Reset
            </Button>
          )}
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>Socket: {socketId ? "✅ Connected" : "❌ Disconnected"}</p>
          <p>Registered: {isRegistered ? "✅ Yes" : "❌ No"}</p>
          <p>WebRTC Peer: {sender ? "✅ Created" : "❌ Not Created"}</p>
          <p>
            WebRTC State:{" "}
            <span className="font-mono">{webrtcConnectionState}</span>
          </p>
          <p>Data Channel: {isDataChannelOpen ? "✅ Open" : "❌ Closed"}</p>
          <p>Ready to Send: {canSendFiles ? "✅ Yes" : "❌ Not Ready"}</p>
          <p>Processing: {isProcessingConnection ? "⏳ Yes" : "✅ No"}</p>
        </div>
      </div>

      {/* Share Link */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium mb-2">📋 Your Shareable Link</h3>
        <div className="bg-gray-900 p-2 rounded mb-2">
          <code className="text-blue-400 text-xs break-all">
            {shareableLink}
          </code>
        </div>
        <Button
          // onClick={copyShareableLink}
          variant="outline"
          size="sm"
          className="bg-green-200"
        >
          <Link href={shareableLink} target="_blank">
            Go To Link
          </Link>
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
          disabled={!file || !canSendFiles}
          onClick={handleWebRTCFileUpload}
          className="w-full"
        >
          {isUploading ? "📤 Sending..." : "📤 Send File"}
        </Button>

        {/* Helpful Messages */}
        {file && !canSendFiles && (
          <p className="text-xs text-gray-500 text-center">
            {!sender && "Waiting for receiver to connect..."}
            {sender && !isDataChannelOpen && "🔗 Data channel opening..."}
          </p>
        )}

        {status === "success" && (
          <p className="text-green-600 text-center">File sent successfully!</p>
        )}
      </div>
    </div>
  );
};

export default FileSharing;
