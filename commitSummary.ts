import {z} from 'zod';


export const CommitSummarySchema = z.object({

            changes: z.array(z.object({
                type: z.enum(['feature', 'fix', 'breaking change']).describe("The type of change which were added in this unit of work"),
                description: z.string().describe("The description of the change which were added in this unit of work"),
            })).describe("The change which were added in this unit of work"),

            summary: z.string().describe("The summary of the unit of work"),
})

export type CommitSummary = z.infer<typeof CommitSummarySchema>
