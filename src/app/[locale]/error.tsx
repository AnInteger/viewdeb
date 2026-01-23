'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h2 className="text-4xl font-bold mb-4 text-red-500">Something went wrong!</h2>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Try again
      </button>
      <p className="mt-4 text-slate-400 text-sm max-w-md">
        {error.message}
      </p>
    </div>
  );
}
