import { useState, useCallback } from 'react';
import { Question, Knowledge, Choice, QuestionType } from '@/types/game';

export interface MediaFile {
    id: string;
    url: string;
    type: 'image' | 'video';
    name: string;
}

export interface GameFormData {
    name: string;
    category: string;
    difficulty: string;
    description: string;
    tags: string[];
    coverImage: MediaFile | null;
    questions: Question[];
    knowledge: Knowledge[];
    timeLimit: number;
    xpReward: number;
    lives: number;
}

const MAX_ITEMS = 20;

/**
 * Creates an empty question with default values
 */
export function createEmptyQuestion(id: string): Question {
    return {
        id,
        type: 'single',
        question: '',
        choices: [
            { id: `${id}-c1`, text: '', isCorrect: false },
            { id: `${id}-c2`, text: '', isCorrect: false },
            { id: `${id}-c3`, text: '', isCorrect: false },
            { id: `${id}-c4`, text: '', isCorrect: false },
        ],
        fillAnswers: [],
    };
}

/**
 * Creates an empty knowledge item with default values
 */
export function createEmptyKnowledge(id: string): Knowledge {
    return {
        id,
        title: '',
        content: '',
    };
}

/**
 * Custom hook for managing game form state and logic
 * Used by both CreateGame and EditGame pages
 */
