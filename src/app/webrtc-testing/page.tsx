// "use client";

// import { useEffect, useState } from "react";
// import "@/lib/PeerToPeer";
// import WebRTCPeerConnection from "@/lib/PeerToPeer";

// const WebRtcTesting = () => {
//   const [sender, setSender] = useState<WebRTCPeerConnection | null>(null);
//   const [receiver, setReceiver] = useState<WebRTCPeerConnection | null>(null);
//   const [answer, setAnswer] = useState<RTCSessionDescriptionInit | null>(null);
//   const [offer, setOffer] = useState<RTCSessionDescriptionInit | null>(null);
//   const [message, setMessage] = useState<string>("");
//   useEffect(() => {
//     console.log("WebRTC Mounted");
//   }, []);
//   const createSender = () => {
//     const SenderPeer = new WebRTCPeerConnection(true);
//     setSender(SenderPeer);
//   };
//   const createReceiver = () => {
//     const ReceiverPeer = new WebRTCPeerConnection(false);
//     setReceiver(ReceiverPeer);
//   };
//   const GenerateAnswer = async () => {
//     if (!receiver) {
//       console.log("Set Receiver first");
//       return;
//     }
//     if (!offer) {
//       console.log("Generate Offer First !!!");
//       return;
//     }
//     const Answer = await receiver.createAnswer(offer);
//     setAnswer(Answer);
//     console.log("Answer set successfully");
//   }; //   const GenerateOffer = async () => {
//     if (!sender) {
//       console.log("Create sender first");
//       return;
//     }

//     const Offer = await sender.createOffer();
//     if (Offer) {
//       setOffer(Offer);
//       console.log("Offer set successfullly");
//     }
//   };

//   return <div></div>;
// };

// export default WebRtcTesting;
"use client";

import { useEffect, useState } from "react";
import WebRTCPeerConnection from "@/lib/PeerToPeer";
import { io } from "socket.io-client";

const WebRtcTesting = () => {
  const socket = io("http://localhost:8000");
  const [sender, setSender] = useState<WebRTCPeerConnection | null>(null);
  const [receiver, setReceiver] = useState<WebRTCPeerConnection | null>(null);
  const [answer, setAnswer] = useState<RTCSessionDescriptionInit | null>(null);
  const [offer, setOffer] = useState<RTCSessionDescriptionInit | null>(null);
  const [message, setMessage] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
    };
    console.log("WebRTC Testing Mounted");
    if (socket.connected) {
      onConnect();
    }
  }, []);

  const createSender = () => {
    console.log("Creating sender (offerer)...");
    const senderPeer = new WebRTCPeerConnection(true);
    setSender(senderPeer);
  };

  const createReceiver = () => {
    console.log("Creating receiver (answerer)...");
    const receiverPeer = new WebRTCPeerConnection(false);
    setReceiver(receiverPeer);
  };

  const generateAnswer = async () => {
    if (!receiver) {
      console.log("Create receiver first!");
      return;
    }

    // Fix: Check if offer exists before using it
    if (!offer) {
      console.log("Generate offer first!");
      return;
    }

    const answerSdp = await receiver.createAnswer(offer);
    if (answerSdp) {
      setAnswer(answerSdp);
      console.log("Answer generated successfully!");
    }
  };

  const generateOffer = async () => {
    if (!sender) {
      console.log("Create sender first!");
      return;
    }

    const offerSdp = await sender.createOffer();
    if (offerSdp) {
      setOffer(offerSdp);
      console.log("Offer generated successfully!");
    }
  };

  const completeConnection = async () => {
    if (!sender || !answer) {
      console.log("Need sender and answer!");
      return;
    }

    await sender.setRemoteAnswer(answer);
    console.log("Connection should be established!");
  };

  const sendTestMessage = () => {
    if (!sender) {
      console.log("Create sender first!");
      return;
    }
    sender.sendMessage(message || "Hello from sender!");
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">WebRTC Testing</h1>
      <h1 className="text-2xl font-bold">
        {isConnected ? "Connected" : "Disconnected"}
      </h1>

      <div className="space-y-2">
        <h2 className="text-xl">1. Create Peers</h2>
        <button
          onClick={createSender}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          Create Sender
        </button>
        <button
          onClick={createReceiver}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Create Receiver
        </button>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl">2. Generate Offer</h2>
        <button
          onClick={generateOffer}
          className="bg-purple-500 text-white px-4 py-2 rounded"
          disabled={!sender}
        >
          Generate Offer
        </button>
        {offer && (
          <div className="bg-gray-100 p-2 rounded text-black">
            <strong>Offer SDP:</strong>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(offer, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-xl">3. Create Answer</h2>
        <button
          onClick={generateAnswer}
          className="bg-orange-500 text-white px-4 py-2 rounded"
          disabled={!receiver || !offer}
        >
          Accept Offer & Create Answer
        </button>
        {answer && (
          <div className="bg-gray-100 p-2 rounded text-black">
            <strong>Answer SDP:</strong>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(answer, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-xl">4. Complete Connection</h2>
        <button
          onClick={completeConnection}
          className="bg-red-500 text-white px-4 py-2 rounded"
          disabled={!sender || !answer}
        >
          Complete Connection
        </button>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl">5. Send Message</h2>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter message..."
          className="border p-2 rounded text-black"
        />
        <button
          onClick={sendTestMessage}
          className="bg-yellow-500 text-black px-4 py-2 rounded ml-2"
          disabled={!sender}
        >
          Send Message
        </button>
      </div>

      <div className="text-sm text-gray-300">
        <p>Open browser console (F12) to see detailed logs!</p>
        <p>Follow steps 1→2→3→4→5 in order</p>
      </div>
    </div>
  );
};

export default WebRtcTesting;
