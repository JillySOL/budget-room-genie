export function Debug() {
  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black/80 text-white rounded-lg text-sm font-mono">
      <div>
        <strong>Clerk Key:</strong>{' '}
        {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? (
          <span className="text-green-400">✓ Present</span>
        ) : (
          <span className="text-red-400">✗ Missing</span>
        )}
      </div>
      <div className="mt-2 text-xs opacity-50">
        {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.substring(0, 12)}...
      </div>
    </div>
  );
} 