'use server';

/**
 * @fileOverview A flow that generates personalized motivational study tips.
 *
 * - generateMotivationalTip - A function that returns a motivational tip based on user progress.
 * - GenerateMotivationalTipInput - The input type for the generateMotivationalTip function.
 * - GenerateMotivationalTipOutput - The return type for the generateMotivationalTip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMotivationalTipInputSchema = z.object({
  progressPercentage: z
    .number()
    .describe(
      'The percentage of study materials the user has completed (0-100).'
    ),
  studyHabits: z
    .string()
    .describe(
      'A brief description of the users study habits, e.g., procrastinates, studies best in the morning, etc.'
    ),
});
export type GenerateMotivationalTipInput = z.infer<typeof GenerateMotivationalTipInputSchema>;

const GenerateMotivationalTipOutputSchema = z.object({
  tip: z.string().describe('A personalized motivational study tip.'),
});
export type GenerateMotivationalTipOutput = z.infer<typeof GenerateMotivationalTipOutputSchema>;

export async function generateMotivationalTip(
  input: GenerateMotivationalTipInput
): Promise<GenerateMotivationalTipOutput> {
  return generateMotivationalTipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMotivationalTipPrompt',
  input: {schema: GenerateMotivationalTipInputSchema},
  output: {schema: GenerateMotivationalTipOutputSchema},
  prompt: `You are a motivational study coach. Generate a study tip based on the users progress and study habits.

  Progress Percentage: {{{progressPercentage}}}%
  Study Habits: {{{studyHabits}}}

  Tip:`,
});

const generateMotivationalTipFlow = ai.defineFlow(
  {
    name: 'generateMotivationalTipFlow',
    inputSchema: GenerateMotivationalTipInputSchema,
    outputSchema: GenerateMotivationalTipOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
