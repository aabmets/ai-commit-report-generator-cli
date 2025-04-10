import { format } from "date-fns";
import dotenv from "dotenv";
import inquirer from "inquirer";
import { fetchCommitsWithStatistics } from "../commitFetcher";
import type { CommitSummary } from "../commitSummary";
import { JsonStoreFactory } from "../json-store.factory";
import { promptForScanFilteringOptions } from "../prompts";
import { aiReportConsoleRenderer, aiSummaryConsoleRenderer } from "../renderers";
import type { BulletPoints, Commit, CommitStatisticEntry } from "../schemas";
import { generateReportUseCase } from "../use-cases/generate-report.use-case";
import { summarizeCommitsUseCase } from "../use-cases/summarize-commits.use-case";
import { slugify } from "../utils";

// const APP_DESCRIPTION = `
// 🚀 Welcome to GitHub Weekly Report Generator!
//
// This CLI tool helps you generate insightful weekly reports from your GitHub commits.
// It uses AI to analyze your commits and create meaningful summaries and technical reports.
// `;

export type MenuOption = "scan" | "technical-summary" | "display-report" | "exit";

export class MenuService {
    async start(): Promise<void> {
        while (true) {
            const option = await this.showMainMenu();
            await this.handleOption(option);

            if (option === "exit") {
                break;
            }

            await this.waitForConfirmation();
        }
    }

    private async showMainMenu(): Promise<MenuOption> {
        console.clear();

        const { option } = await inquirer.prompt([
            {
                type: "list",
                name: "option",
                message: "What would you like to do?",
                choices: [
                    { name: "Run Repository Scan", value: "scan" },
                    { name: "Display Technical Summary", value: "technical-summary" },
                    { name: "Display Report", value: "display-report" },
                    { name: "Exit", value: "exit" },
                ],
            },
        ]);

        return option;
    }

    private async waitForConfirmation(): Promise<void> {
        await inquirer.prompt([
            {
                type: "input",
                name: "continue",
                message: "Press Enter to continue...",
            },
        ]);
    }

    private async handleOption(option: MenuOption): Promise<void> {
        switch (option) {
            case "scan":
                await this.handleScan();
                break;
            case "technical-summary":
                await this.handleTechnicalSummary();
                break;
            case "display-report":
                await this.handleDisplayReport();
                break;
            case "exit":
                console.info("👋 Goodbye!");
                break;
            default:
                break;
        }
    }

    private async ensureGoogleApiKey(): Promise<void> {
        dotenv.config();

        if (!process.env.GOOGLE_API_KEY) {
            const { apiKey } = await inquirer.prompt([
                {
                    type: "input",
                    name: "apiKey",
                    message: "Please enter your Google API Key:",
                    validate: (input: string) => {
                        if (!input.trim()) {
                            return "API Key is required";
                        }
                        return true;
                    },
                },
            ]);

            // Write to .env file
            const fs = require("node:fs");
            const path = require("node:path");
            const envFile = path.join(__dirname, "..", ".env");
            fs.appendFileSync(envFile, `\nGOOGLE_API_KEY=${apiKey}`);
            process.env.GOOGLE_API_KEY = apiKey;
        }
    }

    private async handleScan(): Promise<void> {
        await this.ensureGoogleApiKey();

        const { repoPath } = await inquirer.prompt([
            {
                type: "list",
                name: "repoPath",
                message: "Which repository would you like to scan?",
                choices: [
                    { name: "Current Directory (.)", value: "." },
                    { name: "Specify Custom Path", value: "custom" },
                ],
            },
        ]);

        let finalPath = ".";
        if (repoPath === "custom") {
            const { customPath } = await inquirer.prompt([
                {
                    type: "input",
                    name: "customPath",
                    message: "Enter the path to the repository:",
                    validate: (input: string) => {
                        if (!input.trim()) {
                            return "Path is required";
                        }
                        return true;
                    },
                },
            ]);
            finalPath = customPath;
        }

        const options = await promptForScanFilteringOptions(finalPath);

        console.info(
            `Fetching commits from ${format(options.dateRange.startDate, "yyyy-MM-dd")} to ${format(options.dateRange.endDate, "yyyy-MM-dd")}`,
        );

        const commitsEntries = await fetchCommitsWithStatistics({
            path: finalPath,
            filters: {
                dateRange: options.dateRange,
                username: options.username,
            },
        });

        console.info(`Found ${commitsEntries.length} commits in the specified date range`);

        const commitsWithSummaries = await summarizeCommitsUseCase(commitsEntries);

        await generateReportUseCase(commitsWithSummaries);
    }

    private async handleTechnicalSummary(): Promise<void> {
        const jsonFactory = JsonStoreFactory.getInstance();
        const cacheStore = await jsonFactory.createOrGetStore(slugify("."));
        console.dir(cacheStore.getAll("summaries"), { depth: 4 });
        const hashes = cacheStore.getKeys("summaries").map((e) => e.split(":")[1]);
        const commitsWithStatistics = await fetchCommitsWithStatistics({ filters: { hashes } });

        const cachedSummaries = commitsWithStatistics.map((e) => ({
            commit: e.commit,
            statistics: e.statistics,
            summary: cacheStore.get(`summaries:${e.commit.hash}`),
        })) as { commit: Commit; statistics: CommitStatisticEntry[]; summary: CommitSummary }[];
        aiSummaryConsoleRenderer.renderSummary(cachedSummaries);
    }

    private async handleDisplayReport(): Promise<void> {
        const jsonFactory = JsonStoreFactory.getInstance();
        const cacheStore = await jsonFactory.createOrGetStore(slugify("."));
        const reports = cacheStore.getAll("report").map((e) => e[1]) as BulletPoints[];
        aiReportConsoleRenderer.renderReport(reports);
    }
}
