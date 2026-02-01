"use client";

import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { nanoid } from "nanoid";

export interface SocketContextType {
  socket: Socket | null;
  userId: string;
  socketId: string | null;
  setSocketId: Dispatch<SetStateAction<string | null>>;
  peerState: string;
  setPeerState: Dispatch<SetStateAction<string>>;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return ctx;
};

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [peerState, setPeerState] = useState<string>("");

  const userId = useMemo(() => nanoid(10), []);
  const HandleSetSocketState = useEffectEvent((sock: Socket) => {
    setSocket(sock);
  });

  useEffect(() => {
    const sock = io(process.env.SOCKET_ENDPOINT, {
      autoConnect: true,
    });

    // setSocket(sock);
    HandleSetSocketState(sock);

    // Connection
    sock.on("connect", () => {
      setSocketId(sock.id ?? null);
    });

    //Disconnection
    sock.on("disconnect", () => {
      setSocketId(null);
    });

    return () => {
      sock.disconnect();
      setSocket(null);
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        userId,
        socketId,
        setSocketId,
        peerState,
        setPeerState,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
