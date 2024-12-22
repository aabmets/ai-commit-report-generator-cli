import { StringOutputParser, StructuredOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BulletPoints, BulletPointsSchema, Commit } from "./schemas";
import { CommitSummary } from "./commitSummary";
import { RunnableSequence } from "@langchain/core/runnables";

export class DailyReportAIGenerator{
    private readonly llm: ChatGoogleGenerativeAI;
    private readonly prompt: PromptTemplate;
    private readonly parser: StructuredOutputParser<typeof BulletPointsSchema>
    constructor(){
        this.parser = StructuredOutputParser.fromZodSchema(BulletPointsSchema)
        this.prompt =  new PromptTemplate({
            template:`
            You are a software engineer working on a project. Your task is to generate a weekly report for your team.\n
            Follow these steps in order:
             1. Analyse your commit list with their summaries and changes:\n
              {commits}
             2. Generate a bullet point report for your daily outcomes and achievements:\n
             3. Respect the format instructions below:\n
             {format_instructions}
            `,
            inputVariables:[
                'commits',
                'format_instructions'

            ]

        })
        this.llm = new ChatGoogleGenerativeAI({

            apiKey: process.env.GOOGLE_API_KEY,
            modelName: "gemini-2.0-flash-exp",
        })



    }
    generateReport(data:{commit:Commit, summary:CommitSummary}[]){


        return this.buildChain().invoke({
            commits:data.map(d=>
                `
                - Commit: ${d.commit.hash}\n
                **Date**:\n
                ${d.commit.date}\n
                **Message**:\n
                ${d.commit.message}\n
                **Summary**:\n
                ${d.summary.summary}\n
                **Changes**\n
                ${d.summary.changes.map(f=>
                    `
                    - ${f}
                    `).join('\n')}
                `).join('\n'),
            format_instructions: this.parser.getFormatInstructions()

        })
        }

    private buildChain(){
        return  RunnableSequence.from([
            this.prompt,
            this.llm,
            this.parser,

        ])

    }

}