'use client';

export default function FeaturesSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <div className="inline-flex items-center space-x-2 text-pink-600 mb-6">
            <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
            <span className="text-sm font-medium">Highlights</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            The complete platform for AI support agents
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl">
            Chatbase is designed for building AI support agents that solve your customers' hardest problems while improving business outcomes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="relative mb-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow max-w-sm mx-auto">
                <img 
                  src="/purpose-built-for-llms.webp" 
                  alt="Purpose-built for LLMs interface"
                  className="w-full h-auto rounded-xl"
                />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Purpose-built for LLMs</h3>
            <p className="text-gray-600">
              Language models with reasoning capabilities for effective responses to complex queries.
            </p>
          </div>

          <div className="text-center">
            <div className="relative mb-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow max-w-sm mx-auto">
                <img 
                  src="/designed-for-simplicity.webp" 
                  alt="Designed for simplicity interface"
                  className="w-full h-auto rounded-xl"
                />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Designed for simplicity</h3>
            <p className="text-gray-600">
              Create, manage, and deploy AI Agents easily, even without technical skills.
            </p>
          </div>

          <div className="text-center">
            <div className="relative mb-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow max-w-sm mx-auto">
                <img 
                  src="/engineered-for-security.webp" 
                  alt="Engineered for security interface"
                  className="w-full h-auto rounded-xl"
                />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Engineered for security</h3>
            <p className="text-gray-600">
              Enjoy peace of mind with robust encryption and strict compliance standards.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}