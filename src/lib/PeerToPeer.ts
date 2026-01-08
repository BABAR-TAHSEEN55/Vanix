const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:freestun.net:3479" },
    {
      urls: "turn:freestun.net:3479",
      username: "free",
      credential: "free",
    },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

type DataMessage = string | object;

class WebRTCPeerConnection {
  private peerConnection: RTCPeerConnection;
  private dataChannel: RTCDataChannel | null = null;
  public isSender: boolean;
  private onDataCallBack?: (data: DataMessage) => void;
  private onConnectionStateCallback?: (state: string) => void;

  constructor(isSender: boolean = true) {
    this.isSender = isSender;
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    this.setUpIceEventHandling();
    this.setUpConnectionStateHandling();

    if (isSender) {
      // Sender creates data channel and offer
      this.setUpDataChannels();
      this.peerConnection.onnegotiationneeded = async () => {
        this.createOffer();
      };
    } else {
      // Receiver waits for incoming data channel
      this.peerConnection.ondatachannel = (event) => {
        console.log("Data channel received from sender");
        console.log(JSON.stringify(event));
        this.dataChannel = event.channel;
        this.setupDataChannelHandlers(this.dataChannel);
      };
    }
  }

  public isDataChannelOpen(): boolean {
    return this.dataChannel?.readyState === "open";
  }

  public onData(callback: (data: DataMessage) => void) {
    this.onDataCallBack = callback;
  }

  public onConnectionState(callback: (state: string) => void) {
    this.onConnectionStateCallback = callback;
  }

  public async createOffer(): Promise<RTCSessionDescriptionInit | null> {
    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      console.log("Offer created and set as local description");
      console.log("Offer SDP:", offer);
      return offer;
    } catch (err) {
      console.log("Error while creating offer", err);
      return null;
    }
  }

  private setUpIceEventHandling() {
    this.peerConnection.onicecandidate = (e) => {
      if (e.candidate) {
        console.log("New ICE Candidate Found:", e.candidate);
      } else {
        console.log("ICE Gathering Complete");
        console.log(
          "Complete SDP:",
          JSON.stringify(this.peerConnection.localDescription, null, 2),
        );
      }
    };
  }

  private setUpConnectionStateHandling() {
    this.peerConnection.onconnectionstatechange = () => {
      console.log("Connection State:", this.peerConnection.connectionState);

      // Call custom callback
      if (this.onConnectionStateCallback) {
        this.onConnectionStateCallback(this.peerConnection.connectionState);
      }

      if (this.peerConnection.connectionState === "connected") {
        console.log("Peers are connected!");
      }
    };
  }

  private setUpDataChannels() {
    this.dataChannel = this.peerConnection.createDataChannel("file-transfer");
    console.log("Data channel created");
    this.setupDataChannelHandlers(this.dataChannel);
  }

  private setupDataChannelHandlers(channel: RTCDataChannel) {
    channel.onopen = () => {
      console.log("Data channel opened - ready to send/receive!");
    };

    channel.onclose = () => {
      console.log("Data channel closed");
    };

    channel.onerror = (e) => {
      console.log("Error in data channel:", e);
    };

    channel.onmessage = (e) => {
      console.log("Message received:", e.data);

      if (this.onDataCallBack) {
        try {
          const parsedData = JSON.parse(e.data);
          this.onDataCallBack(parsedData);
        } catch (err) {
          this.onDataCallBack(e.data);
          console.log("err", err);
        }
      }
    };
  }

  public async createAnswer(offerSdp: RTCSessionDescriptionInit) {
    try {
      await this.peerConnection.setRemoteDescription(offerSdp);
      console.log("Offer set as remote description");

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      console.log("Answer created and set as local description");

      return answer;
    } catch (err) {
      console.log("Error during createAnswer:", err);
      return null;
    }
  }

  public async setRemoteAnswer(answerSdp: RTCSessionDescriptionInit) {
    try {
      await this.peerConnection.setRemoteDescription(answerSdp);
      console.log("Answer set as remote description");
    } catch (err) {
      console.log("Error while setting remote answer:", err);
    }
  }

  public async setRemoteOffer(offer: RTCSessionDescriptionInit) {
    try {
      await this.peerConnection.setRemoteDescription(offer);
      console.log("Offer set as remote description");
    } catch (err) {
      console.log("Error while setting remote offer:", err);
    }
  }

  // Send a message through the data channel
  public sendMessage(message: string) {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(message);
      console.log("Message sent:", message);
    } else {
      console.log(
        "Data channel not open. State:",
        this.dataChannel?.readyState,
      );
    }
  }

  public getConnectionStatus() {
    return this.peerConnection.connectionState;
  }

  // Clean up
  public close() {
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    this.peerConnection.close();
    console.log("Connection closed");
  }
}

export default WebRTCPeerConnection;
