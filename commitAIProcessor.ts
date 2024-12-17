import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RunnableSequence } from "@langchain/core/runnables";
import { Commit, CommitDiff } from "./types/commit";
import { z } from 'zod'
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { Runnable } from "@langchain/core/runnables";
import { CommitSummary, CommitSummarySchema } from "./commitSummary";
import { StringOutputParser } from "@langchain/core/output_parsers";


export class CommitAIProcessor {

    private readonly llm: ChatGoogleGenerativeAI;
    private readonly prompt: PromptTemplate;
    private readonly parser: StructuredOutputParser<typeof CommitSummarySchema>;
    constructor(

    ) {

        this.parser = StructuredOutputParser.fromZodSchema(CommitSummarySchema)

        this.prompt = new PromptTemplate({
            template: `
            Summarize this commit given the commit message, the global stats, and the file diffs  independently from any technical details.
: 
            1. Commit message: {message}\n
            {message} 
            2. Global stats: {globalStats}\n
            {globalStats}
            3. File diffs: {fileDiffs}\n
            {fileDiffs}\n
            {format_instructions}
            `,
            inputVariables: ['message', 'globalStats', 'fileDiffs','format_instructions'],
            outputParser: this.parser,
        })
        this.llm = new ChatGoogleGenerativeAI({
            model: "gemini-1.5-pro",
            temperature: 0,
            maxRetries: 2,
            json: true,


        });


    }


    generateCommitSummary({
        commit,
        commitDiff

    }:{
        commit:Commit,
        commitDiff:CommitDiff

    }) {

        return this.getFinalChain().invoke({
            message: commit.message,
            globalStats: commitDiff.globalStats,
            fileDiffs: commitDiff.fileDiffs.map(f => f.trim()).join('\n'),
            format_instructions: this.parser.getFormatInstructions()

        })

    }



    private getFinalChain() {
        console.log(this.parser.getFormatInstructions())
        return RunnableSequence.from(
            [
                this.prompt,
                this.llm,
                this.parser
            ]
        )

    }
}