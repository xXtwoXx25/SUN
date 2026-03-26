import { Quiz } from '@/types/quiz';
import QuizCard from './QuizCard';
import { toast } from 'sonner';

interface QuizSectionProps {
    title: string;
    quizzes: Quiz[];
    username?: string;
    isPersonalized?: boolean;
    showBookmark?: boolean;
}

const QuizSection = ({ title, quizzes, username, isPersonalized = false, showBookmark = false }: QuizSectionProps) => {
    const handlePlay = (quiz: Quiz) => {
        toast.success(`Starting: ${quiz.title}`);
    };

    const handleBookmark = (quiz: Quiz) => {
        toast.success(`Saved: ${quiz.title}`);
    };

    const displayTitle = isPersonalized && username
        ? <>Hi <span className="text-primary">{username}</span>, recommendations for you</>
        : title;

    return (
        <section className="py-6 md:py-8">
            <div className="container px-4">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">{displayTitle}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {quizzes.map((quiz, index) => (
                        <div
                            key={quiz.id}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <QuizCard quiz={quiz} onPlay={handlePlay} showBookmark={showBookmark} onBookmark={handleBookmark} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default QuizSection;
