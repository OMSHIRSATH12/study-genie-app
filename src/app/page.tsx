"use client";

import { useState, useMemo } from 'react';
import {
  BookOpen,
  ClipboardCheck,
  Lightbulb,
  Loader2,
  Sparkles,
  HelpCircle,
  BrainCircuit,
  LayoutDashboard,
  GraduationCap,
  Library,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { summarizeContent } from '@/ai/flows/summarize-content';
import { generateQuiz, type GenerateQuizOutput } from '@/ai/flows/generate-quiz';
import { generateFlashcards, type GenerateFlashcardsOutput } from '@/ai/flows/generate-flashcards';
import { generateMotivationalTip } from '@/ai/flows/generate-motivational-tip';
import { Progress } from '@/components/ui/progress';
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
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

type Quiz = GenerateQuizOutput['quizQuestions'][0];
type Flashcard = GenerateFlashcardsOutput['flashcards'][0];

export default function Home() {
  const { toast } = useToast();
  const [studyContent, setStudyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [summary, setSummary] = useState('');
  const [quiz, setQuiz] = useState<Quiz[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [activeTab, setActiveTab] = useState('home');

  // Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Flashcard State
  const [reviewedFlashcards, setReviewedFlashcards] = useState(new Set<number>());

  // Motivation State
  const [studyHabit, setStudyHabit] = useState('');
  const [motivationalTip, setMotivationalTip] = useState('');

  const handleGenerate = async () => {
    if (!studyContent.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter some study content.',
      });
      return;
    }
    setIsLoading(true);
    setIsGenerated(false);
    // Reset states
    setSummary('');
    setQuiz([]);
    setFlashcards([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setReviewedFlashcards(new Set());
    setMotivationalTip('');

    try {
      const [summaryResult, quizResult, flashcardsResult] = await Promise.all([
        summarizeContent({ content: studyContent }),
        generateQuiz({ studyContent, numberOfQuestions: 5 }),
        generateFlashcards({ studyContent, numFlashcards: 10 }),
      ]);
      setSummary(summaryResult.summary);
      setQuiz(quizResult.quizQuestions);
      setFlashcards(flashcardsResult.flashcards);
      setIsGenerated(true);
      setActiveTab('study');
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
    if (!selectedAnswer) return;
    setIsAnswerSubmitted(true);
    if (selectedAnswer === quiz[currentQuestionIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setIsAnswerSubmitted(false);
    setSelectedAnswer(null);
    setCurrentQuestionIndex(prev => prev + 1);
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setScore(0);
  };

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
        progressPercentage: Math.round((score / (quiz.length || 1)) * 100),
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

  const progressData = useMemo(
    () => [
      {
        name: 'Quiz',
        value: quiz.length > 0 ? (score / quiz.length) * 100 : 0,
        fill: 'hsl(var(--primary))',
      },
      {
        name: 'Flashcards',
        value: flashcards.length > 0 ? (reviewedFlashcards.size / flashcards.length) * 100 : 0,
        fill: 'hsl(var(--accent))',
      },
    ],
    [score, quiz.length, reviewedFlashcards.size, flashcards.length]
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="flex items-center gap-4 p-6 border-b">
        <BrainCircuit className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">StudyGenie</h1>
      </header>

      <main className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-grow flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="home">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Home
            </TabsTrigger>
            <TabsTrigger value="study" disabled={!isGenerated}>
              <GraduationCap className="mr-2 h-4 w-4" />
              Study
            </TabsTrigger>
            <TabsTrigger value="resources">
              <Library className="mr-2 h-4 w-4" />
              Resources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home">
            <HomeTab
              studyContent={studyContent}
              setStudyContent={setStudyContent}
              isLoading={isLoading}
              handleGenerate={handleGenerate}
              isGenerated={isGenerated}
              progressData={progressData}
            />
          </TabsContent>
          <TabsContent value="study" className="flex-grow mt-4">
            <StudyTab
              summary={summary}
              isLoading={isLoading}
              flashcards={flashcards}
              reviewedFlashcards={reviewedFlashcards}
              setReviewedFlashcards={setReviewedFlashcards}
              quiz={quiz}
              currentQuestionIndex={currentQuestionIndex}
              selectedAnswer={selectedAnswer}
              setSelectedAnswer={setSelectedAnswer}
              isAnswerSubmitted={isAnswerSubmitted}
              handleQuizSubmit={handleQuizSubmit}
              handleNextQuestion={handleNextQuestion}
              resetQuiz={resetQuiz}
              score={score}
            />
          </TabsContent>
          <TabsContent value="resources">
            <ResourcesTab
              studyHabit={studyHabit}
              setStudyHabit={setStudyHabit}
              motivationalTip={motivationalTip}
              handleGenerateTip={handleGenerateTip}
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
  isLoading,
  handleGenerate,
  isGenerated,
  progressData,
}: {
  studyContent: string;
  setStudyContent: (value: string) => void;
  isLoading: boolean;
  handleGenerate: () => void;
  isGenerated: boolean;
  progressData: any[];
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <Card className="flex-grow flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <span>Start Studying</span>
        </CardTitle>
        <CardDescription>
          Paste your study material below to generate a summary, quiz, and flashcards.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4">
        <Textarea
          placeholder="Paste your notes, article, or any text here..."
          className="w-full flex-grow min-h-[200px] text-base"
          value={studyContent}
          onChange={e => setStudyContent(e.target.value)}
          disabled={isLoading}
        />
        <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate
        </Button>
      </CardContent>
    </Card>
    {isGenerated && <ProgressTracker progressData={progressData} />}
  </div>
);

const StudyTab = ({
  summary,
  isLoading,
  flashcards,
  reviewedFlashcards,
  setReviewedFlashcards,
  quiz,
  currentQuestionIndex,
  selectedAnswer,
  setSelectedAnswer,
  isAnswerSubmitted,
  handleQuizSubmit,
  handleNextQuestion,
  resetQuiz,
  score,
}: {
  summary: string;
  isLoading: boolean;
  flashcards: Flashcard[];
  reviewedFlashcards: Set<number>;
  setReviewedFlashcards: React.Dispatch<React.SetStateAction<Set<number>>>;
  quiz: Quiz[];
  currentQuestionIndex: number;
  selectedAnswer: string | null;
  setSelectedAnswer: (answer: string) => void;
  isAnswerSubmitted: boolean;
  handleQuizSubmit: () => void;
  handleNextQuestion: () => void;
  resetQuiz: () => void;
  score: number;
}) => (
  <Tabs defaultValue="summary" className="w-full flex-grow flex flex-col">
    <TabsList className="grid w-full grid-cols-3">
      <TabsTrigger value="summary">
        <BookOpen className="mr-2 h-4 w-4" />
        Summary
      </TabsTrigger>
      <TabsTrigger value="flashcards">
        <ClipboardCheck className="mr-2 h-4 w-4" />
        Flashcards
      </TabsTrigger>
      <TabsTrigger value="quiz">
        <HelpCircle className="mr-2 h-4 w-4" />
        Quiz
      </TabsTrigger>
    </TabsList>

    <TabsContent value="summary" className="flex-grow mt-4">
      <SummaryDisplay summary={summary} isLoading={isLoading} />
    </TabsContent>

    <TabsContent value="flashcards" className="flex-grow mt-4">
      <FlashcardDisplay
        flashcards={flashcards}
        isLoading={isLoading}
        reviewedFlashcards={reviewedFlashcards}
        setReviewedFlashcards={setReviewedFlashcards}
      />
    </TabsContent>

    <TabsContent value="quiz" className="flex-grow mt-4">
      <QuizDisplay
        quiz={quiz}
        isLoading={isLoading}
        currentQuestionIndex={currentQuestionIndex}
        selectedAnswer={selectedAnswer}
        setSelectedAnswer={setSelectedAnswer}
        isAnswerSubmitted={isAnswerSubmitted}
        handleQuizSubmit={handleQuizSubmit}
        handleNextQuestion={handleNextQuestion}
        resetQuiz={resetQuiz}
        score={score}
      />
    </TabsContent>
  </Tabs>
);

const ResourcesTab = ({
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
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <MotivationStation
      studyHabit={studyHabit}
      setStudyHabit={setStudyHabit}
      motivationalTip={motivationalTip}
      handleGenerateTip={handleGenerateTip}
    />
    <Faq />
  </div>
);


const SummaryDisplay = ({ summary, isLoading }: { summary: string; isLoading: boolean }) => (
  <Card className="h-full min-h-[400px]">
    <CardHeader>
      <CardTitle>Content Summary</CardTitle>
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
  reviewedFlashcards,
  setReviewedFlashcards,
}: {
  flashcards: Flashcard[];
  isLoading: boolean;
  reviewedFlashcards: Set<number>;
  setReviewedFlashcards: React.Dispatch<React.SetStateAction<Set<number>>>;
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
    setReviewedFlashcards(prev => new Set(prev).add(index));
  };

  return (
    <Card className="h-full min-h-[400px] flex flex-col">
      <CardHeader>
        <CardTitle>Flashcards</CardTitle>
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
        <CardTitle>Quiz Time!</CardTitle>
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
          onValueChange={setSelectedAnswer}
          disabled={isAnswerSubmitted}
          className="space-y-2"
        >
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              className={cn('flex items-center space-x-3 p-3 rounded-lg border transition-all', getOptionClass(option))}
            >
              <RadioGroupItem value={option} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`} className="text-base cursor-pointer flex-1">
                {option}
              </Label>
            </div>
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

const ProgressTracker = ({ progressData }: { progressData: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Your Progress</CardTitle>
      <CardDescription>Complete quizzes and review flashcards to see your progress.</CardDescription>
    </CardHeader>
    <CardContent className="h-[240px] pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={progressData} layout="vertical" margin={{ left: 10, right: 40 }}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            width={80}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: 'hsl(var(--foreground))', formatter: (v: number) => `${Math.round(v)}%` }} barSize={35} />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

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
      <Button onClick={handleGenerateTip} className="w-full" variant="outline">
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
        <span>Study Q&A</span>
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
