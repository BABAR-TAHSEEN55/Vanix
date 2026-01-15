import { AlertOctagon, ShieldCheck } from "lucide-react";
import React from "react";

export default function CustomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <main>{children}</main>

      <div className="max-w-5xl mx-auto mt-8 md:mt-10 px-6 relative z-10">
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-[#DFFF00]/5 border border-[#DFFF00]/20 p-4 flex gap-4 items-start">
            <AlertOctagon className="text-acid-yellow shrink-0" size={18} />
            <div>
              <p className="text-[10px] font-black uppercase text-acid-yellow mb-1">
                Zero Recovery Protocol
              </p>
              <p className="text-[9px] text-neutral-400 font-sans leading-tight">
                Keys are not stored on-chain. If you lose the recovery key, the
                payload is permanently entombed in the mesh network.
              </p>
            </div>
          </div>
          <div className="bg-neon-cyan/5 border border-neon-cyan/20 p-4 flex gap-4 items-start">
            <ShieldCheck className="text-neon-cyan shrink-0" size={18} />
            <div>
              <p className="text-[10px] font-black uppercase text-neon-cyan mb-1">
                Peer-To-Peer Integrity
              </p>
              <p className="text-[9px] text-neutral-400 font-sans leading-tight">
                All transmissions utilize end-to-end WebRTC tunnels. Servers
                only facilitate initial handshake via DHT nodes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
