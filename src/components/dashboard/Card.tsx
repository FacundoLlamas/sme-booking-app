/**
 * Dashboard Card Component
 * Placeholder for dashboard UI card
 */

export function Card({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
      {...props}
    >
      {children}
    </div>
  );
}
