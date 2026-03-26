export interface Game {
    id: string;
    title: string;
    thumbnail: string;
    visibility: 'public' | 'private';
    subject: string;
    difficulty: 'easy' | 'medium' | 'hard';
    status: 'published' | 'draft';
    createdAt: string;
    players: number;
    questions: number;
    knowledges: number;
    xp: number;
    rating?: number;
    ratingCount?: number;
    description?: string;
}

export interface GameStats {
    totalGames: number;
    published: number;
    totalPlayers: number;
    avgRating: number;
}

export type QuestionType = 'single' | 'multiple' | 'fill';

export interface Question {
    id: string;
    type: QuestionType;
    question: string;
    title?: string; // Alias for question (for compatibility)
    media?: string;
    choices: Choice[];
    fillAnswers?: string[];
}

export interface Choice {
    id: string;
    text: string;
    isCorrect: boolean;
}

export interface Knowledge {
    id: string;
    title?: string;
    content: string;
    media?: string;
    mediaUrl?: string;
}

export interface GameplaySettings {
    duration: number;
    enemies: number;
    hearts: number;
    brains: number;
    initialAmmo: number;
    ammoPerCorrect: number;
    mapName: string;
    mapImage?: string;
}

export interface GameDetails {
    id: string;
    name: string;
    visibility: 'public' | 'private';
    category: string;
    language: string;
    tags: string[];
    description: string;
    coverImage?: string;
    questions: Question[];
    knowledges: Knowledge[];
    gameplay: GameplaySettings;
    stats: {
        players: number;
        favorites: number;
        reviews: number;
        rating: number;
        winRate: number;
    };
}
