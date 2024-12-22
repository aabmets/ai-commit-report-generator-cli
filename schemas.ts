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
export const BulletPointsSchema = z.object({
    date:z.string().datetime(),
    // hashes:z.array(
    //     z.string().
    //     describe("The commit full hash string")
    // ),
    bulletPoints:z.array(
        z.object({
            short:z.string().describe("The short description of the change"),
            long:z.string().describe("The long description of the change")
        })

    ).describe("Try to include as much information as possible. The more bullet points the better. The number of bullet points should be equal to the number of commits"),
})
export type  BulletPoints = z.infer<typeof BulletPointsSchema>

export type Commit = z.infer<typeof CommitSchema>
export type CommitStatisticEntry = z.infer<typeof CommitStatisticsSchema>