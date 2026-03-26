export type Difficulty = 'easy' | 'medium' | 'hard';

export type Category = string;

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  questionCount: number;
  duration?: number; // in minutes
  xpReward: number;
  rating: number;
  playCount?: number;
  imageUrl?: string;
  image?: string;
  isAiGenerated?: boolean;
  createdAt?: Date;
}

export interface CategoryInfo {
  id: Category;
  name: string;
  icon: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  xp: number;
  level: number;
  avatarUrl?: string;
}

export interface GameSession {
  id: string;
  pin: string;
  quizId: string;
  hostId: string;
  participants: string[];
  status: 'waiting' | 'playing' | 'finished';
}
