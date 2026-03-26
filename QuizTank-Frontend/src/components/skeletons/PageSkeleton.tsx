import { Loader2 } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Full page loading skeleton for route transitions
 */
export function PageSkeleton() {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] w-full">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    );
}

/**
 * Card loading skeleton
 */
export function CardSkeleton() {
    return (
        <div className="bg-card rounded-xl p-6 space-y-4">
            <Skeleton className="h-40 w-full rounded-lg" />
            <div className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
            </div>
        </div>
    );
}

/**
 * Form loading skeleton
 */
export function FormSkeleton() {
    return (
        <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ))}
            <Skeleton className="h-10 w-32" />
        </div>
    );
}

/**
 * Table loading skeleton
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex gap-4 p-4 bg-muted rounded-lg">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
            </div>

            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 border-b">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                </div>
            ))}
        </div>
    );
}

export default PageSkeleton;
