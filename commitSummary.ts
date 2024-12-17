import {z} from 'zod';

export const CommitSummarySchema = z.object({
            features: z.array(z.string()).describe("The features which were added in this unit of work"),
            summary: z.string().describe("The summary of the unit of work"),
})

export type CommitSummary = z.infer<typeof CommitSummarySchema>