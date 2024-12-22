import { CommitAIProcessorAgent } from "../commitAIProcessorAgent";
import { CommitSummary } from "../commitSummary";
import { JsonStoreFactory } from "../json-store.factory";
import { Commit, CommitStatisticEntry } from "../schemas";
import { ProgressService } from "../services/progress.service";
import { slugify } from "../utils";

const getCommitSummariesKey = (key: string) => `summaries:${key}`
export const summarizeCommitsUseCase = async (commitsEntries: { commit: Commit, statistics: CommitStatisticEntry[] }[],repoPath:string="."): Promise<{ commit: Commit, statistics: CommitStatisticEntry[], summary: CommitSummary }[]> => {

    const jsonStoreFactory = new JsonStoreFactory();
    const cacheStore = await jsonStoreFactory.createOrGetStore(slugify(repoPath));
    const commitAIProcessorAgent = new CommitAIProcessorAgent();
    await commitAIProcessorAgent.init();

    const commitsWithSummaries: { commit: Commit, statistics: CommitStatisticEntry[], summary: CommitSummary }[] = [];

    const progressBar = ProgressService.createProgressBar('Summarizing commits');
    progressBar.start(commitsEntries.length);

    for (const commitEntry of commitsEntries) {
        const cachedSummary = cacheStore.get(getCommitSummariesKey(commitEntry.commit.hash));

        if (cachedSummary) {
            commitsWithSummaries.push({
                commit: commitEntry.commit,
                statistics: commitEntry.statistics,
                //@ts-ignore
                summary: cachedSummary
            });
            progressBar.increment();
            continue;
        }

        const summary = await commitAIProcessorAgent.generateCommitSummary(commitEntry);

        commitsWithSummaries.push({
            commit: commitEntry.commit,
            statistics: commitEntry.statistics,
            summary
        });
        cacheStore.set(getCommitSummariesKey(commitEntry.commit.hash), JSON.stringify(summary));
        progressBar.increment();
    }

    progressBar.stop();
    return commitsWithSummaries;
}
