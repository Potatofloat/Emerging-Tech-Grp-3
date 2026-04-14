'use server';
/**
 * @fileOverview A Genkit flow for predicting peak hours at guardhouses based on historical crowd data.
 *
 * - predictPeakHours - A function that handles the peak hour prediction process.
 * - PredictPeakHoursInput - The input type for the predictPeakHours function.
 * - PredictPeakHoursOutput - The return type for the predictPeakHours function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema
const HistoricalDataEntrySchema = z.object({
  guardhouseId: z.string().describe('The ID of the guardhouse.'),
  timestamp: z.string().describe('The timestamp of the crowd data (ISO 8601 format).'),
  crowdCount: z.number().int().min(0).describe('The number of people in the guardhouse at the given timestamp.'),
});

const PredictPeakHoursInputSchema = z.object({
  historicalData: z.array(HistoricalDataEntrySchema).describe('An array of historical crowd data entries for various guardhouses.'),
});
export type PredictPeakHoursInput = z.infer<typeof PredictPeakHoursInputSchema>;

// Output Schema
const PredictedPeakHoursEntrySchema = z.object({
  guardhouseId: z.string().describe('The ID of the guardhouse.'),
  predictedPeakHours: z.array(z.string()).describe('A list of predicted peak hour time ranges for the guardhouse (e.g., "Monday 08:00-09:00", "Tuesday 17:00-18:00").'),
  reasoning: z.string().describe('An explanation for the peak hour prediction based on the historical data patterns.'),
});

const PredictPeakHoursOutputSchema = z.object({
  predictions: z.array(PredictedPeakHoursEntrySchema).describe('An array of peak hour predictions for different guardhouses.'),
});
export type PredictPeakHoursOutput = z.infer<typeof PredictPeakHoursOutputSchema>;

// Prompt definition
const predictPeakHoursPrompt = ai.definePrompt({
  name: 'predictPeakHoursPrompt',
  input: { schema: PredictPeakHoursInputSchema },
  output: { schema: PredictPeakHoursOutputSchema },
  prompt: `You are an AI assistant specialized in analyzing crowd data and predicting peak hours.
Your task is to analyze the provided historical crowd data for various guardhouses and identify patterns to predict upcoming peak hours or potentially busy periods.
For each guardhouse, provide a list of predicted peak hour time ranges and a brief reasoning for your prediction.

Historical Crowd Data:
\`\`\`json
{{{JSON.stringify historicalData}}}
\`\`\`

Analyze the data and provide your predictions in the following JSON format:
{{output.schema}}`,
});

// Flow definition
const predictPeakHoursFlow = ai.defineFlow(
  {
    name: 'predictPeakHoursFlow',
    inputSchema: PredictPeakHoursInputSchema,
    outputSchema: PredictPeakHoursOutputSchema,
  },
  async (input) => {
    const { output } = await predictPeakHoursPrompt(input);
    return output!;
  }
);

// Wrapper function
export async function predictPeakHours(input: PredictPeakHoursInput): Promise<PredictPeakHoursOutput> {
  return predictPeakHoursFlow(input);
}
