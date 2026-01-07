"use client";

import { useEffect, useState } from "react";
import WebRTCPeerConnection from "@/lib/PeerToPeer";
import { useSocket } from "@/context/SocketProvider";

const WebRtcTesting = () => {
  const { socket, socketId, userId } = useSocket();

  const [sender, setSender] = useState<WebRTCPeerConnection | null>(null);
  const [receiver, setReceiver] = useState<WebRTCPeerConnection | null>(null);
  const [connectionRequests, setConnectionRequests] = useState<any[]>([]);
  const [connectedUser, setConnectedUser] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isRegistered, setIsRegistered] = useState(false);

  const shareableLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/webrtc-testing/recieve-test/${userId}`
      : "";

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
      setConnectionRequests((prev) => [...prev, data]);
      setConnectedUser(data.fromUserId);

      setSender((currentSender) => {
        if (!currentSender) {
          console.log(
            "Sender: Auto-creating sender for incoming connection...",
          );
          const senderPeer = new WebRTCPeerConnection(true);

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

    socket.on("offer", async (data) => {
      console.log("Sender: Received WebRTC offer from:", data.fromUserId);

      if (!receiver) {
        console.log("Sender: Auto-creating receiver for offer...");
        const receiverPeer = new WebRTCPeerConnection(false);
        setReceiver(receiverPeer);

        try {
          await receiverPeer.setRemoteOffer(data.offer);
          const answer = await receiverPeer.createAnswer(data.offer);

          socket.emit("answer", {
            targetUserId: data.fromUserId,
            answer: answer,
          });
          console.log("Sender: Answer sent to", data.fromUserId);
        } catch (error) {
          console.error("Sender: Error handling offer:", error);
        }
      }
    });

    socket.on("answer", async (data) => {
      console.log("Sender: Received WebRTC answer from:", data.fromUserId);

      setSender((currentSender) => {
        if (currentSender) {
          currentSender
            .setRemoteAnswer(data.answer)
            .then(() => {
              console.log("Sender: P2P CONNECTION ESTABLISHED!");
            })
            .catch((error) => {
              console.error("Sender: Error setting remote answer:", error);
            });
        } else {
          console.log("Sender: No sender peer to set answer");
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
    });

    return () => {
      console.log("Sender: Cleaning up listeners");
      socket.off("connect", handleConnect);
      socket.off("incoming-connection");
      socket.off("offer");
      socket.off("answer");
      socket.off("connection-requested");
      socket.off("connection-failed");
      socket.off("disconnect");
    };
  }, [socket, userId]);

  const copyShareableLink = () => {
    navigator.clipboard.writeText(shareableLink);
    alert("Link copied! Share it to receive files from someone.");
  };

  const sendTestMessage = () => {
    if (!sender) {
      alert("No WebRTC connection established!");
      return;
    }
    const msg = message || "Hello from WebRTC!";
    sender.sendMessage(msg);
    console.log("Message sent:", msg);
  };

  const resetConnection = () => {
    setSender(null);
    setReceiver(null);
    setConnectionRequests([]);
    setConnectedUser("");
    console.log("Connection reset");
  };

  return (
    <div className="p-8 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold">Share Files P2P</h1>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-3">Status</h2>
        <div className="space-y-1 text-sm">
          <p>Socket: {socketId ? "Connected" : "Disconnected"}</p>
          <p>Registered: {isRegistered ? "Yes" : "No"}</p>
          <p>
            Your ID:{" "}
            <code className="bg-gray-700 px-2 py-1 rounded text-green-400">
              {userId}
            </code>
          </p>
          <p>WebRTC Sender: {sender ? "Ready" : "Not Created"}</p>
          <p>WebRTC Receiver: {receiver ? "Ready" : "Not Created"}</p>
        </div>
      </div>

      <div className="bg-blue-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-3">Your Shareable Link</h2>
        <div className="bg-gray-900 p-3 rounded mb-3">
          <p className="text-sm text-gray-400 mb-1">
            Share this link to receive files:
          </p>
          <code className="text-blue-400 text-sm break-all">
            {shareableLink}
          </code>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={copyShareableLink}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            disabled={!shareableLink}
          >
            Copy Link
          </button>
          <button
            onClick={resetConnection}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Reset
          </button>
        </div>
        <p className="text-sm text-gray-300 mt-2">
          When someone opens this link, you ll connect automatically!
        </p>
      </div>

      {connectionRequests.length === 0 && isRegistered && (
        <div className="bg-yellow-800 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Waiting for Connection</h2>
          <p className="text-yellow-300">
            Share your link and wait for someone to open it...
          </p>
        </div>
      )}

      {connectionRequests.length > 0 && (
        <div className="bg-green-800 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-3">Connected Users</h2>
          {connectionRequests.map((request, index) => (
            <div key={index} className="bg-green-700 p-3 rounded mb-2">
              <p>
                Connected to: <strong>{request.fromUserId}</strong>
              </p>
              <p className="text-sm text-green-200">
                Socket: {request.fromSocketId}
              </p>
              <p className="text-xs text-green-300">
                WebRTC Status: {sender ? "P2P Ready" : "Setting up..."}
              </p>
            </div>
          ))}
        </div>
      )}

      {(sender || receiver) && (
        <div className="bg-purple-800 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-3">Test Connection</h2>
          <div className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter test message..."
              className="flex-1 p-2 rounded text-black"
            />
            <button
              onClick={sendTestMessage}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
              disabled={!sender}
            >
              Send Message
            </button>
          </div>
          <p className="text-sm text-purple-200 mt-2">
            Check browser console to see if messages are received!
          </p>
        </div>
      )}

      <div className="bg-gray-900 p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-2">Quick Test</h2>
        <p className="text-sm text-gray-400 mb-2">
          Open your shareable link in another browser tab to test the
          connection:
        </p>
        <button
          onClick={() => window.open(shareableLink, "_blank")}
          className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded"
        >
          Open Link in New Tab
        </button>
      </div>

      <div className="bg-gray-900 p-4 rounded-lg text-sm text-gray-400">
        <h3 className="font-bold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Copy your shareable link above</li>
          <li>Share it with someone OR open it in a new browser tab</li>
          <li>Watch the connection status change to Connected Users</li>
          <li>Test messaging to verify P2P connection works</li>
          <li>Check browser console (F12) for detailed logs</li>
        </ol>
      </div>
    </div>
  );
};

export default WebRtcTesting;
// 1) Check how the SenderPeer
// 2) Create socket context
// 3) Establish a conection through a nonoid id through a link
// 4) Create a worker
// 5) Send File
//TODO : Wrap the context for just feature scope ( that is webrtc testing)
//
//
//
