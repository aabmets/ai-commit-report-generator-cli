import { config as dotenvConfig } from 'dotenv';
import { fetchCommitsWithStatistics } from './commitFetcher';
import { CommitAIProcessorAgent } from './commitAIProcessorAgent';
import { format } from 'date-fns';
import { promptForOptions } from './prompts';
import dotenv from 'dotenv'

dotenv.config();

async function main() {
    const repoPath = "../../../bareedbox/NewBareedBox";
    const options = await promptForOptions(repoPath);
    
    console.log(`Fetching commits from ${format(options.dateRange.startDate, 'yyyy-MM-dd')} to ${format(options.dateRange.endDate, 'yyyy-MM-dd')}`);
    if (options.username) {
        console.log(`Filtering for author: ${options.username}`);
    }
    
    const commitsEntries = await fetchCommitsWithStatistics({
        path: repoPath,
        filters: {
            dateRange: options.dateRange,
            username: options.username
        }
    });

    console.log(`Found ${commitsEntries.length} commits in the specified date range`);
    
    const commitAIProcessorAgent = new CommitAIProcessorAgent();
    await commitAIProcessorAgent.init();
    
    let i = 0;
    for (const commit of commitsEntries.slice(0, 10)) {
        console.log(`Summarizing commit ${++i} of ${commitsEntries.length}`);
        const summary = await commitAIProcessorAgent.generateCommitSummary(commit);
        console.log(summary);
    }
}

main().catch(console.error);
