'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error caught:', error);
  }, [error]);

  return (
    <html lang="en" className="h-full">
      <body className="flex h-full flex-col items-center justify-center bg-zinc-50 dark:bg-black font-sans">
        <div className="flex max-w-md flex-col items-center justify-center text-center p-8 bg-white dark:bg-zinc-950 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="rounded-full bg-red-100 p-3 mb-6 dark:bg-red-900/30">
            <svg
              className="h-8 w-8 text-red-600 dark:text-red-500"
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
            Critical System Failure
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
            We encountered a critical error while trying to render the application. Our team has been notified.
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="px-6 border-zinc-200 dark:border-zinc-800"
            >
              Reload Page
            </Button>
            <Button
              onClick={() => reset()}
              className="px-6 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Try Again
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
