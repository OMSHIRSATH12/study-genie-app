
"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  BookOpen,
  ClipboardCheck,
  Lightbulb,
  Loader2,
  Sparkles,
  HelpCircle,
  BrainCircuit,
  BarChart2,
  User,
  Trash2,
  Paperclip,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { summarizeContent } from '@/ai/flows/summarize-content';
import { generateQuiz, type GenerateQuizOutput } from '@/ai/flows/generate-quiz';
import { generateFlashcards, type GenerateFlashcardsOutput } from '@/ai/flows/generate-flashcards';
import { generateMotivationalTip } from '@/ai/flows/generate-motivational-tip';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Pie, PieChart, Sector } from 'recharts';
import React from 'react';

type Quiz = GenerateQuizOutput['quizQuestions'][0];
type Flashcard = GenerateFlashcardsOutput['flashcards'][0];
type StudyTopic = {
  id: string;
  title: string;
  summary: string;
  quiz: Quiz[];
  flashcards: Flashcard[];
  quizProgress: number;
  flashcardProgress: number;
  // State for the quiz itself
  currentQuestionIndex: number;
  selectedAnswer: string | null;
  isAnswerSubmitted: boolean;
  score: number;
  // State for flashcards
  reviewedFlashcards: Set<number>;
};


export default function Home() {
  const { toast } = useToast();
  const [studyContent, setStudyContent] = useState('');
  const [topicTitle, setTopicTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  const [studyTopics, setStudyTopics] = useState<StudyTopic[]>([]);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedTopics = localStorage.getItem('studyTopics');
      if (savedTopics) {
        setStudyTopics(JSON.parse(savedTopics));
      }
    } catch (error) {
      console.error("Failed to load topics from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('studyTopics', JSON.stringify(studyTopics));
    } catch (error) {
      console.error("Failed to save topics to localStorage", error);
    }
  }, [studyTopics]);

  const activeTopic = useMemo(() => {
    return studyTopics.find(t => t.id === activeTopicId) || null;
  }, [studyTopics, activeTopicId]);

  const updateActiveTopic = (updates: Partial<StudyTopic>) => {
    if (!activeTopicId) return;
    setStudyTopics(prevTopics =>
      prevTopics.map(topic =>
        topic.id === activeTopicId ? { ...topic, ...updates } : topic
      )
    );
  };

  const handleGenerate = async () => {
    if (!studyContent.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter some study content.',
      });
      return;
    }
    if (!topicTitle.trim()) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please enter a title for your topic.',
        });
        return;
      }
    setIsLoading(true);

    try {
      const [summaryResult, quizResult, flashcardsResult] = await Promise.all([
        summarizeContent({ content: studyContent }),
        generateQuiz({ studyContent, numberOfQuestions: 5 }),
        generateFlashcards({ studyContent, numFlashcards: 10 }),
      ]);

      const newTopic: StudyTopic = {
        id: new Date().toISOString(),
        title: topicTitle,
        summary: summaryResult.summary,
        quiz: quizResult.quizQuestions,
        flashcards: flashcardsResult.flashcards,
        quizProgress: 0,
        flashcardProgress: 0,
        currentQuestionIndex: 0,
        selectedAnswer: null,
        isAnswerSubmitted: false,
        score: 0,
        reviewedFlashcards: new Set(),
      };

      setStudyTopics(prev => [...prev, newTopic]);
      setActiveTopicId(newTopic.id);
      setActiveTab("summary");

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to generate study materials. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizSubmit = () => {
    if (!activeTopic || activeTopic.selectedAnswer === null) return;
    let newScore = activeTopic.score;
    if (activeTopic.selectedAnswer === activeTopic.quiz[activeTopic.currentQuestionIndex].correctAnswer) {
      newScore += 1;
    }
    const newProgress = (newScore / activeTopic.quiz.length) * 100;
    updateActiveTopic({ isAnswerSubmitted: true, score: newScore, quizProgress: newProgress });
  };

  const handleNextQuestion = () => {
    if (!activeTopic) return;
    updateActiveTopic({
        isAnswerSubmitted: false,
        selectedAnswer: null,
        currentQuestionIndex: activeTopic.currentQuestionIndex + 1,
    });
  };

  const resetQuiz = () => {
    updateActiveTopic({
        currentQuestionIndex: 0,
        selectedAnswer: null,
        isAnswerSubmitted: false,
        score: 0,
        quizProgress: 0,
    });
  };

  const handleSetReviewedFlashcard = (index: number) => {
    if (!activeTopic) return;
    const newReviewedFlashcards = new Set(activeTopic.reviewedFlashcards).add(index);
    const newProgress = (newReviewedFlashcards.size / activeTopic.flashcards.length) * 100;
    updateActiveTopic({ reviewedFlashcards: newReviewedFlashcards, flashcardProgress: newProgress });
  };
  
  const handleSelectTopic = (topicId: string) => {
    setActiveTopicId(topicId);
    setActiveTab('summary'); 
  };

  const handleDeleteTopic = (topicId: string) => {
    setStudyTopics(prev => prev.filter(t => t.id !== topicId));
    if (activeTopicId === topicId) {
        setActiveTopicId(null);
        setActiveTab('home');
    }
  };

  // Motivation State
  const [studyHabit, setStudyHabit] = useState('');
  const [motivationalTip, setMotivationalTip] = useState('');

  const handleGenerateTip = async () => {
    if (!studyHabit) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a study habit.',
      });
      return;
    }
    try {
      const result = await generateMotivationalTip({
        progressPercentage: activeTopic?.quizProgress || 0,
        studyHabits: studyHabit,
      });
      setMotivationalTip(result.tip);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to generate a tip. Please try again.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
       <header className="flex items-center justify-between gap-4 p-6 border-b">
        <div className="flex items-center gap-4">
            <BrainCircuit className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">StudyGenie</h1>
        </div>
      </header>
      <main className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 mb-6">
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="summary" disabled={!activeTopic}>Summary</TabsTrigger>
            <TabsTrigger value="flashcards" disabled={!activeTopic}>Flashcards</TabsTrigger>
            <TabsTrigger value="quiz" disabled={!activeTopic}>Quiz</TabsTrigger>
            <TabsTrigger value="resources" disabled={!activeTopic}>Resources</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="home">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p>Generating your study materials...</p>
              </div>
            ) : (
               <HomeTab
                studyContent={studyContent}
                setStudyContent={setStudyContent}
                topicTitle={topicTitle}
                setTopicTitle={setTopicTitle}
                isLoading={isLoading}
                handleGenerate={handleGenerate}
              />
            )}
          </TabsContent>

          <TabsContent value="summary">
            <SummaryDisplay summary={activeTopic?.summary || ''} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="flashcards">
            <FlashcardDisplay
              flashcards={activeTopic?.flashcards || []}
              isLoading={isLoading}
              onReviewed={handleSetReviewedFlashcard}
            />
          </TabsContent>

          <TabsContent value="quiz">
            {activeTopic && (
                <QuizDisplay
                    key={activeTopic.id}
                    quiz={activeTopic.quiz}
                    isLoading={isLoading}
                    currentQuestionIndex={activeTopic.currentQuestionIndex}
                    selectedAnswer={activeTopic.selectedAnswer}
                    setSelectedAnswer={(answer) => updateActiveTopic({ selectedAnswer: answer })}
                    isAnswerSubmitted={activeTopic.isAnswerSubmitted}
                    handleQuizSubmit={handleQuizSubmit}
                    handleNextQuestion={handleNextQuestion}
                    resetQuiz={resetQuiz}
                    score={activeTopic.score}
                />
            )}
          </TabsContent>

          <TabsContent value="resources">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MotivationStation
                  studyHabit={studyHabit}
                  setStudyHabit={setStudyHabit}
                  motivationalTip={motivationalTip}
                  handleGenerateTip={handleGenerateTip}
                />
                <Faq />
              </div>
          </TabsContent>
          
          <TabsContent value="profile">
              <ProfileTab 
                studyTopics={studyTopics}
                onSelectTopic={handleSelectTopic}
                onDeleteTopic={handleDeleteTopic}
              />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

