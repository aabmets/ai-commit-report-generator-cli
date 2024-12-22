import { CommitSummary } from "../commitSummary";
import { Commit, CommitStatisticEntry } from "../schemas";

export interface AISummaryRenderer {
    renderSummary(summariesEntries:{ commit: Commit, statistics: CommitStatisticEntry[], summary: CommitSummary }[]): void

}