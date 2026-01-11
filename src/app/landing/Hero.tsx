"use client";

import { ArrowRight, FileLock2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import AnimatedCounter from "../common/AnimatedCounter";

const Hero = () => {
  const scrollToComposer = () => {
    document.getElementById("composer")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center pt-10 md:pt-1 overflow-hidden "
    >
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-900/40 via-void to-void z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-green/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none animate-pulse-slow" />

      {/* Matrix-like vertical lines */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(0deg, transparent 24%, rgba(0, 255, 65, .3) 25%, rgba(0, 255, 65, .3) 26%, transparent 27%, transparent 74%, rgba(0, 255, 65, .3) 75%, rgba(0, 255, 65, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 255, 65, .3) 25%, rgba(0, 255, 65, .3) 26%, transparent 27%, transparent 74%, rgba(0, 255, 65, .3) 75%, rgba(0, 255, 65, .3) 76%, transparent 77%, transparent)",
          backgroundSize: "50px 50px",
        }}
      ></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full mt-">
        <div className="flex flex-col items-start md:items-center text-left md:text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-neon-green/5 border border-neon-green/20 backdrop-blur-md mb-8 animate-float mx-auto md:mb-8">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            <span className="text-xs font-mono text-neon-green tracking-wider uppercase">
              End-to-End Encrypted Tunnel
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 leading-[0.9] mx-auto md:m-0 ">
            <span className="block text-white">SILENCE IS</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-emerald-400 to-neon-cyan text-glow-green">
              CURRENCY
            </span>
          </h1>

          {/* Subtext */}
          <p className="max-w-3xl text-lg md:text-xl text-neutral-400 mb-10 leading-relaxed font-light  text-center flex flex-col md:py-2">
            <span>
              <span className="text-neon-purple font-mono">&gt;</span>{" "}
              Peer-to-peer document sharing and ephemeral messaging.
            </span>
            <span>
              {/*<br className="hidden md:block" />*/}
              <span className="text-neon-purple font-mono">&gt;</span> Zero
              logs. Zero knowledge. Absolute deniability.
            </span>
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Button
              onClick={scrollToComposer}
              variant="custom"
              size="lg"
              className="w-full sm:w-auto group"
              // asChild
            >
              <ArrowRight size={18} />
              <Link href={"/composer"}>Start Encrypted Session</Link>
            </Button>
            <Link
              href={"http://localhost:3000/sharing/sender"}
              className="w-full"
            >
              <Button
                variant="custom"
                size="lg"
                className="w-full sm:w-auto tracking-wider"
              >
                <FileLock2 size={18} />
                {/*View Source Code*/}
                Transfer File
              </Button>
            </Link>
          </div>

          {/* Terminal/Stats Area */}
          <div className="mt-24 w-full border border-white/10 bg-black/80 backdrop-blur-sm rounded-lg overflow-hidden max-w-4xl mx-auto shadow-2xl shadow-neon-green/5">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              <div className="ml-4 text-[10px] font-mono text-white/40">
                status_monitor.sh
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                {
                  label: "RELAYS ONLINE",
                  value: 4096,
                  color: "text-neon-green",
                },
                {
                  label: "MESSAGES BURNED",
                  value: 8000,
                  color: "text-neon-purple",
                },
                {
                  label: "DATA SHARDED",
                  value: "12.5 PB",
                  color: "text-neon-cyan",
                },
                { label: "ENCRYPTION", value: "AES-256", color: "text-white" },
              ].map((stat, idx) => (
                <div key={idx} className="flex flex-col items-start font-mono">
                  <span className="text-xs text-neutral-500 mb-1 uppercase tracking-widest flex items-center gap-2">
                    {idx === 0 && (
                      <span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse" />
                    )}
                    {stat.label}
                  </span>
                  <span
                    className={`text-2xl font-bold ${stat.color} filter drop-shadow-sm`}
                  >
                    {typeof stat.value == "number" ? (
                      <AnimatedCounter from={0} to={stat.value} />
                    ) : (
                      <span>{stat.value}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