const HomeTab = ({
  studyContent,
  setStudyContent,
  topicTitle,
  setTopicTitle,
  isLoading,
  handleGenerate
}: {
  studyContent: string;
  setStudyContent: (value: string) => void;
  topicTitle: string;
  setTopicTitle: (value: string) => void;
  isLoading: boolean;
  handleGenerate: () => void;
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
          setFileName(file.name);
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target?.result as string;
            setStudyContent(text);
          };
          reader.readAsText(file);
        }
      };
    
      const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
        const pastedText = event.clipboardData.getData('text');
        setStudyContent(pastedText);
      };

    return (
        <Card className="flex-grow flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    <span>Start Studying</span>
                </CardTitle>
                <CardDescription>
                    Give your study session a title, then paste your material, or upload a file.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col gap-4">
                <Input
                    placeholder="Enter a title for your topic..."
                    className="w-full text-base"
                    value={topicTitle}
                    onChange={e => setTopicTitle(e.target.value)}
                    disabled={isLoading}
                />
                <div className="relative">
                    <Input
                        placeholder="Paste your content or upload a file..."
                        className="w-full text-base pr-12"
                        value={studyContent || fileName}
                        onPaste={handlePaste}
                        onChange={(e) => {
                            if (!fileName) {
                                setStudyContent(e.target.value);
                            }
                        }}
                        disabled={isLoading}
                    />
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".txt,.md"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1/2 right-2 -translate-y-1/2"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                    >
                        <Paperclip className="h-5 w-5" />
                    </Button>
                </div>
                <Button onClick={handleGenerate} disabled={isLoading || !studyContent.trim() || !topicTitle.trim()} className="w-full">
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Generate
                </Button>
            </CardContent>
        </Card>
    );
}

