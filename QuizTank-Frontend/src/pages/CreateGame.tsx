import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench, Sparkles, ChevronLeft, ChevronRight, Plus, Trash2, X, Check, ChevronUp, ChevronDown, Loader2, Info } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SectionHeader, FormField } from "@/components/games/FormComponents";
import { MediaUpload } from "@/components/games/MediaUpload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { gameRoomService, QUESTION_TYPES, GAME_STATUS, GAME_VISIBILITY } from "@/services/gameRoomService";
import { gameService } from "@/services/gameService";
import { mapService, MapData } from "@/services/mapService";
import { optionService } from "@/services/optionService";
import { Question, Knowledge, Choice } from "@/types/game";

type CreationMode = "select" | "user" | "ai";
type UserStep = 1 | 2 | 3 | 4;

interface MediaFile {
  id: string;
  url: string;
  type: "image" | "video";
  name: string;
}

const MAX_QUESTION_ITEMS = 20;
const MAX_KNOWLEDGE_ITEMS = 10;

const createEmptyQuestion = (id: string): Question => ({
  id,
  type: "single",
  question: "",
  choices: [
    { id: `${id}-c1`, text: "", isCorrect: false },
    { id: `${id}-c2`, text: "", isCorrect: false },
    { id: `${id}-c3`, text: "", isCorrect: false },
    { id: `${id}-c4`, text: "", isCorrect: false },
  ],
  fillAnswers: [],
});

const createEmptyKnowledge = (id: string): Knowledge => ({
  id,
  content: "",
  mediaUrl: "",
});

