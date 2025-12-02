const CTA = () => {
  return (
    <div className="h-64 flex flex-col items-center justify-center border-y border-white/5 bg-void-lighter relative overflow-hidden group cursor-pointer">
      <div className="absolute inset-0 bg-neon-green/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>

      <span className="text-neon-green font-mono text-xs tracking-[0.5em] mb-4 opacity-70">
        SYSTEM_READY
      </span>
      <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white uppercase group-hover:scale-105 transition-transform duration-700 text-center">
        Initialize Handshake
      </h2>
      <div className="mt-8 flex gap-2">
        <div className="size-3 bg-white rounded-full animate-bounce delay-75"></div>
        <div className="size-3 bg-white rounded-full animate-bounce delay-150"></div>
        <div className="size-3 bg-white rounded-full animate-bounce delay-300"></div>
      </div>
    </div>
  );
};

export default CTA;
