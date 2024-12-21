import { features } from "process";
import { CommitAIProcessorAgent } from "./commitAIProcessorAgent";
import { fetchCommits, fetchCommitsWithStatistics, fetchDiffs, getCommitStatistics } from "./commitFetcher";
import dotenv from 'dotenv';
import { CommitSummary } from "./commitSummary";
import { JsonLocalCache } from "./json-local-cache";

dotenv.config();

async function main() {
    const commitsEntries = await fetchCommitsWithStatistics()
    const commitAIProcessorAgent = new CommitAIProcessorAgent()
await commitAIProcessorAgent.init()
    const summary = await commitAIProcessorAgent.generateCommitSummary(commitsEntries[0])

    console.log(summary)


}
main()

