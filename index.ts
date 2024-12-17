import { features } from "process";
import { CommitAIProcessor } from "./commitAIProcessor";
import { fetchCommits, getCommitDifs } from "./commitFetcher";
import { Commit, CommitDiff } from "./types/commit";
import dotenv from 'dotenv';
import { CommitSummary } from "./commitSummary";

dotenv.config();

async function main(){

const commits = await fetchCommits({})

const commitsWithDifs:{commit:Commit,commitDiff:CommitDiff}[] = [];

for(const commit of commits){
    console.log("fetching commit ",commit.hash)
    const commitDiff = await getCommitDifs(commit);
    commitsWithDifs.push({commit,commitDiff})
}



const commitsWithSummaries:{commit:Commit,summary:CommitSummary}[]= []

const commitAIProcessor = new CommitAIProcessor()
for(const { commit,commitDiff } of commitsWithDifs){

    //const summary = await commitAIProcessor.generateCommitSummary({commit,commitDiff})
    const mockSummary = {
        summary:"this is a summary of the commit",
        features:["feature1","feature2"]
    }
commitsWithSummaries.push({commit,summary:mockSummary})

    }
    // generating the report 


}
main()

