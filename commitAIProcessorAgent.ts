import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from 'zod'
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { Runnable } from "@langchain/core/runnables";
import { CommitSummary, CommitSummarySchema } from "./commitSummary";
import { StringOutputParser } from "@langchain/core/output_parsers";

import { tool } from "@langchain/core/tools";
import { Commit, CommitSchema, CommitStatisticEntry, CommitStatisticsSchema } from "./schemas";
import { fetchDiffs } from "./commitFetcher";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { ConsoleCallbackHandler } from "langchain/callbacks";


export class CommitAIProcessorAgent {

    private readonly llm: ChatGoogleGenerativeAI;
    private readonly prompt: PromptTemplate;
    private readonly parser: StructuredOutputParser<typeof CommitSummarySchema>;
    //@ts-ignore
    private  agent: AgentExecutor;
     constructor(

    ) {



        this.parser = StructuredOutputParser.fromZodSchema(CommitSummarySchema)

        this.prompt = new PromptTemplate({
            template: `
            You are a commit analyzer. Your task is to summarize the commit based on the following information.
            
            IMPORTANT: You MUST use the file_diffs_tool at least once to examine the actual changes in the files.
            This is a mandatory step - do not provide a summary without first checking the diffs.
            
            Here's the commit information:
            1. Commit message: {message}
            2. Commit hash: {hash}
            3. Global stats: {statistics}
            
            Steps to follow:
            1. First, use the file_diffs_tool to examine the changes in at least one modified file
            2. Analyze the diffs and combine with other information
            3. Provide a comprehensive summary following the format instructions
            
            {format_instructions}
            `,
            inputVariables: ['message', 'hash', 'statistics', 'format_instructions', 'agent_scratchpad'],
        })


        this.llm = new ChatGoogleGenerativeAI({
            modelName: "gemini-1.5-pro",
            apiKey: process.env.GOOGLE_API_KEY,
        });

    }
    async init(){

        const tools = [this.getCommitDiffsTool()];
         const agent =await createOpenAIFunctionsAgent({
                llm: this.llm,
                //@ts-ignore
                prompt: this.prompt,
                tools
            })

        this.agent =   AgentExecutor.fromAgentAndTools({
            agent,
            tools,
            verbose: true,
            callbacks: [
                new ConsoleCallbackHandler(),
            ],
        });

    }


    async generateCommitSummary({
        commit,
        statistics

    }: {
        commit: Commit,
        statistics: CommitStatisticEntry[],

    }) {
        console.log("Input:", {
            message: commit.message,
            hash: commit.hash,
            statistics: JSON.stringify(statistics),
        });

        const result = await this.agent.invoke({
            message: commit.message,
            hash: commit.hash,
            statistics: JSON.stringify(statistics),
            format_instructions: this.parser.getFormatInstructions()
        });

        console.log("Raw Agent Output:", result);
        return this.parser.parse(result.output);
    }



    private getCommitDiffsTool() {
        return tool(
            async ({ filePath, hash }) => {
                return fetchDiffs({
                    filePath,
                    hash
                });
            },
            {
                name: "file_diffs_tool",
                verbose: true,
                description:
                    "REQUIRED: This tool must be used to fetch and examine the actual code changes in files. It shows what was added, modified, or removed in the specified file for the given commit hash. You must use this at least once to provide an accurate summary.",
                schema: z.object({
                    filePath: z.string().describe("The path of the file to examine"),
                    hash: CommitSchema.shape.hash.describe("The hash of the commit to analyze")
                }),
            }
        );

    }
}