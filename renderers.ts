import { CommitSummary } from "./commitSummary";
import { AIReportRenderer } from "./interfaces/ai-report-renderer";
import { AISummaryRenderer } from "./interfaces/ai-summary-renderer";
import { BulletPoints, Commit, CommitStatisticEntry } from "./schemas";
import chalk from 'chalk';
import { format } from 'date-fns';

export class AIReportConsoleRenderer implements AIReportRenderer {
    renderReport(reports: BulletPoints[]): void {
        reports.forEach((report, index) => {
            if (index > 0) {
                console.log('\n' + '='.repeat(80) + '\n');
            }

            // Print the date header
            const date = new Date(report.date);
            console.log(chalk.bold.blue(`📅 Daily Report Summary - ${format(date, 'MMMM do, yyyy')}\n`));

            // Print Bullet Points
            report.bulletPoints.forEach(point => {
                // Print short description as a header
                console.log(chalk.yellow('• ' + point.short));
                // Print long description indented
                if (point.long !== point.short) {
                    console.log(chalk.dim('  ' + point.long));
                }
                console.log(); // Add spacing between points
            });
        });
    }
}

export class AISummaryConsoleRenderer implements AISummaryRenderer {
    renderSummary(summariesEntries: { commit: Commit; statistics: CommitStatisticEntry[]; summary: CommitSummary; }[]): void {
        summariesEntries.forEach((entry, index) => {
            if (index > 0) {
                console.log('\n' + '─'.repeat(80) + '\n');
            }

            // Commit Header
            console.log(chalk.bold.blue(`📝 Commit ${index + 1} of ${summariesEntries.length}`));
            console.log(chalk.dim(`Hash: ${entry.commit.hash}`));
            console.log(chalk.white(`Author: ${entry.commit.username}`));
            console.log(chalk.white(`Date: ${format(new Date(entry.commit.date), 'MMMM do, yyyy HH:mm:ss')}`));
            console.log(chalk.yellow(`Message: ${entry.commit.message}\n`));

            // Statistics Section
            if (entry.statistics.length > 0) {
                console.log(chalk.bold.cyan('📊 Changes Statistics:'));
                entry.statistics.forEach(stat => {
                    console.log(chalk.dim(`  ${stat.fileName}`));
                    const changes = [];
                    if (stat.numberOfInsertions > 0) changes.push(chalk.green(`+${stat.numberOfInsertions}`));
                    if (stat.numberOfDeletions > 0) changes.push(chalk.red(`-${stat.numberOfDeletions}`));
                    console.log(`    ${changes.join(', ')} (${stat.totalChanges} total)`);
                });
                console.log();
            }

            // AI Summary Section
            if (entry.summary) {
                // Main Summary
                console.log(chalk.bold.magenta('🤖 AI Analysis:'));
                console.log(chalk.white(`  ${entry.summary.summary}\n`));

                // Changes Section
                if (entry.summary.changes.length > 0) {
                    console.log(chalk.bold.yellow('📋 Detailed Changes:'));
                    entry.summary.changes.forEach(change => {
                        const typeColor = {
                            'feature': chalk.green,
                            'fix': chalk.yellow,
                            'breaking change': chalk.red,
                            'refactor': chalk.blue
                        }[change.type];

                        console.log(`  ${typeColor(`[${change.type.toUpperCase()}]`)}`);
                        console.log(chalk.dim(`    ${change.description}`));
                    });
                    console.log();
                }

            }
        });
    }
}

export const aiReportConsoleRenderer = new AIReportConsoleRenderer();
export const aiSummaryConsoleRenderer = new AISummaryConsoleRenderer();