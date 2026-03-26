import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon, Inbox, Search, Heart, Gamepad2, Plus } from 'lucide-react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: LucideIcon;
    };
    children?: ReactNode;
}

/**
 * Reusable empty state component for lists, search results, etc.
 */
export function EmptyState({
    icon: Icon = Inbox,
    title,
    description,
    action,
    children,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="mb-4 p-4 rounded-full bg-muted">
                <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-2">
                {title}
            </h3>

            {description && (
                <p className="text-muted-foreground max-w-sm mb-6">
                    {description}
                </p>
            )}

            {action && (
                <Button onClick={action.onClick} className="gap-2">
                    {action.icon && <action.icon className="h-4 w-4" aria-hidden="true" />}
                    {action.label}
                </Button>
            )}

            {children}
        </div>
    );
}

// Pre-configured variants for common use cases

export function NoSearchResults({ onClear }: { onClear?: () => void }) {
    return (
        <EmptyState
            icon={Search}
            title="No results found"
            description="Try adjusting your search or filter to find what you're looking for."
            action={onClear ? { label: 'Clear filters', onClick: onClear } : undefined}
        />
    );
}

export function NoGames({ onCreate }: { onCreate?: () => void }) {
    return (
        <EmptyState
            icon={Gamepad2}
            title="No games yet"
            description="Create your first game and start challenging your friends!"
            action={onCreate ? { label: 'Create Game', onClick: onCreate, icon: Plus } : undefined}
        />
    );
}

export function NoFavorites({ onExplore }: { onExplore?: () => void }) {
    return (
        <EmptyState
            icon={Heart}
            title="No favorites yet"
            description="Start exploring games and save your favorites to access them quickly."
            action={onExplore ? { label: 'Explore Games', onClick: onExplore } : undefined}
        />
    );
}

export default EmptyState;
