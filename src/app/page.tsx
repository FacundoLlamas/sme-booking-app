export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full">
        <h1 className="text-4xl font-bold mb-8 text-center">
          🗓️ SME Booking App
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Welcome</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            AI-powered appointment scheduling system for small and medium enterprises.
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Status: <span className="text-green-600 font-semibold">Local Development Mode</span>
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <APICard 
            title="Health Check"
            endpoint="/api/health"
            description="System health status"
          />
          <APICard 
            title="Ping"
            endpoint="/api/ping"
            description="Test API connectivity"
          />
          <APICard 
            title="Documentation"
            endpoint="/api/docs"
            description="API documentation (coming soon)"
          />
        </div>

        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <h3 className="text-xl font-semibold mb-3">🚀 Getting Started</h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>✅ Next.js 14 with TypeScript</li>
            <li>✅ Structured logging with Pino</li>
            <li>✅ Request validation with Zod</li>
            <li>✅ Error handling & standardized responses</li>
            <li>✅ Rate limiting & CORS middleware</li>
            <li>🔄 Local development (no auth required)</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

function APICard({ title, endpoint, description }: { 
  title: string; 
  endpoint: string; 
  description: string;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded block mb-2">
        GET {endpoint}
      </code>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}
