"use client";

import { useState } from "react";
import { Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProcessSectionNew() {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      number: "01",
      title: "Build & deploy your agent",
      description:
        "Train an agent on your business data, configure the actions it can take, then deploy it for your customers.",
      videoId: 1,
    },
    {
      number: "02",
      title: "Agent solves your customers' problems",
      description:
        "The agent will answer questions and access external systems to gather data and take actions.",
      videoId: 2,
    },
    {
      number: "03",
      title: "Refine & optimize",
      description: "This ensures your agent is improving over time.",
      videoId: 3,
    },
    {
      number: "04",
      title: "Route complex issues to a human",
      description:
        "Seamlessly escalate certain queries to human agents when the AI agent is unable to solve the problem or when issues require human review.",
      videoId: 4,
    },
    {
      number: "05",
      title: "Review analytics & insights",
      description:
        "Since the agent is talking with customers all day, it's able to gather important insights and analytics about your customers & business.",
      videoId: 5,
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <div className="inline-flex items-center space-x-2 text-pink-600 mb-6">
              <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
              <span className="text-sm font-medium">How it works</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              An end-to-end solution for conversational AI
            </h2>

            <div className="space-y-6">
              {steps.map((step, index) => (
                <div
                  key={index}
                  onClick={() => setActiveStep(step.videoId)}
                  className={`flex items-start space-x-4 p-4 rounded-lg border transition-all duration-300 cursor-pointer hover:shadow-md ${
                    activeStep === step.videoId
                      ? "text-gray-900 bg-white border-blue-500 shadow-sm"
                      : "text-gray-400 bg-transparent border-gray-200 hover:text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="text-lg font-bold min-w-[3rem]">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                    <div 
                      className={`overflow-hidden transition-all duration-500 ease-in-out ${
                        step.description && activeStep === step.videoId 
                          ? 'max-h-32 opacity-100 mt-2' 
                          : 'max-h-0 opacity-0 mt-0'
                      }`}
                    >
                      <p className="text-gray-600 transition-all duration-500">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <p className="text-xl mt-14 text-gray-600 mb-12">
              With Chatbase, your customers can effortlessly find answers,
              resolve issues, and take meaningful actions through seamless and
              engaging AI-driven conversations.
            </p>
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg max-w-md mx-auto">
              <video
                key={activeStep}
                autoPlay
                loop
                muted
                suppressHydrationWarning
                className="w-full h-auto"
              >
                <source src={`/process${activeStep}.webm`} type="video/webm" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
