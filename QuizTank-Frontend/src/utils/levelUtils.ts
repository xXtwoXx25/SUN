/**
 * Total XP required to REACH a level (cumulative)
 * Uses arithmetic series sum.
 */
export const getLevelBaseXp = (level: number): number => {
    if (level <= 1) return 0;

    const a = 1000; // base XP for level 2
    const d = 200;  // increment per level
    const n = level - 1;

    return (n / 2) * (2 * a + (n - 1) * d);
};

/**
 * Calculates level from total accumulated XP.
 * We loop until XP is less than next level requirement.
 */
export const calculateLevel = (xp: number): number => {
    if (xp < 1000) return 1;

    let level = 1;
    while (xp >= getLevelBaseXp(level + 1)) {
        level++;
    }

    return level;
};

/**
 * Calculates progress details for the current level
 */
export const calculateLevelProgress = (xp: number) => {
    const currentLevel = calculateLevel(xp);
    const nextLevel = currentLevel + 1;

    const currentLevelBaseXp = getLevelBaseXp(currentLevel);
    const nextLevelBaseXp = getLevelBaseXp(nextLevel);

    const xpNeededForNextLevel = nextLevelBaseXp - currentLevelBaseXp;
    const currentLevelXp = xp - currentLevelBaseXp;

    const progressPercent = Math.min(
        (currentLevelXp / xpNeededForNextLevel) * 100,
        100
    );

    return {
        level: currentLevel,
        progressPercent: parseFloat(progressPercent.toFixed(1)),
        currentLevelXp,
        xpForNextLevel: xpNeededForNextLevel,
        totalXp: xp
    };
};