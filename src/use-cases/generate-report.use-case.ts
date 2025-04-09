import { format } from "date-fns";
import type { CommitSummary } from "../commitSummary";
import { JsonStoreFactory } from "../json-store.factory";
import { DailyReportAIGenerator } from "../reportAIGenerator";
import type { Commit, CommitStatisticEntry } from "../schemas";
import { ProgressService } from "../services/progress.service";
import { slugify } from "../utils";

export async function generateReportUseCase(
    commitsWithSummaries: {
        commit: Commit;
        statistics: CommitStatisticEntry[];
        summary: CommitSummary;
    }[],
    repoPath = ".",
) {
    const storeFactory = JsonStoreFactory.getInstance();
    const cacheStore = await storeFactory.createOrGetStore(slugify(repoPath));

    // generate report
    const groupedByDate = commitsWithSummaries.reduce(
        (acc, { commit, statistics, summary }) => {
            const date = format(new Date(commit.date), "yyyy-MM-dd");
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push({ commit, statistics, summary });
            return acc;
        },
        {} as Record<string, typeof commitsWithSummaries>,
    );

    const dates = Object.keys(groupedByDate);
    const progressBar = ProgressService.createProgressBar("Generating daily reports");
    progressBar.start(dates.length);

    const dailyReportAIGenerator = new DailyReportAIGenerator();

    for (const date of dates) {
        const commitsEntries = groupedByDate[date];
        const reportKey = `reports:${date}`;
        const cachedReport = cacheStore.get(reportKey);

        if (cachedReport) {
            progressBar.increment();
            continue;
        }

        const report = await dailyReportAIGenerator.generateReport(commitsEntries);
        cacheStore.set(reportKey, report);
        progressBar.increment();
    }

    progressBar.stop();
}
