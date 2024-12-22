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
    private  agentExecutor: AgentExecutor;
     constructor(

    ) {



        this.parser = StructuredOutputParser.fromZodSchema(CommitSummarySchema)

        this.prompt = new PromptTemplate({
            template: `
            You are a commit analyzer. Follow these steps in order:

             1. Here is the commit information:\n
               - Commit message: {message}
               - Commit hash: {hash}
               - Global stats: {statistics}
             2. Depending on the commit attributes and statistics decide to use the "file_diffs_tool" to get the diffs or the code changes of a specific file in the commit statistics, You can use the tool as many times as needed before proceeding to the next step.\n

             3. Analyse the commit attributes, statistics and code changes to generate a summary of the commit.\n

             4. The final summary should respect the format instructions below.\n

            {format_instructions}
            `,
            inputVariables: ['message', 'hash', 'statistics', 'format_instructions', 'agent_scratchpad'],
        })


        this.llm = new ChatGoogleGenerativeAI({
            modelName: "gemini-2.0-flash-exp",
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

        this.agentExecutor =   AgentExecutor.fromAgentAndTools({
            agent,
            tools,
            //verbose: true,
            callbacks: [
                //new ConsoleCallbackHandler(),
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

        const result = await this.agentExecutor.invoke({
            message: commit.message,
            hash: commit.hash,
            statistics: JSON.stringify(statistics),
            format_instructions: this.parser.getFormatInstructions()
        });
        

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
                    "You can optionally use this tool to see the actual code changes before creating any summary. It shows what was modified in the source files.",
                schema: z.object({
                    filePath: z.string().describe("Path of the source file to examine"),
                    hash: CommitSchema.shape.hash.describe("The commit hash to analyze")
                }),
            }
        );

    }
}