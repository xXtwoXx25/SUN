import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Sparkles, Loader2, Info, ArrowLeft } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SectionHeader, FormField } from "@/components/games/FormComponents";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { gameRoomService } from "@/services/gameRoomService";
import { optionService } from "@/services/optionService";

export default function EditGameAI() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { initialPrompt } = location.state || {};
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState("");
    const [aiPrompt, setAiPrompt] = useState("");
    const [categories, setCategories] = useState<string[]>([]);
    const [languages, setLanguages] = useState<string[]>([]);
    const [gameName, setGameName] = useState("");

    useEffect(() => {
        if (initialPrompt) {
            setAiPrompt(initialPrompt);
        }
    }, [initialPrompt]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch options
                const options = await optionService.getOptions();
                const cats = options.find((o: any) => o.key === 'categories')?.value || [];
                const langs = options.find((o: any) => o.key === 'languages')?.value || [];
                setCategories(cats);
                setLanguages(langs);

                // Fetch game name
                if (id) {
                    const game = await gameRoomService.getGame(id);

                    // Check ownership
                    if (user?.id && (game as any).user_id && String(user.id) !== String((game as any).user_id)) {
                        navigate('/404');
                        return;
                    }

                    // Check if published (status === 1) or removed (status === 3)
                    if (Number(game.status) === 1 || Number(game.status) === 3) {
                        navigate('/404');
                        return;
                    }

                    setGameName(game.name || "Game");
                }
            } catch (error: any) {
                console.error("Failed to fetch data", error);
                if (error.response?.status === 404) {
                    navigate('/404');
                } else {
                    toast.error("Failed to load game data");
                    navigate(`/games/edit/${id}`);
                }
            }
        };

        if (id) {
            fetchData();
        }
    }, [id, navigate]);

    const handleGenerate = async () => {
        setAiError("");
        if (!aiPrompt.trim()) {
            setAiError("Please enter an AI prompt");
            return;
        }

        setIsGenerating(true);
        try {
            const response = await gameRoomService.generateEditWithAI(Number(id), aiPrompt, categories, languages);

            if (response.success && response.generatedData) {
                toast.success("Game generated successfully!");
                navigate(`/games/edit-ai/${id}/result`, {
                    state: {
                        generatedData: response.generatedData,
                        originalPrompt: aiPrompt
                    }
                });
            } else {
                setAiError(response.message || response.error || "Failed to generate game content");
            }
        } catch (error: any) {
            console.error("AI Generation Error:", error);
            const msg = error.response?.data?.message || error.response?.data?.error || "Failed to generate game with AI";
            setAiError(msg);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <PageLayout title={`Edit Game`}>

            <div className="rounded-xl bg-card shadow-md overflow-hidden">
                <SectionHeader title="AI Edit Mode" />

                <div className="p-6">
                    {aiError && (
                        <div className="flex items-center gap-3 text-sm text-yellow-700 bg-yellow-50 p-4 rounded-xl border border-yellow-200 mb-6">
                            <Info className="w-5 h-5" />
                            <span className="font-semibold">{aiError}</span>
                        </div>
                    )}

                    <div className="text-sm text-muted-foreground mb-4 line-clamp-1 break-all">Game: {gameName}</div>

                    <FormField label="AI Prompt">
                        <Textarea
                            value={aiPrompt}
                            onChange={(e) => {
                                setAiPrompt(e.target.value);
                                if (aiError) setAiError("");
                            }}
                            placeholder={`Describe how you want to modify this game`}
                            className="bg-muted border-0 min-h-[300px] resize-none"
                        />
                    </FormField>
                </div>
            </div>

            <div className="sticky bottom-0 bg-white py-6 px-4 mt-8">
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => navigate(`/games/edit/${id}`)} disabled={isGenerating}>
                        Cancel
                    </Button>
                    <Button onClick={handleGenerate} disabled={isGenerating}>
                        {isGenerating ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" />
                                Generate
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </PageLayout>
    );
}
