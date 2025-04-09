import type { CommitSummary } from "../commitSummary";
import type { Commit, CommitStatisticEntry } from "../schemas";

export interface AISummaryRenderer {
    renderSummary(
        summariesEntries: {
            commit: Commit;
            statistics: CommitStatisticEntry[];
            summary: CommitSummary;
        }[],
    ): void;
}