const SummaryDisplay = ({ summary, isLoading }: { summary: string; isLoading: boolean }) => (
  <Card className="h-full min-h-[400px]">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        Content Summary
      </CardTitle>
      <CardDescription>Key points from your study material.</CardDescription>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
        </div>
      ) : summary ? (
        <p className="whitespace-pre-wrap leading-relaxed">{summary}</p>
      ) : (
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64">
          <BookOpen className="h-12 w-12 mb-4" />
          <p>Your summary will appear here once generated.</p>
        </div>
      )}
    </CardContent>
  </Card>
);

const FlashcardDisplay = ({
  flashcards,
  isLoading,
  onReviewed,
}: {
  flashcards: Flashcard[];
  isLoading: boolean;
  onReviewed: (index: number) => void;
}) => {
  const [flippedStates, setFlippedStates] = useState<Record<number, boolean>>({});

  if (isLoading)
    return (
      <Card className="h-full min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  if (!flashcards.length)
    return (
      <Card className="h-full min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
          <ClipboardCheck className="h-12 w-12 mb-4" />
          <p>Your flashcards will appear here.</p>
        </div>
      </Card>
    );

  const handleFlip = (index: number) => {
    setFlippedStates(prev => ({ ...prev, [index]: !prev[index] }));
    onReviewed(index);
  };

  return (
    <Card className="h-full min-h-[400px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          Flashcards
        </CardTitle>
        <CardDescription>Click to flip. Use arrows to navigate.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center">
        <Carousel className="w-full max-w-lg">
          <CarouselContent>
            {flashcards.map((card, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <div
                    className={cn('flashcard w-full h-80 relative cursor-pointer', { 'is-flipped': flippedStates[index] })}
                    onClick={() => handleFlip(index)}
                  >
                    {/* Front */}
                    <div className="flashcard-front absolute w-full h-full">
                      <Card className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-primary/10 border-primary shadow-lg">
                        <CardTitle className="text-xl font-semibold">{card.front}</CardTitle>
                      </Card>
                    </div>
                    {/* Back */}
                    <div className="flashcard-back absolute w-full h-full">
                      <Card className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-accent/10 border-accent shadow-lg">
                        <CardContent className="text-lg">
                          <p>{card.back}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="ml-12" />
          <CarouselNext className="mr-12" />
        </Carousel>
      </CardContent>
    </Card>
  );
};

const QuizDisplay = ({
  quiz,
  isLoading,
  currentQuestionIndex,
  selectedAnswer,
  setSelectedAnswer,
  isAnswerSubmitted,
  handleQuizSubmit,
  handleNextQuestion,
  resetQuiz,
  score,
}: {
  quiz: Quiz[];
  isLoading: boolean;
  currentQuestionIndex: number;
  selectedAnswer: string | null;
  setSelectedAnswer: (answer: string) => void;
  isAnswerSubmitted: boolean;
  handleQuizSubmit: () => void;
  handleNextQuestion: () => void;
  resetQuiz: () => void;
  score: number;
}) => {
  if (isLoading)
    return (
      <Card className="h-full min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  if (!quiz.length)
    return (
      <Card className="h-full min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
          <HelpCircle className="h-12 w-12 mb-4" />
          <p>Your quiz will appear here.</p>
        </div>
      </Card>
    );

  const currentQuestion = quiz[currentQuestionIndex];
  const isQuizFinished = currentQuestionIndex >= quiz.length;

  const getOptionClass = (option: string) => {
    if (!isAnswerSubmitted) return 'hover:bg-muted/50';
    if (option === currentQuestion.correctAnswer) return 'bg-green-500/20 border-green-500 text-green-300';
    if (option === selectedAnswer) return 'bg-red-500/20 border-red-500 text-red-300';
    return 'opacity-50';
  };

  if (isQuizFinished) {
    return (
      <Card className="h-full min-h-[400px] flex flex-col items-center justify-center text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
          <CardDescription className="text-lg">
            You scored {score} out of {quiz.length}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={resetQuiz}>Take Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full min-h-[400px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Quiz Time!
        </CardTitle>
        <div className="flex justify-between items-center">
          <CardDescription>
            Question {currentQuestionIndex + 1} of {quiz.length}
          </CardDescription>
          <div className="text-sm font-bold">Score: {score}</div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4">
        <p className="font-semibold text-lg">{currentQuestion.question}</p>
        <RadioGroup
          value={selectedAnswer || ''}
          onValueValueChange={setSelectedAnswer}
          disabled={isAnswerSubmitted}
          className="space-y-2"
        >
          {currentQuestion.options.map((option, index) => (
            <Label
              key={index}
              htmlFor={`option-${index}`}
              className={cn('flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer', getOptionClass(option))}
            >
              <RadioGroupItem value={option} id={`option-${index}`} />
              <span className="text-base flex-1">
                {option}
              </span>
            </Label>
          ))}
        </RadioGroup>
      </CardContent>
      <div className="p-6 pt-0">
        {!isAnswerSubmitted ? (
          <Button onClick={handleQuizSubmit} disabled={!selectedAnswer} className="w-full">
            Submit
          </Button>
        ) : (
          <Button onClick={handleNextQuestion} className="w-full">
            Next Question
          </Button>
        )}
      </div>
    </Card>
  );
};

const ProfileTab = ({ 
    studyTopics,
    onSelectTopic,
    onDeleteTopic,
  }: { 
    studyTopics: StudyTopic[];
    onSelectTopic: (topicId: string) => void;
    onDeleteTopic: (topicId: string) => void;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Your Profile
        </CardTitle>
        <CardDescription>A summary of your study progress across all topics.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {studyTopics.length === 0 ? (
            <p className="text-muted-foreground text-center">You haven't studied any topics yet. Go to the Home tab to get started!</p>
        ) : (
            studyTopics.map(topic => (
                <Card key={topic.id} className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl mb-2">{topic.title}</CardTitle>
                            <div className="flex gap-4">
                                <Button size="sm" onClick={() => onSelectTopic(topic.id)}>
                                    View Topic
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => onDeleteTopic(topic.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-center w-1/2">
                            <ProgressCircle title="Quiz Progress" value={topic.quizProgress} />
                            <ProgressCircle title="Flashcards Reviewed" value={topic.flashcardProgress} />
                        </div>
                    </div>
                </Card>
            ))
        )}
      </CardContent>
    </Card>
  );

const chartConfig = {
  progress: {
    label: "Progress",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

const ProgressCircle = ({ title, value }: { title: string, value: number }) => {
  const chartData = [{ name: 'progress', value, fill: 'var(--color-progress)' }];

  return (
    <div className="flex flex-col items-center justify-center p-2">
       <h3 className="text-sm font-medium mb-2">{title}</h3>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-[100px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel hideIndicator />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={30}
              outerRadius={40}
              strokeWidth={2}
              activeIndex={0}
              activeShape={({ outerRadius = 0, ...props }) => (
                <g>
                  <Sector {...props} outerRadius={outerRadius + 4} />
                  <Sector {...props} outerRadius={outerRadius} cornerRadius={5} />
                </g>
              )}
            >
            </Pie>
             <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground text-xl font-bold"
            >
              {`${Math.round(value)}%`}
            </text>
          </PieChart>
        </ChartContainer>
    </div>
  )
}

const MotivationStation = ({
  studyHabit,
  setStudyHabit,
  motivationalTip,
  handleGenerateTip,
}: {
  studyHabit: string;
  setStudyHabit: (habit: string) => void;
  motivationalTip: string;
  handleGenerateTip: () => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-accent" />
        <span>Motivation Station</span>
      </CardTitle>
      <CardDescription>Get a personalized study tip based on your habits.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <Select onValueChange={setStudyHabit} value={studyHabit}>
        <SelectTrigger>
          <SelectValue placeholder="Select your study habit..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="I tend to procrastinate">I tend to procrastinate</SelectItem>
          <SelectItem value="I get distracted easily">I get distracted easily</SelectItem>
          <SelectItem value="I study best in the morning">I study best in the morning</SelectItem>
          <SelectItem value="I prefer studying in short bursts">I prefer studying in short bursts</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleGenerateTip} className="w-full" variant="outline" disabled={!studyHabit}>
        Get a Tip
      </Button>
      {motivationalTip && (
        <div className="p-3 bg-accent/10 rounded-lg text-sm text-accent-foreground border border-accent/20">
          {motivationalTip}
        </div>
      )}
    </CardContent>
  </Card>
);

const Faq = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-accent" />
        <span>Study Q&amp;A</span>
      </CardTitle>
      <CardDescription>Answers to common questions.</CardDescription>
    </CardHeader>
    <CardContent>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>How can I study more effectively?</AccordionTrigger>
          <AccordionContent>
            Active recall is key. Instead of just re-reading, test yourself with flashcards and quizzes. Spaced repetition, where you review material at increasing intervals, also boosts long-term memory.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>What is the Pomodoro Technique?</AccordionTrigger>
          <AccordionContent>
            It's a time management method. You work for 25 minutes, then take a 5-minute break. After four "pomodoros," take a longer break (15-30 minutes). This helps maintain focus and prevent burnout.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>How do I avoid procrastination?</AccordionTrigger>
          <AccordionContent>
            Break large tasks into smaller, manageable steps. Set realistic goals and deadlines. The "two-minute rule" can help: if a task takes less than two minutes, do it immediately.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </CardContent>
  </Card>
);
