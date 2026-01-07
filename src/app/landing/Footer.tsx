import { Github, Shield, Lock, Terminal } from "lucide-react";
import Link from "next/link";
import Year from "../common/Year";
const Footer = () => {
  return (
    <footer className=" border-t border-white/10 pt-20 pb-10 relative overflow-hidden">
      {/* Background Glitch Element */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Terminal className="text-neon-green w-6 h-6" />
              <h2 className="text-2xl font-mono font-bold tracking-widest text-white">
                VANIX
              </h2>
            </div>
            <p className="max-w-sm text-neutral-500 mb-8 font-light leading-relaxed">
              Open source, zero-knowledge, peer-to-peer communication protocol.
              Built for a world where privacy is a myth. We are making it
              reality again.
            </p>
            <div className="flex items-center gap-4">
              {[Github, Shield, Lock].map((Icon, i) => (
                <Link
                  key={i}
                  href="https://github.com/BABAR-TAHSEEN55/Vanix"
                  className="w-10 h-10 flex items-center justify-center border border-white/10 bg-white/5 text-neutral-400 hover:border-neon-green hover:text-neon-green transition-all hover:scale-110"
                >
                  <Icon size={18} />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-mono font-bold text-white uppercase tracking-wider mb-6 text-xs text-neon-purple">
              Resources
            </h4>
            <ul className="space-y-3">
              {["Source Code", "PGP Keys", "Tor Onion Service"].map((item) => (
                <li key={item}>
                  <Link
                    href="https://github.com/BABAR-TAHSEEN55/vanix"
                    className="text-neutral-500 hover:text-white transition-colors text-sm font-mono flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-neutral-700 group-hover:bg-neon-green rounded-full transition-colors"></span>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-mono font-bold text-white uppercase tracking-wider mb-6 text-xs text-neon-cyan">
              Network Status
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-400 border-b border-white/5 pb-2">
                <span>RELAYS</span>
                <span className="text-neon-green">ONLINE</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-neutral-400 border-b border-white/5 pb-2">
                <span>ENCRYPTION</span>
                <span className="text-white">AES-256-GCM</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-neutral-400 border-b border-white/5 pb-2">
                <span>REGISTRY</span>
                <span className="text-white">--------</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-neutral-600 font-mono uppercase tracking-widest">
            <Year />
          </p>
          <div className="flex items-center gap-6 text-[10px] text-neutral-600 font-mono">
            <a href="#" className="hover:text-neon-purple transition-colors">
              PRIVACY_POLICY.MD
            </a>
            <a href="#" className="hover:text-neon-purple transition-colors">
              DISCLAIMER.TXT
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
