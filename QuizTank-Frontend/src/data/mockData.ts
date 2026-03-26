import { Game, GameStats, GameDetails, Question, Knowledge, GameplaySettings } from "@/types/game";

export const mockStats: GameStats = {
    totalGames: 4,
    published: 3,
    totalPlayers: 479,
    avgRating: 4.8,
};

export const mockGames: Game[] = [
    {
        id: "1",
        title: "History",
        thumbnail: "/placeholder.svg",
        visibility: "public",
        subject: "Math",
        difficulty: "medium",
        status: "published",
        createdAt: "3 days ago",
        players: 245,
        questions: 5,
        knowledges: 3,
        xp: 300,
        rating: 3.7,
        ratingCount: 57,
    },
    {
        id: "2",
        title: "Computer Science",
        thumbnail: "/placeholder.svg",
        visibility: "private",
        subject: "Math",
        difficulty: "easy",
        status: "draft",
        createdAt: "3 days ago",
        players: 1,
        questions: 5,
        knowledges: 3,
        xp: 100,
    },
    {
        id: "3",
        title: "Computer Eng",
        thumbnail: "/placeholder.svg",
        visibility: "public",
        subject: "Math",
        difficulty: "hard",
        status: "published",
        createdAt: "3 days ago",
        players: 245,
        questions: 5,
        knowledges: 3,
        xp: 500,
        rating: 4.6,
        ratingCount: 22,
    },
    {
        id: "4",
        title: "Calculus I",
        thumbnail: "/placeholder.svg",
        visibility: "public",
        subject: "Math",
        difficulty: "medium",
        status: "draft",
        createdAt: "3 days ago",
        players: 245,
        questions: 5,
        knowledges: 3,
        xp: 300,
    },
];

export const discoverGames: Game[] = [
    {
        id: "d1",
        title: "Exploring Renaissance",
        thumbnail: "/placeholder.svg",
        visibility: "public",
        subject: "History",
        difficulty: "easy",
        status: "published",
        createdAt: "2 days ago",
        players: 320,
        questions: 10,
        knowledges: 5,
        xp: 50,
        rating: 4.8,
        ratingCount: 120,
        description: "Test your knowledge about the Renaissance era and inspiring events",
    },
    {
        id: "d2",
        title: "World War I",
        thumbnail: "/placeholder.svg",
        visibility: "public",
        subject: "History",
        difficulty: "medium",
        status: "published",
        createdAt: "5 days ago",
        players: 456,
        questions: 14,
        knowledges: 7,
        xp: 75,
        rating: 5.0,
        ratingCount: 89,
        description: "Timeline, causes, and major impacts of World War I",
    },
];

export const favouriteGames: Game[] = [
    {
        id: "f1",
        title: "Math Battle Arena",
        thumbnail: "/placeholder.svg",
        visibility: "public",
        subject: "Math",
        difficulty: "medium",
        status: "published",
        createdAt: "1 week ago",
        players: 567,
        questions: 9,
        knowledges: 4,
        xp: 100,
        rating: 4.6,
        ratingCount: 189,
        description: "Test your math skills in this intense battle arena",
    },
];

export const mockQuestions: Question[] = [
    {
        id: "1",
        type: "single",
        question: "Which fraction is equivalent to 2/3?",
        choices: [
            { id: "1", text: "4/6", isCorrect: true },
            { id: "2", text: "3/5", isCorrect: false },
            { id: "3", text: "6/10", isCorrect: false },
            { id: "4", text: "8/12", isCorrect: false },
        ],
    },
];

export const mockKnowledges: Knowledge[] = [
    {
        id: "1",
        content: "The area of a triangle is found by multiplying its base by its height, then dividing by two.",
        media: "/placeholder.svg",
    },
];

export const mockGameplaySettings: GameplaySettings = {
    duration: 4,
    enemies: 20,
    hearts: 5,
    brains: 5,
    initialAmmo: 3,
    ammoPerCorrect: 2,
    mapName: "Map Name",
    mapImage: "/placeholder.svg",
};

export const mockGameDetails: GameDetails = {
    id: "1",
    name: "Math Quiz",
    visibility: "public",
    category: "Mathematics",
    language: "English",
    tags: ["Fractions", "Area", "Prime Numbers"],
    description: "This Math Quiz assesses students' understanding of Fractions, Area, and Prime Numbers through three types of questions: Single Answer, Multiple Answers, and Fill-in. Learners must apply mathematical reasoning, perform calculations, and recall key concepts in number theory and geometry.",
    coverImage: "/placeholder.svg",
    questions: mockQuestions,
    knowledges: mockKnowledges,
    gameplay: mockGameplaySettings,
    stats: {
        players: 1320,
        favorites: 278,
        reviews: 4.7,
        rating: 4.7,
        winRate: 74,
    },
};
