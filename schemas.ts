import { z } from 'zod'

export const CommitStatisticsSchema = z.object({
    fileName:z.string(),
    totalChanges:z.number(),
    numberOfInsertions:z.number(),
    numberOfDeletions:z.number()
})
export const CommitSchema = z.object({
    hash:z.string(),
    message:z.string(),
    date:z.string(),
    username:z.string(),
})

export type Commit = z.infer<typeof CommitSchema>
export type CommitStatisticEntry = z.infer<typeof CommitStatisticsSchema>