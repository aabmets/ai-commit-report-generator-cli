import { AIReportRenderer } from "./interfaces/ai-report-renderer";
import { BulletPoints } from "./schemas";
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

export const consoleRenderer = new AIReportConsoleRenderer();