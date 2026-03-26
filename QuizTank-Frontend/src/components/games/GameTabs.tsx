import { cn } from "@/lib/utils";

interface TabItem {
    id: string;
    label: string;
}

interface GameTabsProps {
    tabs: TabItem[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

export function GameTabs({ tabs, activeTab, onTabChange }: GameTabsProps) {
    return (
        <div className="flex rounded-t-xl overflow-x-auto overflow-y-hidden bg-muted">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                        "flex-1 px-6 py-4 text-sm font-medium transition-colors",
                        activeTab === tab.id
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
