import CTA from "./landing/CTA";
import Features from "./landing/Features";
import Footer from "./landing/Footer";

import Hero from "./landing/Hero";

const Home = () => {
  return (
    <div className="min-h-screen bg-void text-white selection:bg-neon-green selection:text-black font-sans relative overflow-hidden">
      <div className="fixed inset-0 z-0 bg-grid-pattern bg-[size:50px_50px] opacity-[0.05] pointer-events-none" />

      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-neon-purple/10 blur-[120px] rounded-full z-0 pointer-events-none mix-blend-screen animate-pulse-slow" />

      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-neon-green/5 blur-[120px] rounded-full z-0 pointer-events-none mix-blend-screen" />
      <Hero />
      <Features />
      <CTA />
      <Footer />
    </div>
  );
};

export default Home;

//FIX:: All Todos needs to be done today

//TODO :
//9) Password based Encryption configuration
//7) Breaking on Small UI
//5) Overall CSS Issue
//6) Deployment of Signalling Server with containeraization
//Remove all the any and setSynchronous error handle
