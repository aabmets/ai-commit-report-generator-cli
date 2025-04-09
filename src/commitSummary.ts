import { z } from "zod";

export const CommitSummarySchema = z.object({
    changes: z
        .array(
            z.object({
                type: z
                    .enum(["feature", "fix", "breaking change", "refactor"])
                    .describe("The type of change which were added in this unit of work"),
                description: z
                    .string()
                    .describe(
                        "The description of the change which were added in this unit of work. It should be very detailed",
                    ),
            }),
        )
        .describe("The change which were added in this unit of work"),

    summary: z
        .string()
        .describe(
            "The summary of the unit of work. The summary should be a very detailed paragraph",
        ),
    called_tools: z
        .array(
            z.object({
                name: z.string().describe("The name of the tool which was called"),
                description: z.string().describe("The description of the tool which was called"),
                called_at: z.string().describe("The time the tool was called"),
            }),
        )
        .describe("The tools which were called in this unit of work"),
});

export type CommitSummary = z.infer<typeof CommitSummarySchema>;
