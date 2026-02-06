"use client";
import { useSocket } from "@/context/SocketProvider";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import WebRTCPeerConnection from "@/lib/PeerToPeer";

const Recieve = () => {
  const params = useParams<{ id: string }>();
  const targetUserId = params.id as string;
  const { socket, socketId, userId: myUserId } = useSocket();

  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [receiver, setReceiver] = useState<WebRTCPeerConnection | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (!socket || !targetUserId) {
      console.log("⏳ Receiver: Waiting for socket or targetUserId...");
      return;
    }

    console.log("🔍 Receiver: Starting connection process for:", targetUserId);
    console.log("   Receiver: My userId:", myUserId);
    setIsChecking(true);

    const handleConnect = () => {
      console.log("🔌 Receiver: Socket connected, registering...");
      socket.emit("register", {
        userId: myUserId,
        socketId: socket.id,
      });
      setIsRegistered(true);

      // Check user and connect after registration
      setTimeout(() => {
        checkUserAndConnect();
      }, 500); // Small delay to ensure registration completes
    };

    const checkUserAndConnect = () => {
      console.log("✅ Receiver: Checking user existence:", targetUserId);
      socket.emit("check-user", targetUserId, (response: any) => {
        console.log("📊 Receiver: User check response:", response);
        setUserExists(response.exists);
        setIsChecking(false);

        if (response.exists) {
          console.log("🎉 Receiver: Target found! Requesting connection...");
          setConnectionStatus("requesting");

          socket.emit("request-connection", {
            targetUserId: targetUserId,
            fromUserId: myUserId,
          });
        } else {
          console.log("❌ Receiver: Target user not found or offline");
          setConnectionStatus("not-found");
          setErrorMessage("User is not online or doesn't exist");
        }
      });
    };

    // Handle connection if already connected
    if (socket.connected) {
      handleConnect();
    }

    // Setup event listeners
    socket.on("connect", handleConnect);

    socket.on("offer", async (data) => {
      console.log("🎉 Receiver: OFFER RECEIVED!");
      console.log("   From user:", data.fromUserId);
      console.log("   Offer type:", data.offer?.type);
      console.log("   Full data:", JSON.stringify(data, null, 2));

      setConnectionStatus("offer-received");

      try {
        // Always create fresh receiver for each offer
        console.log("🤖 Receiver: Creating fresh receiver peer...");
        const receiverPeer = new WebRTCPeerConnection(false);
        setReceiver(receiverPeer);

        // Set remote offer
        console.log("📥 Receiver: Setting remote offer...");
        await receiverPeer.setRemoteOffer(data.offer);

        // Create and send answer
        console.log("📤 Receiver: Creating answer...");
        const answer = await receiverPeer.createAnswer(data.offer);

        socket.emit("answer", {
          targetUserId: data.fromUserId,
          answer: answer,
        });

        setConnectionStatus("connected");
        console.log("✅ Receiver: WebRTC connection established!");

        // Setup message handler
        // if (receiverPeer.onMessage) {
        //   receiverPeer.onMessage = (message) => {
        //     console.log("📨 Receiver: Message received:", message);
        //   };
        // }
      } catch (error) {
        console.error("❌ Receiver: Error handling offer:", error);
        setConnectionStatus("failed");
        setErrorMessage(`Failed to process WebRTC offer: ${error}`);
      }
    });

    socket.on("connection-requested", (data) => {
      console.log("📤 Receiver: Connection request sent:", data);
      setConnectionStatus("waiting-response");
    });

    socket.on("connection-failed", (data) => {
      console.log("❌ Receiver: Connection failed:", data);
      setConnectionStatus("failed");
      setErrorMessage(data.reason || "Connection failed");
    });

    socket.on("answer", (data) => {
      console.log("📥 Receiver: Received WebRTC answer from:", data.fromUserId);
    });

    socket.on("ice-candidate", (data) => {
      console.log("📥 Receiver: Received ICE candidate from:", data.fromUserId);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Receiver: Socket disconnected!");
      setIsRegistered(false);
    });

    // Cleanup function
    return () => {
      console.log("🧹 Receiver: Cleaning up listeners");
      socket.off("connect", handleConnect);
      socket.off("offer");
      socket.off("connection-requested");
      socket.off("connection-failed");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("disconnect");
    };
  }, [socket, targetUserId, myUserId]);

  const retryConnection = () => {
    setIsChecking(true);
    setConnectionStatus("idle");
    setErrorMessage("");
    setReceiver(null);

    // Retry after a short delay
    setTimeout(() => {
      if (socket) {
        socket.emit("check-user", targetUserId, (response: any) => {
          console.log("🔄 Receiver: Retry - User check response:", response);
          setUserExists(response.exists);
          setIsChecking(false);

          if (response.exists) {
            setConnectionStatus("requesting");
            socket.emit("request-connection", {
              targetUserId: targetUserId,
              fromUserId: myUserId,
            });
          } else {
            setConnectionStatus("not-found");
            setErrorMessage("User is still not online");
          }
        });
      }
    }, 1000);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "text-green-400";
      case "failed":
      case "not-found":
        return "text-red-400";
      case "offer-received":
        return "text-purple-400";
      case "requesting":
      case "waiting-response":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="min-h-screen p-8 bg-[#050505]">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-white">📥 Receive Files</h1>

        {/* Connection Info */}
        <div className="bg-gray-800 p-6 rounded-lg mb-4">
          <div className="mb-3">
            <p className="text-sm text-gray-400">Target User (Sender):</p>
            <code className="text-white bg-gray-900 px-2 py-1 rounded">
              {targetUserId}
            </code>
          </div>
          <div className="mb-3">
            <p className="text-sm text-gray-400">My User ID (Receiver):</p>
            <code className="text-white bg-gray-900 px-2 py-1 rounded">
              {myUserId}
            </code>
          </div>
          <div className="mb-3">
            <p className="text-sm text-gray-400">Socket Status:</p>
            <span className={socketId ? "text-green-400" : "text-red-400"}>
              {socketId ? `🟢 Connected (${socketId})` : "🔴 Disconnected"}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-400">Registration:</p>
            <span className={isRegistered ? "text-green-400" : "text-red-400"}>
              {isRegistered ? "🟢 Registered" : "🔴 Not Registered"}
            </span>
          </div>
        </div>

        {/* Checking Status */}
        {isChecking && (
          <div className="bg-blue-900/20 border border-blue-500 p-6 rounded-lg mb-4">
            <p className="text-blue-400">🔍 Checking if sender is online...</p>
          </div>
        )}

        {/* User Not Found */}
        {!isChecking && userExists === false && (
          <div className="bg-red-900/20 border border-red-500 p-6 rounded-lg mb-4">
            <p className="text-red-400 font-bold text-xl mb-2">
              ❌ Sender Not Found
            </p>
            <p className="text-sm text-gray-300">
              The person who shared this link is not currently online.
            </p>
            {errorMessage && (
              <p className="text-sm text-red-300 mt-2">{errorMessage}</p>
            )}
            <button
              onClick={retryConnection}
              className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              🔄 Retry Connection
            </button>
          </div>
        )}

        {/* Connection Status */}
        {!isChecking && userExists === true && (
          <div className="bg-green-900/20 border border-green-500 p-6 rounded-lg mb-4">
            <p className="text-green-400 font-bold text-xl mb-3">
              ✅ Sender is Online!
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">
                  Connection Status:
                </span>
                <span className={`font-mono ${getStatusColor()}`}>
                  {connectionStatus}
                </span>
              </div>

              {connectionStatus === "requesting" && (
                <p className="text-yellow-300">
                  📤 Sending connection request...
                </p>
              )}

              {connectionStatus === "waiting-response" && (
                <p className="text-yellow-300">
                  ⏳ Waiting for sender to respond...
                </p>
              )}

              {connectionStatus === "offer-received" && (
                <p className="text-purple-300">🤝 Processing WebRTC offer...</p>
              )}

              {connectionStatus === "connected" && (
                <div>
                  <p className="text-green-300 font-bold">
                    🎉 Connected! Ready to receive files!
                  </p>
                  <p className="text-sm text-green-200 mt-1">
                    Secure P2P connection established with {targetUserId}
                  </p>
                </div>
              )}

              {connectionStatus === "failed" && (
                <div>
                  <p className="text-red-300">❌ {errorMessage}</p>
                  <button
                    onClick={retryConnection}
                    className="mt-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  >
                    🔄 Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* WebRTC Status */}
        {receiver && (
          <div className="bg-purple-900/20 border border-purple-500 p-4 rounded-lg mb-4">
            <h2 className="text-purple-400 font-bold mb-2">🔗 WebRTC Status</h2>
            <p className="text-sm">Receiver Peer: 🟢 Created and Ready</p>
            <p className="text-xs text-gray-400 mt-1">
              Secure P2P connection active - ready to receive files!
            </p>
          </div>
        )}

        {/* Debug Info */}
        <div className="bg-gray-900 p-4 rounded-lg mb-4">
          <p className="text-xs text-gray-500 mb-2">🐛 Debug Info:</p>
          <pre className="text-xs text-gray-400 overflow-auto">
            {JSON.stringify(
              {
                targetUserId,
                myUserId,
                socketId,
                isRegistered,
                userExists,
                isChecking,
                connectionStatus,
                hasReceiver: !!receiver,
              },
              null,
              2,
            )}
          </pre>
        </div>

        {/* Instructions */}
        <div className="bg-gray-900 p-4 rounded-lg text-sm">
          <h3 className="text-gray-300 font-bold mb-2">📋 What's happening:</h3>
          <ol className="text-gray-400 list-decimal list-inside space-y-1">
            <li>Connecting and registering with signaling server</li>
            <li>Checking if sender ({targetUserId}) is online</li>
            <li>Requesting connection to sender</li>
            <li>Waiting for WebRTC offer from sender</li>
            <li>Establishing secure P2P connection</li>
            <li>Ready to receive files directly!</li>
          </ol>
          <p className="text-xs text-gray-500 mt-3">
            💡 Check browser console (F12) for detailed connection logs
          </p>
        </div>
      </div>
    </div>
  );
};

export default Recieve;
