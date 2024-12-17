import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RunnableSequence } from "@langchain/core/runnables";
import { Commit } from "./types/commit";
import {z } from 'zod'
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { Runnable } from "@langchain/core/runnables";
import { CommitSummary, CommitSummarySchema } from "./commitSummary";


export class CommitAIProcessor{

        private readonly llm:ChatGoogleGenerativeAI;
        private readonly prompt:PromptTemplate;
        private readonly parser:StructuredOutputParser<typeof CommitSummarySchema>;
    constructor(
        commit:Commit,

    ){

        this.parser = new StructuredOutputParser(CommitSummarySchema)

        this.prompt = new PromptTemplate({
            template: `
            Summarize this commit given the commit message independently of any technical details.
: 
            {commitMessage} 
            `,
            inputVariables: ['message'],
            outputParser:this.parser
            
        })
        this.llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-pro",
  temperature: 0,
  maxRetries: 2,
  json:true,

});


    }


    generateCommitSummary(commit:Commit){

        return  this.getFinalChain().invoke({
            message:commit.message,
        })

    }



    private  getFinalChain(){
        return RunnableSequence.from(
            [
                this.prompt,
                this.llm,
                this.parser
            ]
        )

    }
}