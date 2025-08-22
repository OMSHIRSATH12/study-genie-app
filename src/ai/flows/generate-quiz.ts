
'use server';
/**
 * @fileOverview Generates multiple-choice quiz questions from study materials.
 *
 * - generateQuiz - A function that generates quiz questions based on study content.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizInputSchema = z.object({
  studyContent: z
    .string()
    .describe('The study material to generate quiz questions from. This could be a block of text or just a topic title.'),
  numberOfQuestions: z
    .number()
    .default(5)
    .describe('The number of quiz questions to generate.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const GenerateQuizOutputSchema = z.object({
  quizQuestions: z.array(
    z.object({
      question: z.string().describe('The quiz question.'),
      options: z.array(z.string()).describe('The possible answers.'),
      correctAnswer: z.string().describe('The correct answer to the question.'),
    })
  ),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `You are an expert educator. Your task is to generate multiple-choice quiz questions.
  
  A user has provided the following content. It might be a full text or just a topic title.
  If it is just a topic title, first generate a comprehensive overview of the topic to use as the basis for the quiz.
  
  Based on the content (either provided or generated), create multiple-choice quiz questions. Each question should have 4 possible answers, with one correct answer.

Study Content: {{{studyContent}}}

Number of Questions: {{{numberOfQuestions}}}

Format your output as a JSON object with a "quizQuestions" field containing an array of question objects. Each question object should have the fields "question", "options" (an array of 4 strings), and "correctAnswer" (a string from the options array).
`,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

    