import { features } from "process";
import { CommitAIProcessorAgent } from "./commitAIProcessorAgent";
import { fetchCommits, fetchCommitsWithStatistics, fetchDiffs, getCommitStatistics } from "./commitFetcher";
import dotenv from 'dotenv';
import { CommitSummary } from "./commitSummary";
import { JsonLocalCache } from "./json-local-cache";

dotenv.config();

async function main() {
    const commitsEntries = await fetchCommitsWithStatistics({path:"../../spitha-blog"})
    console.log(commitsEntries)
    const commitAIProcessorAgent = new CommitAIProcessorAgent()
await commitAIProcessorAgent.init()
    let i =0;
    for(const commit of commitsEntries.slice(0,2)){
        console.log(`Summarizing commit ${++i} of ${commitsEntries.length}`)
        const summary = await commitAIProcessorAgent.generateCommitSummary(commit)
        console.log(summary)

    }



}
main()

