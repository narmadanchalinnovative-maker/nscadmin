'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6 font-sans">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-400">Critical Error</h2>
          <p className="text-slate-300 text-sm">
            {error?.message || 'A critical error occurred while loading the application.'}
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-colors"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
