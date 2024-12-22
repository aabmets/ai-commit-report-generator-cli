import { config as dotenvConfig } from 'dotenv';
import { fetchCommits, fetchCommitsWithStatistics } from './commitFetcher';
import { CommitAIProcessorAgent } from './commitAIProcessorAgent';
import { format } from 'date-fns';
import { promptForOptions } from './prompts';
import dotenv from 'dotenv'
import { Commit, CommitStatisticEntry } from './schemas';
import { CommitSummary } from './commitSummary';
import { JsonStore } from './json-local-cache';
import { DailyReportAIGenerator } from './reportAIGenerator';
import { JsonStoreFactory } from './json-store.factory';
import { generateReportUseCase } from './use-cases/generate-report.use-case';
import { summarizeCommitsUseCase } from './use-cases/summarize-commits.use-case';

dotenv.config();

async function main() {
    const repoPath = "."
    const jsonStoreFactory = new JsonStoreFactory()


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

    const commitsWithSummaries = await summarizeCommitsUseCase(commitsEntries);

    await generateReportUseCase(commitsWithSummaries)



}

main().catch(console.error);
