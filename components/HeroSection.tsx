"use client";

import { Button } from "@/components/ui/button";
import { Bot, CreditCard } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-left">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              AI agents for magical customer experiences
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl">
              Chatbase is the complete platform for building & deploying AI
              support agents for your business.
            </p>
            <div className="mt-8 flex items-center space-x-4">
              <button 
                className="bg-black text-white px-8 py-3 text-lg rounded-lg font-medium relative overflow-hidden border-0 border-b-4 border-gradient-to-r from-orange-500 via-pink-500 to-purple-600"
                style={{
                  background: 'linear-gradient(black, black) padding-box, linear-gradient(90deg, #f97316, #ec4899, #9333ea) border-box',
                  border: '5px solid transparent',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  transition: 'all 0.1s ease-in-out'
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.transform = 'translateY(-1.5px)';
                  target.style.backgroundColor = '#374151';
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.transform = 'translateY(0px)';
                  target.style.backgroundColor = 'black';
                }}
              >
                Build your agent
              </button>
              <div className="flex items-center text-gray-600">
                <CreditCard className="w-4 h-4 mr-2" />
                <span className="text-sm">No credit card required</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl max-w-lg mx-auto">
              <video 
                autoPlay 
                muted 
                loop 
                playsInline
                suppressHydrationWarning
                className="w-full h-auto object-cover"
              >
                <source src="/hero.webm" type="video/webm" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-8">
            Trusted by 9000+ business worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-2xl font-bold">SIEMENS</div>
            <div className="text-2xl font-bold">POSTMAN</div>
            <div className="text-2xl font-bold">PwC</div>
            <div className="text-2xl font-bold">alpian</div>
            <div className="text-2xl font-bold">Opal</div>
            <div className="text-2xl font-bold">alBaraka</div>
          </div>
        </div>
      </div>
    </section>
  );
}
