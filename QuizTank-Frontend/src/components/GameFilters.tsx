import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { optionService } from "@/services/optionService";
import { Search as SearchIcon, Filter, X } from "lucide-react";

interface GameFiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    category?: string;
    onCategoryChange?: (value: string) => void;
    difficulty?: string;
    onDifficultyChange?: (value: string) => void;
    showFilters: boolean;
    onToggleFilters: () => void;
    showCategoryFilter?: boolean;
    showDifficultyFilter?: boolean;
    showSortFilter?: boolean;
    sortBy?: string;
    onSortChange?: (value: string) => void;
}

export const GameFilters = ({
    searchQuery,
    onSearchChange,
    category = "all",
    onCategoryChange,
    difficulty = "all",
    onDifficultyChange,
    showFilters,
    onToggleFilters,
    showCategoryFilter = true,
    showDifficultyFilter = true,
    showSortFilter = true,
    sortBy = "popularity",
    onSortChange,
}: GameFiltersProps) => {
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const options = await optionService.getOptions();
                const cats = options.find((o: any) => o.key === 'categories')?.value || [];
                setCategories(cats);
            } catch (error) {
                console.error("Failed to fetch categories", error);
            }
        };
        fetchCategories();
    }, []);

    return (
        <>
            <Card className="p-6 mb-8 shadow-lg animate-fade-in">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by title, category, or tag..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10 h-12 text-lg"
                        />
                    </div>
                    <Button
                        variant="outline"
                        onClick={onToggleFilters}
                        className="h-12 px-6"
                    >
                        <Filter className="w-5 h-5 mr-2" />
                        {showFilters ? "Hide Filters" : "Show Filters"}
                    </Button>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border animate-fade-in">
                        {showCategoryFilter && (
                            <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
                                <Select value={category} onValueChange={onCategoryChange}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat} value={cat}>
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {showDifficultyFilter && (
                            <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">Difficulty</label>
                                <Select value={difficulty} onValueChange={onDifficultyChange}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Levels</SelectItem>
                                        <SelectItem value="Very Easy">Very Easy</SelectItem>
                                        <SelectItem value="Easy">Easy</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="Hard">Hard</SelectItem>
                                        <SelectItem value="Very Hard">Very Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {showSortFilter && (
                            <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">Sort By</label>
                                <Select value={sortBy} onValueChange={onSortChange}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="popularity">Most Popular</SelectItem>
                                        <SelectItem value="rating">Highest Rated</SelectItem>
                                        <SelectItem value="newest">Newest First</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </>
    );
};
