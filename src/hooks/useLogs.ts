import { useState } from "react";

const useLogs = () => {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 10),
    ]);
  };
  const clearLogs = () => {
    setLogs([]);
  };
  return { logs, addLog, setLogs, clearLogs };
};
export default useLogs;
