"use client";

import { Dispatch, SetStateAction } from "react";
import { Socket } from "socket.io-client";

type SocketContext = {
  socket: Socket;
  userId: string;
  socketId: string | null;
  setSocketId: Dispatch<SetStateAction<string | null>>;
  peerState: string;
  setPeerState: Dispatch<SetStateAction<number | string>>;
};
const useSocket = () => {};

const SocketProvider = () => {
  return <div></div>;
};

export default SocketProvider;
