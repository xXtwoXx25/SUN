export interface GameStats {
    questions: number;
    knowledges: number;
    enemies: number;
    duration: number;
    hearts: number;
    brains: number;
    initial_ammo: number;
    ammo_per_correct: number;
}

export type DifficultyLevel = "Very Easy" | "Easy" | "Medium" | "Hard" | "Very Hard";

export interface DifficultyResult {
    level: DifficultyLevel;
    xp: number;
    score: number;
    color: string;
}

export const getDifficultyColor = (level: string): string => {
    switch (level) {
        case "Very Easy":
            return "bg-green-500 text-white border-green-500";
        case "Easy":
            return "bg-teal-500 text-white border-teal-500";
        case "Medium":
            return "bg-blue-500 text-white border-blue-500";
        case "Hard":
            return "bg-orange-500 text-white border-orange-500";
        case "Very Hard":
            return "bg-red-500 text-white border-red-500";
        default:
            return "bg-gray-500 text-white border-gray-500";
    }
};

export const calculateDifficulty = (stats: GameStats): DifficultyResult => {

    const totalAmmo =
        stats.initial_ammo +
        (stats.ammo_per_correct * stats.questions);

    const enemies = Math.max(1, stats.enemies);
    const ammoPerEnemy = totalAmmo / enemies;

    let level: DifficultyLevel;
    let xp: number;

    if (ammoPerEnemy <= 1) {
        level = "Very Hard";
        xp = 500;
    } else if (ammoPerEnemy <= 2) {
        level = "Hard";
        xp = 300;
    } else if (ammoPerEnemy <= 3) {
        level = "Medium";
        xp = 200;
    } else if (ammoPerEnemy <= 4) {
        level = "Easy";
        xp = 100;
    } else {
        level = "Very Easy";
        xp = 50;
    }

    return {
        level,
        xp,
        score: ammoPerEnemy,
        color: getDifficultyColor(level)
    };
};