export default function CreateGame() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<CreationMode>("select");
  const [userStep, setUserStep] = useState<UserStep>(1);
  const [aiPrompt, setAiPrompt] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [maps, setMaps] = useState<MapData[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const options = await optionService.getOptions();
        const cats = options.find((o: any) => o.key === 'categories')?.value || [];
        const langs = options.find((o: any) => o.key === 'languages')?.value || [];
        const defaultMapId = options.find((o: any) => o.key === 'map_id')?.value;

        setCategories(cats);
        setLanguages(langs);

        if (defaultMapId) {
          setFormData(prev => ({
            ...prev,
            gameplay: {
              ...prev.gameplay,
              mapId: parseInt(defaultMapId)
            }
          }));
        }
      } catch (error) {
        console.error('Failed to fetch options:', error);
      }
    };

    const fetchMaps = async () => {
      try {
        const data = await mapService.getAllMaps();
        const activeMaps = data
          .filter(m => m.status === 1)
          .sort((a, b) => a.name.localeCompare(b.name));
        setMaps(activeMaps);
      } catch (error) {
        console.error('Failed to fetch maps:', error);
      }
    };

    fetchOptions();
    fetchMaps();
  }, []);

  // Form data state (controlled inputs like EditGame)
  const [formData, setFormData] = useState({
    name: "",
    visibility: "public" as "public" | "private" | "locked" | "unlisted",
    password: "",
    category: "",
    language: "",
    tags: [] as string[],
    description: "",
    questions: [createEmptyQuestion("q1")] as Question[],
    knowledges: [createEmptyKnowledge("k1")] as Knowledge[],
    gameplay: {
      duration: 3,
      enemies: 1,
      hearts: 5,
      brains: 5,
      initialAmmo: 1,
      ammoPerCorrect: 2,
      mapId: null,
      questionsOrder: false,
      knowledgesOrder: false
    },
  });

  const [newTag, setNewTag] = useState("");
  const [newFillAnswer, setNewFillAnswer] = useState<Record<string, string>>({});
  const [coverImage, setCoverImage] = useState<MediaFile[]>([]);
  const [questionMedia, setQuestionMedia] = useState<Record<string, MediaFile[]>>({});
  const [knowledgeMedia, setKnowledgeMedia] = useState<Record<string, MediaFile[]>>({});

  const handleMediaUpload = async (file: File) => {
    try {
      const data = await gameService.uploadMedia(file);
      if (data.success && data.url) {
        return data.url;
      }
      throw new Error("Invalid response from server");
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload media");
      throw error;
    }
  };

  const addTag = () => {
    if (formData.tags.length >= 10) {
      toast.error("Maximum 10 tags allowed");
      return;
    }
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  // Question management
  const addQuestion = () => {
    if (formData.questions.length >= MAX_QUESTION_ITEMS) return;
    const newId = `q${Date.now()}`;
    setFormData({
      ...formData,
      questions: [...formData.questions, createEmptyQuestion(newId)],
    });
  };

  const removeQuestion = (questionId: string) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter(q => q.id !== questionId),
    });
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setFormData({
      ...formData,
      questions: formData.questions.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      ),
    });
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...formData.questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newQuestions.length) return;
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateQuestionType = (questionId: string, type: Question["type"]) => {
    const question = formData.questions.find(q => q.id === questionId);
    if (!question) return;

    let choices = question.choices;
    if (type === "fill") {
      choices = [];
    } else if (choices.length === 0) {
      choices = [
        { id: `${questionId}-c1`, text: "", isCorrect: false },
        { id: `${questionId}-c2`, text: "", isCorrect: false },
        { id: `${questionId}-c3`, text: "", isCorrect: false },
        { id: `${questionId}-c4`, text: "", isCorrect: false },
      ];
    }

    updateQuestion(questionId, {
      type,
      choices,
      fillAnswers: type === "fill" ? (question.fillAnswers || []) : [],
    });
  };

  const updateChoiceCount = (questionId: string, count: number) => {
    const question = formData.questions.find(q => q.id === questionId);
    if (!question) return;

    let newChoices = [...question.choices];
    if (count > newChoices.length) {
      for (let i = newChoices.length; i < count; i++) {
        newChoices.push({ id: `${questionId}-c${i + 1}`, text: "", isCorrect: false });
      }
    } else {
      newChoices = newChoices.slice(0, count);
    }

    updateQuestion(questionId, { choices: newChoices });
  };

  const updateChoice = (questionId: string, choiceId: string, updates: Partial<Choice>) => {
    const question = formData.questions.find(q => q.id === questionId);
    if (!question) return;

    const newChoices = question.choices.map(c =>
      c.id === choiceId ? { ...c, ...updates } : c
    );
    updateQuestion(questionId, { choices: newChoices });
  };

  const toggleCorrectAnswer = (questionId: string, choiceId: string) => {
    const question = formData.questions.find(q => q.id === questionId);
    if (!question) return;

    let newChoices: Choice[];
    if (question.type === "single") {
      newChoices = question.choices.map(c => ({
        ...c,
        isCorrect: c.id === choiceId,
      }));
    } else {
      newChoices = question.choices.map(c =>
        c.id === choiceId ? { ...c, isCorrect: !c.isCorrect } : c
      );
    }
    updateQuestion(questionId, { choices: newChoices });
  };

  const addFillAnswer = (questionId: string) => {
    const answer = newFillAnswer[questionId]?.trim();
    if (!answer) return;

    const question = formData.questions.find(q => q.id === questionId);
    if (!question) return;

    const currentAnswers = question.fillAnswers || [];
    if (currentAnswers.length >= 20) return;
    if (!currentAnswers.includes(answer)) {
      updateQuestion(questionId, { fillAnswers: [...currentAnswers, answer] });
    }
    setNewFillAnswer({ ...newFillAnswer, [questionId]: "" });
  };

  const removeFillAnswer = (questionId: string, answer: string) => {
    const question = formData.questions.find(q => q.id === questionId);
    if (!question) return;

    updateQuestion(questionId, {
      fillAnswers: (question.fillAnswers || []).filter(a => a !== answer),
    });
  };

  // Knowledge management
  const addKnowledge = () => {
    if (formData.knowledges.length >= MAX_KNOWLEDGE_ITEMS) return;
    const newId = `k${Date.now()}`;
    setFormData({
      ...formData,
      knowledges: [...formData.knowledges, createEmptyKnowledge(newId)],
    });
  };

  const removeKnowledge = (knowledgeId: string) => {
    setFormData({
      ...formData,
      knowledges: formData.knowledges.filter(k => k.id !== knowledgeId),
    });
  };

  const updateKnowledge = (knowledgeId: string, updates: Partial<Knowledge>) => {
    setFormData({
      ...formData,
      knowledges: formData.knowledges.map(k =>
        k.id === knowledgeId ? { ...k, ...updates } : k
      ),
    });
  };

  const moveKnowledge = (index: number, direction: 'up' | 'down') => {
    const newKnowledges = [...formData.knowledges];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newKnowledges.length) return;
    [newKnowledges[index], newKnowledges[newIndex]] = [newKnowledges[newIndex], newKnowledges[index]];
    setFormData({ ...formData, knowledges: newKnowledges });
  };

  const stepTitles: Record<UserStep, string> = {
    1: "General",
    2: "Questions",
    3: "Knowledges",
    4: "Gameplay",
  };

  const renderModeSelection = () => (
    <div className="rounded-xl bg-card shadow-md overflow-hidden">
      <SectionHeader title="Creation Mode" />

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* User-Created Mode */}
          <button
            onClick={() => setMode("user")}
            className="text-left p-8 rounded-xl bg-primary/10 hover:bg-primary/15 transition-colors"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary mb-6">
              <Wrench className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="sm:text-xl font-bold text-foreground mb-2">User-Created Mode</h3>
            <p className="text-xs sm:text-base text-muted-foreground mb-4">
              Manually create all questions and knowledge content. Full control over every detail.
            </p>
            <Badge variant="outline" className="bg-primary text-white py-1 px-3 border-0">4 Step</Badge>
          </button>

          {/* AI-Generated Mode */}
          <button
            onClick={() => setMode("ai")}
            className="text-left p-8 rounded-xl bg-violet-50 hover:bg-violet-100 transition-colors"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500 mb-6">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h3 className="sm:text-xl font-bold text-foreground mb-2">AI-Generated Mode</h3>
            <p className="text-xs sm:text-base text-muted-foreground mb-4">
              Let AI create questions and knowledge content based on your prompt.
            </p>
            <Badge variant="outline" className="bg-violet-500 text-white py-1 px-3 border-0">1 Step</Badge>
          </button>
        </div>
      </div>
    </div>
  );

  const renderUserCreatedStep = () => (
    <div className="rounded-xl bg-card shadow-md overflow-hidden">
      <SectionHeader title={stepTitles[userStep]} stepInfo={`Step ${userStep} of 4`} />

      <div className="p-6">
        {userStep === 1 && (
          <div className="space-y-6">
            <FormField label="Name">
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter game name..."
                className="bg-muted border-0"
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Visibility">
                <Select
                  value={formData.visibility}
                  onValueChange={(value) => setFormData({ ...formData, visibility: value as 'public' | 'private' | 'locked' | 'unlisted', password: value !== 'locked' ? '' : formData.password })}
                >
                  <SelectTrigger className="bg-muted border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="locked">Locked</SelectItem>
                    <SelectItem value="unlisted">Unlisted</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {formData.visibility === "locked" && (
                <FormField label="Game Room Password">
                  <Input
                    type="text"
                    minLength={4}
                    maxLength={12}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password for this game..."
                    className="bg-muted border-0"
                  />
                </FormField>
              )}

              <FormField label="Category">
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="bg-muted border-0">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Language">
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger className="bg-muted border-0">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Tags">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      placeholder="Add a tag..."
                      className="bg-muted border-0 flex-1"
                    />
                    <Button onClick={addTag}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        <span className="max-w-[200px] truncate">{tag}</span>
                        <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Description">
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter game description..."
                  className="bg-muted border-0 h-[160px] resize-none"
                />
              </FormField>

              <FormField label="Cover Image">
                <MediaUpload
                  files={coverImage}
                  onChange={setCoverImage}
                  maxFiles={1}
                  accept="image/*"
                  placeholder="Click to upload cover image"
                  onUpload={handleMediaUpload}
                />
              </FormField>
            </div>
          </div>
        )}

        {userStep === 2 && (
          <div className="space-y-6">
            {formData.questions.map((question, index) => (
              <div key={question.id} className="space-y-4 pb-6 border-b border-border last:border-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                  <h3 className="text-lg font-semibold">Question #{index + 1}</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveQuestion(index, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveQuestion(index, 'down')}
                      disabled={index === formData.questions.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-red-50 text-red-500 hover:bg-red-100 border-red-200"
                      onClick={() => removeQuestion(question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <FormField label="Type">
                  <Select
                    value={question.type}
                    onValueChange={(value) => updateQuestionType(question.id, value as Question["type"])}
                  >
                    <SelectTrigger className="bg-muted border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Choice (Single Answer)</SelectItem>
                      <SelectItem value="multiple">Choice (Multiple Answers)</SelectItem>
                      <SelectItem value="fill">Fill-in</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Question">
                    <Textarea
                      value={question.question}
                      onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                      placeholder="Enter your question..."
                      className="bg-muted border-0 h-[120px] resize-none"
                    />
                  </FormField>

                  <FormField label="Question Media" hint="Max 10 images/videos">
                    <MediaUpload
                      files={questionMedia[question.id] || []}
                      onChange={(files) => setQuestionMedia({ ...questionMedia, [question.id]: files })}
                      maxFiles={10}
                      accept="image/*,video/*"
                      onUpload={handleMediaUpload}
                      maxSize={20}
                    />
                  </FormField>
                </div>

                {/* Choice-based question types */}
                {(question.type === "single" || question.type === "multiple") && (
                  <>
                    <FormField label="Number of Choices">
                      <Select
                        value={String(question.choices.length)}
                        onValueChange={(value) => updateChoiceCount(question.id, parseInt(value))}
                      >
                        <SelectTrigger className="bg-muted border-0 w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="6">6</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {question.choices.map((choice, choiceIndex) => (
                        <div
                          key={choice.id}
                          className={`relative rounded-xl border-2 transition-all ${choice.isCorrect
                            ? "border-primary bg-muted"
                            : "border-border bg-muted hover:border-primary/30"
                            }`}
                        >
                          {/* Header with choice number and mark as answer */}
                          <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                            <div className="flex items-center gap-2">
                              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${choice.isCorrect
                                ? "bg-primary text-primary-foreground"
                                : "bg-primary/20 text-primary"
                                }`}>
                                {choiceIndex + 1}
                              </span>
                              <span className="text-sm font-medium text-muted-foreground">
                                Choice {choiceIndex + 1}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleCorrectAnswer(question.id, choice.id)}
                              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all ${question.type === "single" ? "rounded-full" : "rounded-lg"
                                } ${choice.isCorrect
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "bg-background text-muted-foreground hover:text-primary hover:bg-primary/10 border border-border"
                                }`}
                            >
                              <span className={`flex h-4 w-4 items-center justify-center shrink-0 border-2 ${question.type === "single" ? "rounded-full" : "rounded"
                                } ${choice.isCorrect
                                  ? "border-primary-foreground bg-primary-foreground"
                                  : "border-current"
                                }`}>
                                {choice.isCorrect && <Check className="h-3 w-3 text-primary" />}
                              </span>
                              {choice.isCorrect ? "Answer" : "Answer"}
                            </button>
                          </div>
                          {/* Textarea for choice content */}
                          <div className="p-3">
                            <Textarea
                              value={choice.text}
                              onChange={(e) => updateChoice(question.id, choice.id, { text: e.target.value })}
                              placeholder={`Enter choice ${choiceIndex + 1}`}
                              className="bg-muted border-0 min-h-[80px] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 resize-none rounded-lg"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Fill-in question type */}
                {question.type === "fill" && (
                  <div className="space-y-3">
                    <FormField label="Answer">
                      <div className="flex gap-2">
                        <Input
                          value={newFillAnswer[question.id] || ""}
                          onChange={(e) => setNewFillAnswer({ ...newFillAnswer, [question.id]: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFillAnswer(question.id))}
                          placeholder="Enter accepted answer..."
                          className="bg-muted border-0 flex-1"
                        />
                        <Button onClick={() => addFillAnswer(question.id)}>Add</Button>
                      </div>
                    </FormField>

                    {(question.fillAnswers || []).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {(question.fillAnswers || []).map((answer) => (
                          <Badge key={answer} variant="secondary" className="gap-1">
                            <span className="max-w-[200px] truncate">{answer}</span>
                            <button
                              onClick={() => removeFillAnswer(question.id, answer)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {(question.fillAnswers || []).length >= 20 && (
                      <p className="text-sm text-muted-foreground">Maximum of 20 accepted answers reached</p>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div className="flex flex-col items-center gap-2 pt-4">
              <Button
                className="gap-2"
                onClick={addQuestion}
                disabled={formData.questions.length >= MAX_QUESTION_ITEMS}
              >
                <Plus className="h-4 w-4" />
                Add Question
              </Button>
              {formData.questions.length >= MAX_QUESTION_ITEMS && (
                <p className="text-sm text-muted-foreground">Maximum of {MAX_QUESTION_ITEMS} questions reached</p>
              )}
            </div>
          </div>
        )}

        {userStep === 3 && (
          <div className="space-y-6">
            {formData.knowledges.map((knowledge, index) => (
              <div key={knowledge.id} className="space-y-4 pb-6 border-b border-border last:border-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                  <h3 className="text-lg font-semibold">Knowledge #{index + 1}</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveKnowledge(index, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveKnowledge(index, 'down')}
                      disabled={index === formData.knowledges.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-red-50 text-red-500 hover:bg-red-100 border-red-200"
                      onClick={() => removeKnowledge(knowledge.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Content">
                    <Textarea
                      value={knowledge.content}
                      onChange={(e) => updateKnowledge(knowledge.id, { content: e.target.value })}
                      placeholder="Enter knowledge content..."
                      className="bg-muted border-0 h-[120px] resize-none"
                    />
                  </FormField>

                  <FormField label="Knowledge Media" hint="Max 10 images/videos">
                    <MediaUpload
                      files={knowledgeMedia[knowledge.id] || []}
                      onChange={(files) => setKnowledgeMedia({ ...knowledgeMedia, [knowledge.id]: files })}
                      maxFiles={10}
                      accept="image/*,video/*"
                      onUpload={handleMediaUpload}
                      maxSize={20}
                    />
                  </FormField>
                </div>
              </div>
            ))}

            <div className="flex flex-col items-center gap-2 pt-4">
              <Button
                className="gap-2"
                onClick={addKnowledge}
                disabled={formData.knowledges.length >= MAX_KNOWLEDGE_ITEMS}
              >
                <Plus className="h-4 w-4" />
                Add Knowledge
              </Button>
              {formData.knowledges.length >= MAX_KNOWLEDGE_ITEMS && (
                <p className="text-sm text-muted-foreground">Maximum of {MAX_KNOWLEDGE_ITEMS} knowledge items reached</p>
              )}
            </div>
          </div>
        )}

        {userStep === 4 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Duration (min)">
                <Input
                  type="number"
                  min={1}
                  value={formData.gameplay.duration}
                  onChange={(e) => setFormData({
                    ...formData,
                    gameplay: { ...formData.gameplay, duration: parseInt(e.target.value) || 1 }
                  })}
                  className="bg-muted border-0"
                />
              </FormField>

              <FormField label="Number of Enemies">
                <Input
                  type="number"
                  value={formData.gameplay.enemies}
                  onChange={(e) => setFormData({
                    ...formData,
                    gameplay: { ...formData.gameplay, enemies: parseInt(e.target.value) || 0 }
                  })}
                  className="bg-muted border-0"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Number of Hearts">
                <Input
                  type="number"
                  value={formData.gameplay.hearts}
                  onChange={(e) => setFormData({
                    ...formData,
                    gameplay: { ...formData.gameplay, hearts: parseInt(e.target.value) || 0 }
                  })}
                  className="bg-muted border-0"
                />
              </FormField>

              <FormField label="Number of Brains">
                <Input
                  type="number"
                  value={formData.gameplay.brains}
                  onChange={(e) => setFormData({
                    ...formData,
                    gameplay: { ...formData.gameplay, brains: parseInt(e.target.value) || 0 }
                  })}
                  className="bg-muted border-0"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Initial Ammo">
                <Input
                  type="number"
                  value={formData.gameplay.initialAmmo}
                  onChange={(e) => setFormData({
                    ...formData,
                    gameplay: { ...formData.gameplay, initialAmmo: parseInt(e.target.value) || 0 }
                  })}
                  className="bg-muted border-0"
                />
              </FormField>

              <FormField label="Ammo per Correct Answer">
                <Input
                  type="number"
                  value={formData.gameplay.ammoPerCorrect}
                  onChange={(e) => setFormData({
                    ...formData,
                    gameplay: { ...formData.gameplay, ammoPerCorrect: parseInt(e.target.value) || 0 }
                  })}
                  className="bg-muted border-0"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Question Order">
                <Select
                  value={formData.gameplay.questionsOrder ? "yes" : "no"}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    gameplay: { ...formData.gameplay, questionsOrder: value === "yes" }
                  })}
                >
                  <SelectTrigger className="bg-muted border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Random</SelectItem>
                    <SelectItem value="yes">Sequential</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Knowledge Order">
                <Select
                  value={formData.gameplay.knowledgesOrder ? "yes" : "no"}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    gameplay: { ...formData.gameplay, knowledgesOrder: value === "yes" }
                  })}
                >
                  <SelectTrigger className="bg-muted border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Random</SelectItem>
                    <SelectItem value="yes">Sequential</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <FormField label="Map">
              <Select
                value={formData.gameplay.mapId ? formData.gameplay.mapId.toString() : ""}
                onValueChange={(value) => setFormData({
                  ...formData,
                  gameplay: { ...formData.gameplay, mapId: parseInt(value) }
                })}
              >
                <SelectTrigger className="bg-muted border-0 w-full md:w-1/2">
                  <SelectValue placeholder="Select map" />
                </SelectTrigger>
                <SelectContent>
                  {maps.map((map) => (
                    <SelectItem key={map.map_id} value={map.map_id.toString()}>
                      {map.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {(selectedMap && selectedMap.image_url) && (
              <div className="bg-muted rounded-lg h-60 w-full md:h-80 md:w-80 p-3">
                <img
                  src={selectedMap.image_url}
                  alt={selectedMap.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderAIMode = () => (
    <div className="rounded-xl bg-card shadow-md overflow-hidden">
      <SectionHeader title="AI-Generated Mode" />

      <div className="p-6">
        {aiError && (
          <div className="flex items-center gap-3 text-sm text-yellow-700 bg-yellow-50 p-4 rounded-xl border border-yellow-200 mb-6">
            <Info className="w-5 h-5" />
            <span className="font-semibold">{aiError}</span>
          </div>
        )}
        <FormField label="AI Prompt" hint="for generate game details">
          <Textarea
            value={aiPrompt}
            onChange={(e) => {
              setAiPrompt(e.target.value);
              if (aiError) setAiError("");
            }}
            placeholder={`Describe the quiz you want to generate`}
            className="bg-muted border-0 min-h-[300px] resize-none"
          />
        </FormField>
      </div>
    </div>
  );

  const handleCreateGame = async (asDraft: boolean = false) => {
    try {
      // Validate
      if (!formData.name.trim()) {
        toast.error("Name is required");
        return;
      }
      if (!formData.visibility.trim()) {
        toast.error("Visibility is required");
        return;
      }
      if (formData.visibility === 'locked') {
        if (!formData.password.trim()) {
          toast.error("Password is required for locked games");
          return;
        }
        if (formData.password.length < 4 || formData.password.length > 12) {
          toast.error("Password must be between 4 and 12 characters");
          return;
        }
      }
      if (!formData.category.trim()) {
        toast.error("Category is required");
        return;
      }
      if (!formData.language.trim()) {
        toast.error("Language is required");
        return;
      }
      if (!formData.description.trim()) {
        toast.error("Description is required");
        return;
      }
      if (!formData.gameplay.duration) {
        toast.error("Duration is required");
        return;
      }
      if (formData.gameplay.duration < 3) {
        toast.error("Duration must be greater than or equal to 3 minutes");
        return;
      }
      if (formData.gameplay.duration > 30) {
        toast.error("Duration must be less than or equal to 30 minutes");
        return;
      }
      if (formData.gameplay.hearts <= 0) {
        toast.error("Hearts must be greater than 0");
        return;
      }
      if (formData.gameplay.hearts > 50) {
        toast.error("Hearts must be less than or equal to 50");
        return;
      }
      if (formData.gameplay.brains <= 0) {
        toast.error("Brains must be greater than 0");
        return;
      }
      if (formData.gameplay.brains > 50) {
        toast.error("Brains must be less than or equal to 50");
        return;
      }
      if (formData.gameplay.initialAmmo < 0) {
        toast.error("Initial Ammo must be greater than or equal to 0");
        return;
      }
      if (formData.gameplay.initialAmmo > 50) {
        toast.error("Initial Ammo must be less than or equal to 50");
        return;
      }
      if (formData.gameplay.ammoPerCorrect <= 0) {
        toast.error("Ammo per Correct Answer must be greater than 0");
        return;
      }
      if (formData.gameplay.ammoPerCorrect > 50) {
        toast.error("Ammo per Correct Answer must be less than or equal to 50");
        return;
      }
      if (!formData.gameplay.mapId) {
        toast.error("Map is required");
        return;
      }

      // Check Total Ammo > Enemies
      // Total Ammo = Initial Ammo + (Number of questions * Ammo Per Correct Answer)
      const totalAmmo = formData.gameplay.initialAmmo + (formData.questions.length * formData.gameplay.ammoPerCorrect);
      if (totalAmmo < formData.gameplay.enemies) {
        toast.error("Total Ammo must be greater than Number of Enemies");
        return;
      }

      if (formData.questions.length === 0) {
        toast.error("At least one question is required");
        return;
      }

      // Validate Questions
      for (let i = 0; i < formData.questions.length; i++) {
        const q = formData.questions[i];

        if (!q.question.trim()) {
          toast.error(`Question ${i + 1}: Content is required`);
          return;
        }

        if (q.type === 'fill') {
          if (!q.fillAnswers || q.fillAnswers.length === 0) {
            toast.error(`Question ${i + 1}: At least one accepted answer is required`);
            return;
          }
        } else {
          // Check choices text
          if (q.choices.some(c => !c.text.trim())) {
            toast.error(`Question ${i + 1}: All choices must have text`);
            return;
          }

          // Check for duplicate choices
          const choiceTexts = q.choices.map(c => c.text.trim().toLowerCase());
          const uniqueTexts = new Set(choiceTexts);
          if (uniqueTexts.size !== choiceTexts.length) {
            toast.error(`Question ${i + 1}: Choice contents must be unique`);
            return;
          }

          const correctCount = q.choices.filter(c => c.isCorrect).length;
          if (q.type === 'single') {
            if (correctCount !== 1) {
              toast.error(`Question ${i + 1}: Single Answer question must have exactly one correct answer`);
              return;
            }
          } else if (q.type === 'multiple') {
            if (correctCount < 2) {
              toast.error(`Question ${i + 1}: Multiple Answer question must have at least 2 correct answers`);
              return;
            }
            if (correctCount === q.choices.length) {
              toast.error(`Question ${i + 1}: Multiple Answer question must not have all choices correct`);
              return;
            }
          }
        }
      }

      // Validate Knowledge
      for (let i = 0; i < formData.knowledges.length; i++) {
        if (!formData.knowledges[i].content.trim()) {
          toast.error(`Knowledge ${i + 1}: Content is required`);
          return;
        }
      }

      // Map visibility
      const visibilityMap = {
        public: GAME_VISIBILITY.PUBLIC,
        private: GAME_VISIBILITY.PRIVATE,
        locked: GAME_VISIBILITY.LOCKED,
        unlisted: GAME_VISIBILITY.UNLISTED
      };

      // Build payload for game_rooms table
      const payload = {
        name: formData.name,
        status: asDraft ? GAME_STATUS.DRAFT : GAME_STATUS.PUBLISHED,
        visibility: visibilityMap[formData.visibility],
        password: formData.visibility === 'locked' ? formData.password : undefined,
        category: formData.category,
        language: formData.language,
        tags: formData.tags,
        description: formData.description,
        cover_image: coverImage[0]?.url || "",

        // Transform questions to new format
        questions: formData.questions.map(q => ({
          type: q.type === 'fill' ? QUESTION_TYPES.FILL
            : q.type === 'multiple' ? QUESTION_TYPES.MULTIPLE
              : QUESTION_TYPES.SINGLE,
          question: q.question,
          media: (questionMedia[q.id] || []).map(m => ({
            url: m.url,
            type: m.type
          })),
          choices: q.type !== 'fill' ? q.choices.map(c => ({
            content: c.text,
            correct: c.isCorrect ? 1 : 0
          })) : undefined,
          answers: q.type === 'fill' ? (q.fillAnswers || []) : undefined
        })),

        // Transform knowledges to new format
        knowledges: formData.knowledges.map(k => ({
          content: k.content,
          media: (knowledgeMedia[k.id] || []).map(m => ({
            url: m.url,
            type: m.type
          }))
        })),

        // Gameplay settings
        duration: formData.gameplay.duration,
        enemies: formData.gameplay.enemies,
        hearts: formData.gameplay.hearts,
        brains: formData.gameplay.brains,
        initial_ammo: formData.gameplay.initialAmmo,
        ammo_per_correct: formData.gameplay.ammoPerCorrect,
        questions_order: formData.gameplay.questionsOrder ? 1 : null,
        knowledges_order: formData.gameplay.knowledgesOrder ? 1 : null,
        map: formData.gameplay.mapId
      };

      const response = await gameRoomService.createGame(payload);
      toast.success(asDraft ? "Game saved successfully" : "Game published successfully");
      navigate(asDraft ? `/games/edit/${response.gameId}` : `/games/view/${response.gameId}`);
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || "Failed to create game";
      toast.error(msg);
    }
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  const handleAIGenerate = async () => {
    setAiError("");

    if (!aiPrompt.trim()) {
      setAiError("Please enter an AI prompt");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await gameRoomService.generateWithAI(aiPrompt, categories, languages);

      if (response.success && response.gameCode) {
        toast.success("Game generated successfully!");
        navigate(`/games/edit/${response.gameId}`);
      } else {
        // Display message from AI (status 0 or 2) as badge
        setAiError(response.message || response.error || "Failed to generate game");
      }
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      const msg = error.response?.data?.message || error.response?.data?.error || "Failed to generate game with AI";
      setAiError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderNavigation = () => {
    if (mode === "select") return null;

    return (
      <div className="sticky bottom-0 bg-white py-6 px-4 mt-8">
        <div className="flex justify-between">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              if (mode === "user" && userStep > 1) {
                setUserStep((userStep - 1) as UserStep);
              } else {
                setMode("select");
              }
            }}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {mode === "user" && userStep < 4 ? (
            <Button
              className="gap-2"
              onClick={() => setUserStep((userStep + 1) as UserStep)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              {mode === "ai" ? (
                <Button onClick={handleAIGenerate} disabled={isGenerating}>
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
              ) : (
                <>
                  <Button variant="outline" onClick={() => handleCreateGame(true)}>
                    Save Draft
                  </Button>
                  <Button onClick={() => handleCreateGame(false)}>
                    Publish
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const selectedMap = maps.find(m => m.map_id === formData.gameplay.mapId);

  return (
    <PageLayout title="Create Game">
      {mode === "select" && renderModeSelection()}
      {mode === "user" && renderUserCreatedStep()}
      {mode === "ai" && renderAIMode()}
      {renderNavigation()}
    </PageLayout>
  );
}
