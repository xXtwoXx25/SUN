import { Quiz, CategoryInfo, Category } from '@/types/quiz';

export const categories: CategoryInfo[] = [
  { id: 'math', name: 'Math', icon: '➗' },
  { id: 'science', name: 'Science', icon: '🔬' },
  { id: 'history', name: 'History', icon: '🏛️' },
  { id: 'geography', name: 'Geography', icon: '🌍' },
  { id: 'language', name: 'Language', icon: '💬' },
  { id: 'technology', name: 'Technology', icon: '💻' },
  { id: 'art', name: 'Art', icon: '🎨' },
  { id: 'general', name: 'General', icon: '📚' },
];

export const recentlyPublished: Quiz[] = [
  {
    id: '1',
    title: 'Calculus I',
    description: 'Basic calculus for beginners covering limits, derivatives, and introductory applications',
    category: 'math',
    difficulty: 'hard',
    questionCount: 20,
    xpReward: 100,
    rating: 5.0,
  },
  {
    id: '2',
    title: 'Calculus II',
    description: 'Advanced calculus with integrals, integration techniques, and infinite series',
    category: 'math',
    difficulty: 'hard',
    questionCount: 10,
    xpReward: 100,
    rating: 4.6,
  },
  {
    id: '3',
    title: 'Calculus III',
    description: 'Multivariable calculus covering vectors, fields, and multi-layered integrals',
    category: 'math',
    difficulty: 'hard',
    questionCount: 5,
    xpReward: 100,
    rating: 4.3,
  },
  {
    id: '4',
    title: 'Python Language',
    description: 'Learn Python from basics to object-oriented programming concepts',
    category: 'technology',
    difficulty: 'easy',
    questionCount: 25,
    xpReward: 50,
    rating: 4.6,
  },
];

export const trendingNow: Quiz[] = [
  {
    id: '5',
    title: 'Battle of Verbs',
    description: 'Test your verb knowledge in English with real-world examples',
    category: 'language',
    difficulty: 'easy',
    questionCount: 10,
    xpReward: 50,
    rating: 4.8,
  },
  {
    id: '6',
    title: 'World War I',
    description: 'Timeline, causes, and major impacts of World War I',
    category: 'history',
    difficulty: 'medium',
    questionCount: 14,
    xpReward: 75,
    rating: 5.0,
  },
  {
    id: '7',
    title: 'World War II',
    description: 'Key events, leaders, and major battles in World War II',
    category: 'history',
    difficulty: 'medium',
    questionCount: 20,
    xpReward: 75,
    rating: 4.2,
  },
  {
    id: '8',
    title: 'World War III',
    description: 'Analysis of possibilities and impacts of modern warfare',
    category: 'history',
    difficulty: 'medium',
    questionCount: 10,
    xpReward: 75,
    rating: 4.6,
  },
];

export const aiGenerated: Quiz[] = [
  {
    id: '9',
    title: 'Thai Culture',
    description: 'Thai wisdom, arts, music, and culture passed down through generations',
    category: 'language',
    difficulty: 'medium',
    questionCount: 50,
    xpReward: 70,
    rating: 3.8,
    isAiGenerated: true,
  },
  {
    id: '10',
    title: 'Acid and Base',
    description: 'Basic acids and bases, pH values, and fundamental chemical reactions',
    category: 'science',
    difficulty: 'hard',
    questionCount: 11,
    xpReward: 100,
    rating: 4.6,
    isAiGenerated: true,
  },
  {
    id: '11',
    title: 'Fidelity and Wireframe',
    description: 'UX/UI design fundamentals from wireframes to high-fidelity prototypes',
    category: 'technology',
    difficulty: 'hard',
    questionCount: 10,
    xpReward: 100,
    rating: 5.0,
    isAiGenerated: true,
  },
  {
    id: '12',
    title: 'Data Sci and Data En',
    description: 'Differences between Data Science and Data Engineering, essential skills for modern era',
    category: 'technology',
    difficulty: 'medium',
    questionCount: 10,
    xpReward: 75,
    rating: 4.0,
    isAiGenerated: true,
  },
];

export const mockQuizzes: Quiz[] = [
  ...recentlyPublished,
  ...trendingNow,
  ...aiGenerated,
];

export const getQuizzesByCategory = (category: Category): Quiz[] => {
  return mockQuizzes.filter(quiz => quiz.category === category);
};
