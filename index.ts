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
    return
    const commitAIProcessorAgent = new CommitAIProcessorAgent()
await commitAIProcessorAgent.init()
    for(const commit of commitsEntries){
        console.log("generating the first summary")
        const summary = await commitAIProcessorAgent.generateCommitSummary(commit)
        console.log(summary)

    }



}
main()

