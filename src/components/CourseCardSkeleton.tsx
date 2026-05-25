import { Skeleton } from "@/components/ui/skeleton";

export function CourseCardSkeleton() {
  return (
    <article className="gold-border rounded-xl overflow-hidden flex flex-col">
      <Skeleton className="aspect-[16/10] w-full" />
      <div className="p-6 flex-1 flex flex-col gap-3">
        <div className="flex gap-2">
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-14" />
          <Skeleton className="h-3.5 w-12" />
        </div>
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between mt-auto pt-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </article>
  );
}
