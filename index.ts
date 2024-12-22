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

dotenv.config();

const getCommitSummariesKey = (key: string) => `summaries:${key}`
const getAIReportKey = (commits:Commit[]) => `reports:${commits.map(c=>c.hash).join(',')}`
async function main() {
    const repoPath = "."
    const jsonStoreFactory = new JsonStoreFactory()

    const cacheStore = await jsonStoreFactory.createStore("report-generation-app")

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
    const commitsWithSummaries: { commit: Commit, statistics: CommitStatisticEntry[], summary: CommitSummary }[] = []

    const commitAIProcessorAgent = new CommitAIProcessorAgent();
    await commitAIProcessorAgent.init();

    let i = 0;

    for (const commitEntry of commitsEntries) {
        console.log(`Summarizing commit ${++i} of ${commitsEntries.length}`);
        const cachedSummary = cacheStore.get(getCommitSummariesKey(commitEntry.commit.hash))
        if (cachedSummary) {
            console.log("Cached");
            commitsWithSummaries.push({
                commit: commitEntry.commit,
                statistics: commitEntry.statistics,
                //@ts-ignore
                summary:cachedSummary
            })
            continue;
        }

        const summary = await commitAIProcessorAgent.generateCommitSummary(commitEntry);

        commitsWithSummaries.push({
            commit: commitEntry.commit,
            statistics: commitEntry.statistics,
            summary
        })
        cacheStore.set(getCommitSummariesKey(commitEntry.commit.hash), JSON.stringify(summary))
    }

        // generate report
    const groupedByDate = commitsWithSummaries.reduce((acc,{commit,statistics,summary})=>{

        if(!acc[commit.date]){
            acc[commit.date] = []
        }
            acc[commit.date].push({commit,statistics,summary})

        return acc

    },{} as Record<string,{commit:Commit,statistics:CommitStatisticEntry[],summary:CommitSummary}[]>)

    
    for( const [key,value] of Object.entries(groupedByDate)){
        console.info(`Generating report for date: ${key}`)

        const dailyReportAIGenerator = new DailyReportAIGenerator()

        const reportKey = `reports:${key}`
        const cachedReport = cacheStore.get(reportKey)

        if (cachedReport) {
        console.log(`The report for the commits ${reportKey}  is already cached`);

        console.log(`summary----------------------------`)
        console.dir(value,{depth:10})
        console.log("report-----------------------------------")
        console.dir(cachedReport,{depth:10})
        continue
        }

        const report = await dailyReportAIGenerator.generateReport(value)
        console.log(`summary----------------------------`)
        console.dir(value,{depth:10})
        console.log("report-----------------------------------")
        console.dir(report,{depth:10})

        cacheStore.set(reportKey,report)
}



}

main().catch(console.error);
