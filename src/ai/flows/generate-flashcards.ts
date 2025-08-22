
// src/ai/flows/generate-flashcards.ts
'use server';

/**
 * @fileOverview A flashcard generation AI agent.
 *
 * - generateFlashcards - A function that handles the flashcard generation process.
 * - GenerateFlashcardsInput - The input type for the generateFlashcards function.
 * - GenerateFlashcardsOutput - The return type for the generateFlashcards function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFlashcardsInputSchema = z.object({
  studyContent: z
    .string()
    .describe('The study content to generate flashcards from. This could be a block of text or just a topic title.'),
  numFlashcards: z.number().default(5).describe('The number of flashcards to generate.'),
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z.array(
    z.object({
      front: z.string().describe('The question or term on the front of the flashcard.'),
      back: z.string().describe('The answer or definition on the back of the flashcard.'),
    })
  ).describe('An array of flashcard objects.'),
});
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;

export async function generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFlashcardsPrompt',
  input: {schema: GenerateFlashcardsInputSchema},
  output: {schema: GenerateFlashcardsOutputSchema},
  prompt: `You are an expert educator specializing in creating effective flashcards for students.

  A user has provided the following content. It might be a full text or just a topic title.
  If it is just a topic title, first generate a comprehensive overview of the topic to use as the basis for the flashcards.

  Based on the content (either provided or generated), create a set of flashcards to help the student actively recall information.

  Study Content: {{{studyContent}}}

  Number of Flashcards: {{{numFlashcards}}}

  Format each flashcard as a question and answer pair.
  Make sure the questions are clear, concise, and focused on the key concepts from the study content.  The answer must be accurate and contain all relevant information to fully answer the question.

  Ensure that the generated flashcards are suitable for active recall and spaced repetition.
  The questions must be phrased so that they trigger memory recall for effective studying.

  Return the flashcards as a JSON array of objects, where each object has a front and back property.
`,
   config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
       {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
});

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
