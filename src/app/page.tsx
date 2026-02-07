import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            Evios HQ
          </span>
          <div className="flex gap-4">
            <Link
              href="/bookings/new"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Book Now
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Book Expert Services
          <br />
          <span className="text-blue-600 dark:text-blue-400">In Minutes</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
          AI-powered appointment scheduling for plumbing, electrical, HVAC,
          landscaping, and general maintenance services.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/bookings/new"
            className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            Book a Service
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg shadow border border-gray-200 dark:border-gray-600 transition-all"
          >
            View Dashboard
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <FeatureCard
            title="AI Chat Assistant"
            description="Describe what you need in plain language and our AI will help classify your service request and find the right expert."
          />
          <FeatureCard
            title="Smart Scheduling"
            description="Real-time availability checking with automatic conflict detection and timezone-aware booking."
          />
          <FeatureCard
            title="Instant Confirmations"
            description="Get email and SMS confirmations with calendar invites immediately after booking."
          />
        </div>
      </section>

      {/* Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
          Available Services
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <ServiceBadge name="Plumbing" />
          <ServiceBadge name="Electrical" />
          <ServiceBadge name="HVAC" />
          <ServiceBadge name="Landscaping" />
          <ServiceBadge name="Maintenance" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Evios HQ &mdash; AI-powered service scheduling
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function ServiceBadge({ name }: { name: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100 dark:border-gray-700 p-4 text-center hover:border-blue-300 dark:hover:border-blue-500 transition-colors">
      <span className="font-medium text-gray-800 dark:text-gray-200">{name}</span>
    </div>
  );
}
