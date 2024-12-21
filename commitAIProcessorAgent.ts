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
            You are a commit analyzer. Follow these steps in order:

            1. Here is the commit information:
               - Commit message: {message}
               - Commit hash: {hash}
               - Global stats: {statistics}

            2. REQUIRED: Before creating any summary, you must first use the file_diffs_tool 
               to check the actual changes in the source files.
               
            3. Only after examining the actual code changes with file_diffs_tool, 
               create your summary following these format instructions:
               {format_instructions}

            DO NOT PROCEED TO STEP 3 BEFORE COMPLETING STEP 2.
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

        const result = await this.agent.invoke({
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
                    "REQUIRED STEP: You must use this tool to see the actual code changes before creating any summary. It shows what was modified in the source files.",
                schema: z.object({
                    filePath: z.string().describe("Path of the source file to examine"),
                    hash: CommitSchema.shape.hash.describe("The commit hash to analyze")
                }),
            }
        );

    }
}