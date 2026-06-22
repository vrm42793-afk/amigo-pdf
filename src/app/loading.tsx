import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex h-full w-full flex-col p-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-3 p-5 rounded-xl border border-border">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
      
      <div className="flex flex-col gap-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}
