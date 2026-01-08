"use client";

import CommonComposer from "@/app/common/CommonComposer";
import { useSocket } from "@/context/SocketProvider";
import WebRTCPeerConnection from "@/lib/PeerToPeer";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type ConnectionStatus =
  | "idle"
  | "checking"
  | "requesting"
  | "offer-received"
  | "connected"
  | "failed"
  | "not-found";

type DownloadStatus = "idle" | "receiving" | "success" | "error";

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
  const { socket, socketId, userId: myUserId } = useSocket();
  const params = useParams<{ id: string }>();
  const targetUserId = params.id as string;

  const [receiver, setReceiver] = useState<WebRTCPeerConnection | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("idle");
  const [error, setError] = useState<string>("");

  // File Related states
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
  const [receivedChunks, setReceivedChunks] = useState<Uint8Array[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>("idle");
  const [receivedFile, setReceivedFile] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState("");

  // Web Worker for expensive tasks
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("@/lib/worker.ts", import.meta.url),
      { type: "module" },
    );
    // workerRef.current.postMessage(2);
    // workerRef.current.onmessage = (e) => {
    //   console.log("Message received from worker:", e.data);
    // };

    return () => workerRef.current?.terminate();
  }, []);

  useEffect(() => {
    if (!socket || !targetUserId) {
      console.log(" Receiver: Waiting for socket or targetUserId...");
      return;
    }

    console.log(" Receiver: Starting connection process for:", targetUserId);

    const handleConnect = () => {
      console.log(" Receiver: Socket connected, registering...");
      setConnectionStatus("checking");

      socket.emit("register", {
        userId: myUserId,
        socketId: socket.id,
      });
      setIsRegistered(true);

      // Check user and connect after registration
      setTimeout(() => {
        checkUserAndConnect();
      }, 500);
    };

    const checkUserAndConnect = () => {
      console.log(" Receiver: Checking user existence:", targetUserId);
      socket.emit("check-user", targetUserId, (response: SocketResponse) => {
        console.log(" Receiver: User check response:", response);
        setUserExists(response.exists);

        if (response.exists) {
          console.log(" Receiver: Target found! Requesting connection...");
          setConnectionStatus("requesting");

          // Request connection (this triggers incoming-connection on sender)
          socket.emit("request-connection", {
            targetUserId: targetUserId,
            fromUserId: myUserId,
          });
        } else {
          console.log(" Receiver: Target user not found or offline");
          setConnectionStatus("not-found");
          setError("User is not online or doesn't exist");
        }
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
        console.log(" Receiver: OFFER RECEIVED from:", data.fromUserId);
        setConnectionStatus("offer-received");

        try {
          const receiverPeer = new WebRTCPeerConnection(false);
          setReceiver(receiverPeer);

          // Setup data handler - this is the key fix!
          // receiverPeer.onData(handleIncomingData);

          // Setup connection state handler
          receiverPeer.onConnectionState((state) => {
            console.log("WebRTC Connection State:", state);
            if (state === "connected") {
              setConnectionStatus("connected");
            } else if (state === "failed") {
              setConnectionStatus("failed");
              setError("WebRTC connection failed");
            }
          });

          await receiverPeer.setRemoteOffer(data.offer);
          const answer = await receiverPeer.createAnswer(data.offer);

          if (answer) {
            socket.emit("answer", {
              targetUserId: data.fromUserId,
              answer: answer,
            });
            console.log(" Receiver: Answer sent, waiting for connection...");
          }

          receiverPeer.onData((receivedData) => {
            console.log(" RAW DATA RECEIVED:", receivedData);
            console.log(" DATA TYPE:", typeof receivedData);
            // console.log(
            //   " DATA CONTENT:",
            //   JSON.stringify(receivedData, null, 2),
            // );
            if (receivedData && typeof receivedData == "object") {
              const data = receivedData as FileMessage;
              if (data.type === "file-info") {
                workerRef.current?.postMessage({
                  status: "file-info",
                  fileSize: data.size,
                });
                setFileName(data.name);
                // setFileMetadata({
                //   name: data.name,
                //   size: data.size,
                //   mimeType: data.mimeType,
                // });
              } else if (data.type == "file-chunk") {
                workerRef.current?.postMessage(data);
                //Handle File-Chunking
              } else {
                // console.log("nothing");
                workerRef.current?.postMessage({ status: "file-complete" });

                workerRef.current?.addEventListener("message", (e) => {
                  console.log("Jaan ", e.data);
                });
              }
            }
          });
        } catch (connectionError) {
          console.error(" Receiver: Error handling offer:", connectionError);
          setConnectionStatus("failed");
          const errorMessage =
            connectionError instanceof Error
              ? connectionError.message
              : "Unknown error occurred";
          setError(`Failed to process offer: ${errorMessage}`);
        }
      },
    );

    socket.on("connection-requested", (data: unknown) => {
      console.log(" Receiver: Connection request sent:", data);
    });

    socket.on("connection-failed", (data: { reason?: string }) => {
      console.log(" Receiver: Connection failed:", data);
      setConnectionStatus("failed");
      setError(data.reason || "Connection failed");
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("offer");
      socket.off("connection-requested");
      socket.off("connection-failed");
    };
  }, [socket, targetUserId, myUserId]);

  const fileUrl = receivedFile ? URL.createObjectURL(receivedFile) : null;
  useEffect(() => {
    if (!workerRef.current) return;
    workerRef.current.onmessage = (e) => {
      const { blob } = e.data;
      if (blob) {
        setReceivedFile(blob);
      }
    };
  }, []);

  return (
    <div>
      {receivedFile && (
        <a
          href={URL.createObjectURL(receivedFile)}
          download={fileName || "received-file"}
        >
          <button>Download File</button>
        </a>
      )}
    </div>
  );
};

export default Receiver;
