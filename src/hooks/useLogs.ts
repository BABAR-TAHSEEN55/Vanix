import { useState } from "react";

const useLogs = () => {
  const [addLog, setLogs] = useState<string[]>([]);

  const AddLog = (msg: string) => {
    setLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 10),
    ]);
  };
  return { addLog, setLogs };
};
