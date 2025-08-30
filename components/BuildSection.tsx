"use client";

import { Code, Palette, TrendingUp } from "lucide-react";

export default function BuildSectionNew() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <div className="inline-flex items-center space-x-2 text-pink-600 mb-6">
            <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
            <span className="text-sm font-medium">Features</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Build the perfect customer-facing AI agent
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl">
            Chatbase gives you all the tools you need to train your perfect AI
            agent and connect it to your systems.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl p-8 border border-gray-200">
            <img
              src="/build_1.webp"
              alt="Sync with real-time data"
              className="w-full h-auto rounded-lg mb-6"
            />
            <h3 className="text-lg font-bold text-gray-900 mb-3">Sync with real-time data</h3>
            <p className="text-gray-600 text-sm">
              Connect your agent to systems like order management tools, CRMs, and more to seamlessly access data ranging from order details to active subscriptions and beyond.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-gray-200">
            <img
              src="/build_2.webp"
              alt="Take actions on your systems"
              className="w-full h-auto rounded-lg mb-6"
            />
            <h3 className="text-lg font-bold text-gray-900 mb-3">Take actions on your systems</h3>
            <p className="text-gray-600 text-sm">
              Configure actions that your agent can perform within your systems or through one of our integrations, like updating a customer's subscription or changing their address.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 border border-gray-200">
            <img
              src="/build_3.webp"
              alt="Compare AI models"
              className="w-full h-auto rounded-lg mb-6"
            />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Compare AI models</h3>
            <p className="text-gray-600 text-xs">
              Experiment with various models and configurations to make sure you have the best setup for your use case.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-gray-200">
            <img
              src="/build_4.webp"
              alt="Smart escalation"
              className="w-full h-auto rounded-lg mb-6"
            />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Smart escalation</h3>
            <p className="text-gray-600 text-xs">
              Give your agent instructions in natural language on when to escalate queries to a human agents.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-gray-200">
            <img
              src="/build_5.webp"
              alt="Advanced reporting"
              className="w-full h-auto rounded-lg mb-6"
            />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Advanced reporting</h3>
            <p className="text-gray-600 text-xs">
              Gain insights and optimize agent performance with detailed analytics.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Works with your tools
          </h2>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl">
            Integrate diverse data sources to enrich your agent's knowledge and
            capabilities.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Code className="w-6 h-6 text-gray-600" />
              <h3 className="text-lg font-bold text-gray-900">API</h3>
            </div>
            <p className="text-gray-600 text-sm">
              APIs, client libraries, and components to deploy integrate support
              into your product.
            </p>
          </div>

          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Palette className="w-6 h-6 text-gray-600" />
              <h3 className="text-lg font-bold text-gray-900">Whitelabel</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Remove any Chatbase branding from the chat widget.
            </p>
          </div>

          <div>
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-gray-600" />
              <h3 className="text-lg font-bold text-gray-900">
                Always improving
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              Syncs with your systems and learns from previous interactions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
