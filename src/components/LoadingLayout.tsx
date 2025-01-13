import { Skeleton } from "@/components/ui/skeleton";

export function LoadingLayout() {
  return (
    <div className="min-h-screen p-4 space-y-4">
      <Skeleton className="h-8 w-[200px]" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
}