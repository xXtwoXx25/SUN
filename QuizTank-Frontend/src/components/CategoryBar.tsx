import { useState, useRef, useEffect } from 'react';
import { Category } from '@/types/quiz';
import {
  LayoutGrid,
  BookMarked
} from 'lucide-react';

interface CategoryBarProps {
  selectedCategory?: Category;
  onSelectCategory?: (category: Category | undefined) => void;
  categories?: string[];
}

const iconMap: Record<string, any> = {
  "Test": BookMarked
};

const CategoryBar = ({ selectedCategory, onSelectCategory, categories = [] }: CategoryBarProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftGradient(scrollLeft > 0);
      setShowRightGradient(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categories]);

  return (
    <section className="py-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
      <div className="container px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3">
            <LayoutGrid className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            Explore Categories
          </h2>
        </div>

        <div className="relative">
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex gap-4 overflow-x-auto py-4 scrollbar-hide scroll-smooth -mx-6 px-6 md:mx-0 md:px-0"
          >
            {categories.map((category) => {
              const Icon = BookMarked;
              const isSelected = selectedCategory === category;

              return (
                <button
                  key={category}
                  onClick={() => onSelectCategory?.(category as Category)}
                  className={`
                    group flex flex-col shrink-0 items-center justify-center gap-3 min-w-[100px] w-[100px] h-[100px] md:min-w-[120px] md:w-[120px] md:h-[120px] rounded-2xl transition-all duration-300 border
                    hover:-translate-y-1 hover:shadow-lg
                    ${isSelected
                      ? 'bg-primary border-primary shadow-md scale-105 z-10'
                      : 'bg-card border-border/50 hover:border-primary/30 hover:bg-muted/50'
                    }
                  `}
                >
                  <div className={`
                    p-2.5 md:p-3 rounded-xl transition-all duration-300
                    ${isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                    }
                  `}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <span className={`
                    text-xs md:text-sm font-bold text-center px-1 line-clamp-2
                    ${isSelected ? 'text-primary-foreground text-white' : 'text-muted-foreground group-hover:text-foreground'}
                  `}>
                    {category}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Visual gradients for scroll indication - mobile only */}
          {showLeftGradient && (
            <div
              className={`absolute -left-6 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none md:hidden transition-opacity duration-300 z-20`}
            />
          )}
          {showRightGradient && (
            <div
              className={`absolute -right-6 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden transition-opacity duration-300 z-20`}
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default CategoryBar;
