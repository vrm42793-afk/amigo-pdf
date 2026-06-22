'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // We could log this to Sentry or similar error tracking service here
    console.error('App Error caught:', error);
  }, [error]);

  return (
    <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
      <div className="rounded-full bg-zinc-100 p-3 mb-6 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <svg
          className="h-8 w-8 text-zinc-600 dark:text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8 max-w-sm leading-relaxed">
        An unexpected error occurred while loading this page. Our engineers have been notified.
      </p>
      <div className="flex gap-4">
        <Button
          onClick={() => window.history.back()}
          variant="outline"
          className="px-6 border-zinc-200 dark:border-zinc-800"
        >
          Go Back
        </Button>
        <Button
          onClick={() => reset()}
          className="px-6 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
