import {z} from 'zod';

export const CommitSummarySchema = z.object({
            feature: z.string().describe("The feature which is added in this unit of work"),
            summary: z.string().describe("The summary of the unit of work"),
})

export type CommitSummary = z.infer<typeof CommitSummarySchema>