export function useGameForm(initialData?: Partial<GameFormData>) {
    // General info
    const [name, setName] = useState(initialData?.name || '');
    const [category, setCategory] = useState(initialData?.category || '');
    const [difficulty, setDifficulty] = useState(initialData?.difficulty || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [tags, setTags] = useState<string[]>(initialData?.tags || []);
    const [newTag, setNewTag] = useState('');
    const [coverImage, setCoverImage] = useState<MediaFile | null>(initialData?.coverImage || null);

    // Questions
    const [questions, setQuestions] = useState<Question[]>(
        initialData?.questions || [createEmptyQuestion('q1')]
    );

    // Knowledge
    const [knowledge, setKnowledge] = useState<Knowledge[]>(
        initialData?.knowledge || []
    );

    // Gameplay settings
    const [timeLimit, setTimeLimit] = useState(initialData?.timeLimit || 30);
    const [xpReward, setXpReward] = useState(initialData?.xpReward || 100);
    const [lives, setLives] = useState(initialData?.lives || 3);

    // Tag management
    const addTag = useCallback(() => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags(prev => [...prev, newTag.trim()]);
            setNewTag('');
        }
    }, [newTag, tags]);

    const removeTag = useCallback((tag: string) => {
        setTags(prev => prev.filter(t => t !== tag));
    }, []);

    // Question management
    const addQuestion = useCallback(() => {
        if (questions.length >= MAX_ITEMS) return;
        const newId = `q${Date.now()}`;
        setQuestions(prev => [...prev, createEmptyQuestion(newId)]);
    }, [questions.length]);

    const removeQuestion = useCallback((questionId: string) => {
        if (questions.length <= 1) return;
        setQuestions(prev => prev.filter(q => q.id !== questionId));
    }, [questions.length]);

    const updateQuestion = useCallback((questionId: string, updates: Partial<Question>) => {
        setQuestions(prev =>
            prev.map(q => (q.id === questionId ? { ...q, ...updates } : q))
        );
    }, []);

    const updateQuestionType = useCallback((questionId: string, type: QuestionType) => {
        setQuestions(prev =>
            prev.map(q => {
                if (q.id !== questionId) return q;

                if (type === 'fill') {
                    return { ...q, type, choices: [], fillAnswers: [''] };
                } else {
                    return {
                        ...q,
                        type,
                        choices: [
                            { id: `${q.id}-c1`, text: '', isCorrect: false },
                            { id: `${q.id}-c2`, text: '', isCorrect: false },
                            { id: `${q.id}-c3`, text: '', isCorrect: false },
                            { id: `${q.id}-c4`, text: '', isCorrect: false },
                        ],
                        fillAnswers: [],
                    };
                }
            })
        );
    }, []);

    const updateChoiceCount = useCallback((questionId: string, count: number) => {
        setQuestions(prev =>
            prev.map(q => {
                if (q.id !== questionId) return q;

                const currentChoices = q.choices || [];
                if (count > currentChoices.length) {
                    const newChoices = [...currentChoices];
                    for (let i = currentChoices.length; i < count; i++) {
                        newChoices.push({ id: `${q.id}-c${i + 1}`, text: '', isCorrect: false });
                    }
                    return { ...q, choices: newChoices };
                } else {
                    return { ...q, choices: currentChoices.slice(0, count) };
                }
            })
        );
    }, []);

    const updateChoice = useCallback((questionId: string, choiceId: string, updates: Partial<Choice>) => {
        setQuestions(prev =>
            prev.map(q => {
                if (q.id !== questionId) return q;
                return {
                    ...q,
                    choices: q.choices?.map(c => (c.id === choiceId ? { ...c, ...updates } : c)) || [],
                };
            })
        );
    }, []);

    const toggleCorrectAnswer = useCallback((questionId: string, choiceId: string) => {
        setQuestions(prev =>
            prev.map(q => {
                if (q.id !== questionId) return q;

                const isMultipleChoice = q.type === 'multiple';
                return {
                    ...q,
                    choices: q.choices?.map(c => {
                        if (c.id === choiceId) {
                            return { ...c, isCorrect: !c.isCorrect };
                        }
                        // For single-choice, unselect others
                        if (!isMultipleChoice) {
                            return { ...c, isCorrect: false };
                        }
                        return c;
                    }) || [],
                };
            })
        );
    }, []);

    const addFillAnswer = useCallback((questionId: string) => {
        setQuestions(prev =>
            prev.map(q => {
                if (q.id !== questionId) return q;
                const answers = q.fillAnswers || [];
                if (answers.length >= 10) return q;
                return { ...q, fillAnswers: [...answers, ''] };
            })
        );
    }, []);

    const removeFillAnswer = useCallback((questionId: string, index: number) => {
        setQuestions(prev =>
            prev.map(q => {
                if (q.id !== questionId) return q;
                const answers = q.fillAnswers || [];
                return { ...q, fillAnswers: answers.filter((_, i) => i !== index) };
            })
        );
    }, []);

    const updateFillAnswer = useCallback((questionId: string, index: number, value: string) => {
        setQuestions(prev =>
            prev.map(q => {
                if (q.id !== questionId) return q;
                const answers = [...(q.fillAnswers || [])];
                answers[index] = value;
                return { ...q, fillAnswers: answers };
            })
        );
    }, []);

    // Knowledge management
    const addKnowledge = useCallback(() => {
        if (knowledge.length >= MAX_ITEMS) return;
        const newId = `k${Date.now()}`;
        setKnowledge(prev => [...prev, createEmptyKnowledge(newId)]);
    }, [knowledge.length]);

    const removeKnowledge = useCallback((knowledgeId: string) => {
        setKnowledge(prev => prev.filter(k => k.id !== knowledgeId));
    }, []);

    const updateKnowledge = useCallback((knowledgeId: string, updates: Partial<Knowledge>) => {
        setKnowledge(prev =>
            prev.map(k => (k.id === knowledgeId ? { ...k, ...updates } : k))
        );
    }, []);

    // Form validation
    const validateForm = useCallback(() => {
        const errors: string[] = [];

        if (!name.trim()) errors.push('Game name is required');
        if (!category) errors.push('Category is required');
        if (!difficulty) errors.push('Difficulty is required');
        if (questions.length === 0) errors.push('At least one question is required');

        // Validate each question
        questions.forEach((q, index) => {
            if (!q.question.trim()) {
                errors.push(`Question ${index + 1} needs content`);
            }
            if (q.type !== 'fill' && !q.choices?.some(c => c.isCorrect)) {
                errors.push(`Question ${index + 1} needs at least one correct answer`);
            }
        });

        return errors;
    }, [name, category, difficulty, questions]);

    // Get form data
    const getFormData = useCallback((): GameFormData => ({
        name,
        category,
        difficulty,
        description,
        tags,
        coverImage,
        questions,
        knowledge,
        timeLimit,
        xpReward,
        lives,
    }), [name, category, difficulty, description, tags, coverImage, questions, knowledge, timeLimit, xpReward, lives]);

    // Reset form
    const resetForm = useCallback(() => {
        setName('');
        setCategory('');
        setDifficulty('');
        setDescription('');
        setTags([]);
        setNewTag('');
        setCoverImage(null);
        setQuestions([createEmptyQuestion('q1')]);
        setKnowledge([]);
        setTimeLimit(30);
        setXpReward(100);
        setLives(3);
    }, []);

    return {
        // State
        name, setName,
        category, setCategory,
        difficulty, setDifficulty,
        description, setDescription,
        tags, newTag, setNewTag,
        coverImage, setCoverImage,
        questions,
        knowledge,
        timeLimit, setTimeLimit,
        xpReward, setXpReward,
        lives, setLives,

        // Tag actions
        addTag,
        removeTag,

        // Question actions
        addQuestion,
        removeQuestion,
        updateQuestion,
        updateQuestionType,
        updateChoiceCount,
        updateChoice,
        toggleCorrectAnswer,
        addFillAnswer,
        removeFillAnswer,
        updateFillAnswer,

        // Knowledge actions
        addKnowledge,
        removeKnowledge,
        updateKnowledge,

        // Utilities
        validateForm,
        getFormData,
        resetForm,

        // Constants
        MAX_ITEMS,
    };
}

export default useGameForm;
