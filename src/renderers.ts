import chalk from "chalk";
import { format } from "date-fns";
import type { CommitSummary } from "./commitSummary";
import type { AIReportRenderer } from "./interfaces/ai-report-renderer";
import type { AISummaryRenderer } from "./interfaces/ai-summary-renderer";
import type { BulletPoints, Commit, CommitStatisticEntry } from "./schemas";

export class AIReportConsoleRenderer implements AIReportRenderer {
    renderReport(reports: BulletPoints[]): void {
        reports.forEach((report, index) => {
            if (index > 0) {
                console.info(`\n${"=".repeat(80)}\n`);
            }

            // Print the date header
            const date = new Date(report.date);
            console.info(
                chalk.bold.blue(`📅 Daily Report Summary - ${format(date, "MMMM do, yyyy")}\n`),
            );

            // Print Bullet Points
            report.bulletPoints.forEach((point) => {
                // Print short description as a header
                console.info(chalk.yellow(`• ${point.short}`));
                // Print long description indented
                if (point.long !== point.short) {
                    console.info(chalk.dim(`  ${point.long}`));
                }
                console.info(); // Add spacing between points
            });
        });
    }
}

export class AISummaryConsoleRenderer implements AISummaryRenderer {
    renderSummary(
        summariesEntries: {
            commit: Commit;
            statistics: CommitStatisticEntry[];
            summary: CommitSummary;
        }[],
    ): void {
        summariesEntries.forEach((entry, index) => {
            if (index > 0) {
                console.info(`\n${"─".repeat(80)}\n`);
            }

            // Commit Header
            console.info(chalk.bold.blue(`📝 Commit ${index + 1} of ${summariesEntries.length}`));
            console.info(chalk.dim(`Hash: ${entry.commit.hash}`));
            console.info(chalk.white(`Author: ${entry.commit.username}`));
            console.info(
                chalk.white(
                    `Date: ${format(new Date(entry.commit.date), "MMMM do, yyyy HH:mm:ss")}`,
                ),
            );
            console.info(chalk.yellow(`Message: ${entry.commit.message}\n`));

            // Statistics Section
            if (entry.statistics.length > 0) {
                console.info(chalk.bold.cyan("📊 Changes Statistics:"));
                entry.statistics.forEach((stat) => {
                    console.info(chalk.dim(`  ${stat.fileName}`));
                    const changes = [];
                    if (stat.numberOfInsertions > 0) {
                        changes.push(chalk.green(`+${stat.numberOfInsertions}`));
                    }
                    if (stat.numberOfDeletions > 0) {
                        changes.push(chalk.red(`-${stat.numberOfDeletions}`));
                    }
                    console.info(`    ${changes.join(", ")} (${stat.totalChanges} total)`);
                });
                console.info();
            }

            // AI Summary Section
            if (entry.summary) {
                // Main Summary
                console.info(chalk.bold.magenta("🤖 AI Analysis:"));
                console.info(chalk.white(`  ${entry.summary.summary}\n`));

                // Changes Section
                if (entry.summary.changes.length > 0) {
                    console.info(chalk.bold.yellow("📋 Detailed Changes:"));
                    entry.summary.changes.forEach((change) => {
                        const typeColor = {
                            feature: chalk.green,
                            fix: chalk.yellow,
                            "breaking change": chalk.red,
                            refactor: chalk.blue,
                        }[change.type];

                        console.info(`  ${typeColor(`[${change.type.toUpperCase()}]`)}`);
                        console.info(chalk.dim(`    ${change.description}`));
                    });
                    console.info();
                }
            }
        });
    }
}

export const aiReportConsoleRenderer = new AIReportConsoleRenderer();
export const aiSummaryConsoleRenderer = new AISummaryConsoleRenderer();
