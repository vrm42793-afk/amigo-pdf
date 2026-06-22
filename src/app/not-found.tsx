import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="rounded-full bg-zinc-100 p-4 mb-8 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <svg
          className="h-12 w-12 text-zinc-400 dark:text-zinc-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
        Page Not Found
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 max-w-md leading-relaxed">
        The page or document you are looking for doesn&apos;t exist, has been moved, or you don&apos;t have permission to access it.
      </p>
      <div className="flex gap-4">
        <Link href="/dashboard">
          <Button className="px-8 py-6 text-base bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
